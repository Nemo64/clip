import { ffmpeg, sanitizeFileName } from "./ffmpeg";
import {
  estimateH264Size,
  ConvertedVideo,
  createResolution,
  Format,
  KnownVideo,
  ContainerFormat,
} from "./video";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import {
  calculateDuration,
  ConvertInstructions,
  toTargetFormat,
} from "./video_convert_format";

export interface ProgressEvent {
  percent: number;
  message?: string;
}

/**
 * Create ffmpeg commands
 */
export function createCommands(
  video: KnownVideo,
  instructions: ConvertInstructions
) {
  const fileName = sanitizeFileName(video.file.name);
  const baseName = fileName.replace(/\.\w{2,4}$|$/, "");

  const args: string[] = [];
  args.push("-sn"); // no subtitles
  args.push("-dn"); // no data streams

  if (instructions.video.codec.startsWith("h264")) {
    if (instructions.audio.codec.startsWith("none")) {
      args.push("-an"); // no audio
      args.push(...inputArguments(video, instructions));
      args.push(...h264Arguments(video.metadata, instructions));
    } else if (instructions.audio.codec.startsWith("aac")) {
      args.push(...inputArguments(video, instructions));
      args.push(...h264Arguments(video.metadata, instructions));
      args.push(...aacArguments(video.metadata, instructions));
    } else {
      throw new Error(`Unsupported audio codec: ${instructions.audio.codec}`);
    }

    args.push("-f", "mp4"); // use mp4 since it has the best compatibility as long as all streams are supported
    args.push("-movflags", "+faststart"); // moves metadata to the beginning of the mp4 container ~ useful for streaming
    args.push(`${baseName}.clip.mp4`);

    return [{ args: args, file: `${baseName}.clip.mp4`, type: "video/mp4" }];
  }

  if (instructions.video.codec.startsWith("gif")) {
    args.push("-an"); // no audio

    // phase1: create color palette
    const args1 = args.slice();
    args1.push("-skip_frame", "nokey"); // palette does not need all frames
    args1.push(...inputArguments(video, instructions));
    const palettegenFilters = [
      ...cropScaleFilter(video.metadata, instructions),
      `palettegen=stats_mode=diff`,
    ];
    args1.push("-vf", palettegenFilters.join(","));
    args1.push(`${baseName}.palette.png`);

    // phase2: create gif
    const args2 = args.slice();
    args2.push(...inputArguments(video, instructions));
    args2.push("-i", `${baseName}.palette.png`); // the palette
    const paletteuseFilters = [
      `fps=100/6`,
      ...cropScaleFilter(video.metadata, instructions),
      `mpdecimate=lo=64:frac=0.1`,
      `paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`,
    ];
    args2.push("-filter_complex", paletteuseFilters.join(","));
    args2.push(`${baseName}.clip.gif`);

    return [
      { args: args1, file: `${baseName}.palette.png`, type: "image/png" },
      { args: args2, file: `${baseName}.clip.gif`, type: "image/gif" },
    ];
  }

  throw new Error(`Unsupported video codec: ${instructions.video.codec}`);
}

/**
 * Starts the converting process from a known video using the given format.
 */
export async function convertVideo(
  video: KnownVideo,
  convertFormat: ConvertInstructions,
  onProgress: (progress: ProgressEvent) => void
): Promise<ConvertedVideo> {
  const commands = createCommands(video, convertFormat);
  const targetFormat = toTargetFormat(convertFormat);

  let instance: FFmpeg;
  for (let i = 0; i < commands.length; ++i) {
    instance = await ffmpeg({
      files: inputFiles(video, convertFormat),
      args: commands[i].args,
      logger: loggerToProgress(
        targetFormat.container.duration * (0 - i),
        targetFormat.container.duration * (commands.length - i),
        onProgress
      ),
    }).promise;
  }

  const { file: fileName, type } = commands[commands.length - 1];
  const uint8Array = instance!.FS("readFile", fileName);
  const file = new File([uint8Array], fileName, { type: type });

  for (const command of commands) {
    instance!.FS("unlink", command.file);
  }

  return {
    status: "converted",
    file: file,
    metadata: targetFormat,
  };
}

