import { ffmpeg, sanitizeFileName } from "./ffmpeg";
import { Format, KnownVideo, NewVideo } from "./video";

/**
 * This function reads the metadata of a video file.
 *
 * FFMPEG is started here and the output is parsed.
 * There is no FFPROBE included in {@see https://github.com/ffmpegwasm/ffmpeg.wasm},
 * so abuse ffmpeg for that. {@see https://github.com/ffmpegwasm/ffmpeg.wasm/issues/121}
 */
export async function analyzeVideo({ file }: NewVideo): Promise<KnownVideo> {
  const metadata: Partial<Format> = {
    audio: {
      codec: "none",
      channelSetup: "none",
      sampleRate: 0,
      bitrate: 0,
    },
  };
  const strings = [] as string[];

  await ffmpeg({
    files: [file],
    args: ["-hide_banner", "-v", "info", "-i", sanitizeFileName(file.name)],
    logger: ({ message }) => {
      strings.push(message);
      parseMetadata(message, metadata);
    },
  }).promise;

  if (!metadata.container || !metadata.video) {
    const message = strings
      .join("\n")
      .replace("At least one output file must be specified", "");
    throw new Error(
      `Could not analyze video ${JSON.stringify(metadata)}\n${message}`
    );
  }

  console.log(`Analyzed video`, metadata);

  return { status: "known", file, metadata: metadata as Format };
}

export function parseMetadata(message: any, metadata: Partial<Format>) {
  if (typeof message !== "string") {
    return;
  }

  const metadataMatch = message.match(
    /Duration: (?<duration>\d+:\d+:\d+\.\d+), start: (?<start>[\d.]+), bitrate: (?<bitrate>[\d.]+) kb\/s/
  );
  if (metadataMatch?.groups) {
    const duration = metadataMatch.groups.duration
      .split(":")
      .map(parseFloat)
      .reduce((a, b) => a * 60 + b);
    metadata.container = {
      duration: duration,
      start: 0, // parseFloat(metadataMatch.groups.start),
      // bitrate: parseFloat(metadataMatch.groups.bitrate),
    };
    return;
  }

  const videoMatch = message.match(
    /Stream #[^:,]+:[^:,]+: Video: (?<codec>[^(),]+(\(\S+\))?).*?, (?<color>[^(),]+).*?, (?<width>\d+)x(?<height>\d+).*?(, (?<bitrate>[\d.]+) kb\/s)?,.* (?<fps>[\d.]+) fps, (?<tbr>[\d.]+) tbr/
  );
  if (videoMatch?.groups && metadata.container) {
    metadata.video = {
      original: true,
      codec: videoMatch.groups.codec,
      color: videoMatch.groups.color,
      width: parseFloat(videoMatch.groups.width),
      height: parseFloat(videoMatch.groups.height),
      rotation: 0,
      bitrate: parseFloat(videoMatch.groups.bitrate),
      fps: Math.max(
        parseFloat(videoMatch.groups.fps),
        parseFloat(videoMatch.groups.tbr)
      ),
    };
    return;
  }

  const audioMatch = message.match(
    /Stream #[^:,]+:[^:,]+: Audio: (?<codec>[^(),]+(\(\S+\))?).*, (?<sampleRate>\d+) Hz, (?<channelSetup>[^,]+), [^,]+, (?<bitrate>[\d.]+) kb\/s/
  );
  if (audioMatch?.groups && metadata.container) {
    metadata.audio = {
      original: true,
      codec: audioMatch.groups.codec,
      sampleRate: parseFloat(audioMatch.groups.sampleRate),
      channelSetup: audioMatch.groups.channelSetup,
      bitrate: parseFloat(audioMatch.groups.bitrate),
    };
    return;
  }

  // some cameras (like the iphone) don't rotate the video
  // they just add metadata that the video should be rotated
  // ffmpeg does automatically rotate the video for us:
  // - https://stackoverflow.com/a/30899179/1973256
  // - https://github.com/FFmpeg/FFmpeg/blob/45ab5307a6e8c04b4ea91b1e1ccf71ba38195f7c/fftools/ffmpeg_filter.c#L710
  // but it reports none rotated dimensions, so i need to rotate them here
  const rotationMatch = message.match(
    /displaymatrix: rotation of (?<rotation>-?90|-?180|-?270).00 degrees/
  );
  if (rotationMatch?.groups && metadata.video) {
    const rotation = parseFloat(rotationMatch.groups.rotation);
    if (Math.abs(rotation) % 180 === 0) {
      metadata.video = {
        ...metadata.video,
        rotation: rotation as any,
      };
    } else {
      // noinspection JSSuspiciousNameCombination
      metadata.video = {
        ...metadata.video,
        width: metadata.video.height,
        height: metadata.video.width,
        rotation: rotation as any,
      };
    }
    return;
  }
}
