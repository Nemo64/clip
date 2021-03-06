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
    file: file,
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

export function parseMetadata(message: string, metadata: Partial<Format>) {
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
    /Stream #[^:,]+:[^:,]+: Video: (?<codec>[^(),]+(\(\S+\))?).*, (?<color>yuv.+|[rgba]{3,4}), (?<width>\d+)x(?<height>\d+).*(, (?<bitrate>[\d.]+) kb\/s)?,.* (?<fps>[\d.]+) fps, (?<tbr>[\d.]+) tbr/
  );
  if (videoMatch?.groups && metadata.container) {
    metadata.video = {
      original: true,
      codec: videoMatch.groups.codec,
      color: videoMatch.groups.color,
      width: parseFloat(videoMatch.groups.width),
      height: parseFloat(videoMatch.groups.height),
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
}