export function createThumbnails(
  video: KnownVideo,
  interval: number
): AsyncIterableIterator<File> {
  const args: string[] = [];

  // use some tricks to decode faster for the preview
  args.push("-skip_frame", interval >= 2 ? "nokey" : "default", "-vsync", "2");
  args.push("-flags2", "fast"); // https://stackoverflow.com/a/54873148

  const { width, height } = createResolution(video.metadata, 640, 360);
  args.push("-an"); // no audio
  args.push("-sn"); // no subtitles
  args.push("-dn"); // no data streams
  args.push("-i", sanitizeFileName(video.file.name));
  args.push("-vf", `fps=1/${interval},scale=${width}:${height}:flags=bilinear`);
  args.push("-f", `image2`);
  args.push("frame_%d.png");

  const run = ffmpeg({ files: [video.file], args });

  return (async function* () {
    const instance = await run.instance;
    const frames = Math.ceil(video.metadata.container.duration / interval);
    let done = false;
    let lastFrame = Date.now();
    for (let i = 1; i <= frames; ) {
      try {
        const blob = instance.FS("readFile", `frame_${i}.png`);
        if (blob.length <= 0) {
          console.warn(`frame_${i}.png is empty`);
          throw new Error(`frame_${i}.png is empty`);
        }
        instance.FS("unlink", `frame_${i}.png`);
        i++;
        yield new File([blob], `frame_${i}.png`, { type: "image/png" });
        lastFrame = Date.now();
      } catch {
        if (lastFrame + 10000 < Date.now()) {
          console.error("generate thumbnails timeout", lastFrame);
          break;
        } else if (done) {
          i++; // increase even with read error
        } else {
          const resolve = await Promise.race([
            new Promise((r) => setTimeout(r, 200, "timer")),
            run.promise,
          ]);
          done = resolve !== "timer";
        }
      }
    }
  })();
}

/**
 * This function converts the logger events from ffmpeg
 * into a generic {@see ProgressEvent} based on the timing.
 *
 * This can also be used to abstract away 2 pass encodings
 */
function loggerToProgress(
  timeFrom: number,
  timeTo: number,
  onProgress: (progress: ProgressEvent) => void
): Parameters<typeof ffmpeg>[0]["logger"] {
  return ({ message }) => {
    // example line: frame= 1199 fps= 23 q=31.0 size=    4096kB time=00:00:40.26 bitrate= 833.4kbits/s dup=0 drop=685 speed=0.773x
    const match = message?.match(/time=\s*(?<time>\d+:\d+:\d+\.\d+)/);
    if (match?.groups?.time) {
      const time = match.groups.time
        .split(":")
        .map(parseFloat)
        .reduce((acc, val) => acc * 60 + val);
      onProgress({
        percent: ((time - timeFrom) / (timeTo - timeFrom)) * 100,
        message: message,
      });
    }
  };
}

function inputArguments(video: KnownVideo, target: ConvertInstructions) {
  const fileName = sanitizeFileName(video.file.name);
  const args: string[] = [];

  if (target.containers.length === 1) {
    args.push(...seekArguments(video.metadata.container, target.containers[0]));
    args.push("-i", fileName);
    return args;
  }

  args.push("-safe", "0"); // allow unsafe file paths
  args.push("-f", "concat");
  args.push("-i", "concat.txt");
  return args;
}

function inputFiles(video: KnownVideo, format: ConvertInstructions): File[] {
  if (format.containers.length === 1) {
    return [video.file];
  }

  const concatFile = new File([createConcatFile(video, format)], "concat.txt", {
    type: "text/plain",
  });

  return [video.file, concatFile];
}

