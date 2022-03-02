import { ffmpeg } from "./ffmpeg";
import { ConvertedVideo, createResolution, Format, KnownVideo } from "./video";

export interface ProgressEvent {
  percent: number;
  message?: string;
}

/**
 * Starts the converting process from a known video using the given format.
 */
export async function convertVideo(
  { file, metadata }: KnownVideo,
  format: Format,
  onProgress: (progress: ProgressEvent) => void
): Promise<ConvertedVideo> {
  const fileName = sanitizeFileName(file.name);
  const safeBaseName = fileName.replace(/\.\w{2,4}$|$/, ".clip");
  const args: string[] = ["-hide_banner", "-y", "-sws_flags", "bilinear"];

  args.push(...seekArguments(metadata, format));
  args.push("-sn"); // no subtitles
  args.push("-dn"); // no data streams

  if (format.video.codec.startsWith("h264")) {
    if (format.audio.codec.startsWith("none")) {
      args.push("-an"); // no audio
      args.push("-i", fileName);
      args.push(...h264Arguments(metadata, format));
    } else if (format.audio.codec.startsWith("aac")) {
      args.push("-i", fileName);
      args.push(...aacArguments(metadata, format));
      args.push(...h264Arguments(metadata, format));
    } else {
      throw new Error(`Unsupported audio codec: ${format.audio.codec}`);
    }

    args.push("-f", "mp4"); // use mp4 since it has the best compatibility as long as all streams are supported
    args.push("-movflags", "+faststart"); // moves metadata to the beginning of the mp4 container ~ useful for streaming
    args.push(`${safeBaseName}.mp4`);

    const logger = loggerToProgress(0, format.container.duration, onProgress);
    const instance = await ffmpeg({ file, args, logger }).promise;
    const result = instance.FS("readFile", `${safeBaseName}.mp4`);
    instance.FS("unlink", `${safeBaseName}.mp4`);

    return {
      status: "converted",
      file: new File([result], `${safeBaseName}.mp4`, { type: "video/mp4" }),
      metadata: format,
    };
  }

  if (format.video.codec.startsWith("gif")) {
    args.push("-an"); // no audio

    // phase1: create color palette
    const args1 = args.slice();
    args1.push("-skip_frame", "nokey"); // palette does not need all frames
    args1.push("-i", fileName);
    args1.push(
      "-vf",
      [
        `scale=${format.video.width}:${format.video.height}`,
        `palettegen=stats_mode=diff`,
      ].join(",")
    );
    args1.push(`${safeBaseName}.png`);
    const l1 = loggerToProgress(0, format.container.duration / 0.2, onProgress);
    await ffmpeg({ file, args: args1, logger: l1 }).promise;

    // phase2: create gif
    const args2 = args.slice();
    args2.push("-i", fileName);
    args2.push("-i", `${safeBaseName}.png`); // the palette
    args2.push(
      "-filter_complex",
      [
        `fps=100/6`,
        `scale=${format.video.width}:${format.video.height}`,
        `mpdecimate=lo=64:frac=0.1`,
        `paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`,
      ].join(",")
    );
    args2.push(`${safeBaseName}.gif`);
    const l2 = loggerToProgress(
      format.container.duration * -0.2,
      format.container.duration,
      onProgress
    );
    const instance = await ffmpeg({ file, args: args2, logger: l2 }).promise;
    const result = instance.FS("readFile", `${safeBaseName}.gif`);
    instance.FS("unlink", `${safeBaseName}.png`);
    instance.FS("unlink", `${safeBaseName}.gif`);

    return {
      status: "converted",
      file: new File([result], `${safeBaseName}.gif`, { type: "image/gif" }),
      metadata: format,
    };
  }

  throw new Error(`Unsupported video codec: ${format.video.codec}`);
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
    const match = message.match(/time=\s*(?<time>\d+:\d+:\d+\.\d+)/);
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

export function createPreviews(
  { file, metadata }: KnownVideo,
  interval: number
): AsyncIterableIterator<File> {
  const args: string[] = ["-hide_banner", "-y"];

  // use some tricks to decode faster for the preview
  args.push("-skip_frame", interval >= 2 ? "nokey" : "default", "-vsync", "2");
  args.push("-flags2", "fast"); // https://stackoverflow.com/a/54873148
  const { width, height } = createResolution(metadata, 640, 360);
  // lowres is not supported by h264 ~ but I add it anyway in case someone drops an mpeg2 video
  const lowres = Math.floor(Math.log2(metadata.video.width / width));
  if (lowres >= 1) {
    args.push("-lowres:v", Math.min(3, lowres).toString());
  }
  args.push("-an"); // no audio
  args.push("-sn"); // no subtitles
  args.push("-dn"); // no data streams
  args.push("-i", sanitizeFileName(file.name));
  args.push("-r", `1/${interval}`);
  args.push("-sws_flags", "fast_bilinear");
  args.push("-s:v", `${width}x${height}`);
  args.push("-f", `image2`);
  args.push("-q:v", `10`); // 1-31, lower is better quality
  args.push("frame_%d.jpg");

  const run = ffmpeg({ file, args });

  return (async function* () {
    const instance = await run.instance;
    const frames = Math.ceil(metadata.container.duration / interval);
    let done = false;
    let lastFrame = Date.now();
    for (let i = 1; i <= frames; ) {
      try {
        const blob = instance.FS("readFile", `frame_${i}.jpg`);
        if (blob.length <= 0) {
          console.warn(`frame_${i}.jpg is empty`);
          throw new Error(`frame_${i}.jpg is empty`);
        }
        instance.FS("unlink", `frame_${i}.jpg`);
        i++;
        yield new File([blob], `frame_${i}.jpg`, { type: "image/jpeg" });
        lastFrame = Date.now();
      } catch {
        if (lastFrame + 10000 < Date.now()) {
          console.error("generate thumbnails timeout", lastFrame);
          break;
        } else if (done) {
          i++; // increase even with read error
        } else {
          done = !(await Promise.race([
            new Promise((r) => setTimeout(r, 200, true)),
            run.promise,
          ]));
        }
      }
    }
  })();
}

function seekArguments(metadata: Format, format: Format) {
  const args: string[] = [];

  // TODO: check what it means if the source video has a start time !== 0
  if (format.container.start > metadata.container.start) {
    args.push("-ss", format.container.start.toFixed(3), "-accurate_seek");
  }

  if (
    format.container.duration <
    metadata.container.duration - format.container.start
  ) {
    args.push("-t", format.container.duration.toFixed(3));
  }

  return args;
}

function h264Arguments(metadata: Format, format: Format) {
  const args: string[] = [];

  if (format.video.original) {
    args.push("-c:v", "copy");
    return args;
  }

  args.push("-pix_fmt:v", format.video.color);

  if (format.video.fps < metadata.video.fps) {
    args.push("-r:v", format.video.fps.toString());
  }

  if (
    format.video.width < metadata.video.width ||
    format.video.height < metadata.video.height
  ) {
    args.push("-s:v", `${format.video.width}x${format.video.height}`);
  }

  args.push("-c:v", "libx264");
  args.push("-preset:v", "medium");
  // args.push('-level:v', '4.0'); // https://en.wikipedia.org/wiki/Advanced_Video_Coding#Levels
  args.push("-profile:v", "high");

  if (format.video.crf) {
    args.push("-crf:v", format.video.crf.toString());
  } else if (format.video.bitrate) {
    args.push("-b:v", `${format.video.bitrate}k`);
    args.push("-maxrate:v", `${format.video.bitrate}k`);
    args.push(
      "-bufsize:v",
      `${Math.floor(
        format.video.bitrate * Math.min(10, format.container.duration / 4)
      )}k`
    );
  } else {
    throw new Error("No video bitrate or crf specified");
  }

  return args;
}

function aacArguments(metadata: Format, format: Format) {
  const args: string[] = [];

  args.push("-async", "1");

  if (format.audio.original) {
    args.push("-c:a", "copy");
    return args;
  }

  args.push("-c:a", "libfdk_aac");
  args.push("-b:a", `${format.audio.bitrate}k`);
  args.push("-ar", format.audio.sampleRate.toString());
  args.push("-ac", "2"); // always force stereo (mono untested)
  if (format.audio.bitrate <= 48) {
    args.push("-profile:a", "aac_he_v2");
  } else if (format.audio.bitrate <= 72) {
    args.push("-profile:a", "aac_he");
  }

  return args;
}