export function createConcatFile(
  video: KnownVideo,
  format: ConvertInstructions
) {
  const concat = ["ffconcat version 1.0"];
  for (const container of format.containers) {
    const end = container.start + container.duration;
    concat.push(`\nfile '${sanitizeFileName(video.file.name)}'`);
    concat.push(`inpoint ${container.start.toFixed(3)}`);
    concat.push(`outpoint ${end.toFixed(3)}`);
  }
  return concat.join("\n");
}

function seekArguments(source: ContainerFormat, target: ContainerFormat) {
  const args: string[] = [];

  // TODO: check what it means if the source video has a start time !== 0
  if (target.start > source.start) {
    args.push("-ss", target.start.toFixed(3));
  }

  if (target.duration < source.duration - target.start) {
    args.push("-t", target.duration.toFixed(3));
  }

  return args;
}

function cropScaleFilter(
  source: Format,
  target: ConvertInstructions
): string[] {
  const filters: string[] = [];

  // autorotate does not work when using the concat source
  // https://trac.ffmpeg.org/ticket/10000
  if (target.containers.length !== 1) {
    switch (target.video.rotation - source.video.rotation) {
      case 90:
      case -270:
        filters.push("transpose=1");
        break;
      case 180:
      case -180:
        filters.push("hflip,vflip");
        break;
      case 270:
      case -90:
        filters.push("transpose=2");
        break;
    }
  }

  filters.push(
    `scale=${target.video.width}:${target.video.height}:flags=bilinear`
  );
  return filters;
}

function h264Arguments(source: Format, target: ConvertInstructions) {
  const args: string[] = [];
  const isLargeTarget = target.video.width * target.video.height > 500_000;

  if (target.video.original) {
    args.push("-c:v", "copy");
    return args;
  }

  const filter = [
    `fps=${target.video.fps}`,
    ...cropScaleFilter(source, target),
    `format=${target.video.color}`,
  ];

  args.push("-vf", filter.join(","));
  args.push("-c:v", "libx264");
  args.push("-preset:v", isLargeTarget ? "fast" : "medium");
  // args.push('-level:v', '4.0'); // https://en.wikipedia.org/wiki/Advanced_Video_Coding#Levels
  args.push("-profile:v", "high");

  const bufferDuration = Math.min(10, calculateDuration(target) / 4);
  if (target.video.crf) {
    const bitrate = estimateH264Size(target.video, target.video.crf - 5);
    const bufsize = Math.floor(bitrate * bufferDuration);
    args.push("-crf:v", target.video.crf.toString());
    args.push("-maxrate:v", `${bitrate}k`);
    args.push("-bufsize:v", `${bufsize}k`);
  } else if (target.video.bitrate) {
    const bitrate = target.video.bitrate;
    const bufsize = Math.floor(bitrate * bufferDuration);
    args.push("-b:v", `${bitrate}k`);
    args.push("-maxrate:v", `${bitrate}k`);
    args.push("-bufsize:v", `${bufsize}k`);
  } else {
    throw new Error("No video bitrate or crf specified");
  }

  return args;
}

function aacArguments(source: Format, target: ConvertInstructions) {
  const args: string[] = [];
  args.push("-async", "1");

  if (target.audio.original) {
    args.push("-c:a", "copy");
    return args;
  }

  const aformat = [
    `sample_rates=${target.audio.sampleRate}`,
    `channel_layouts=${target.audio.channelSetup}`,
  ];

  args.push("-af", `aformat=${aformat.join(":")}`);
  args.push("-c:a", "libfdk_aac");
  args.push("-b:a", `${target.audio.bitrate}k`);
  if (target.audio.bitrate <= 48) {
    args.push("-profile:a", "aac_he_v2");
  } else if (target.audio.bitrate <= 72) {
    args.push("-profile:a", "aac_he");
  }

  return args;
}
