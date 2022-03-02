import { AudioFormat, Format, VideoFormat } from "./video";

/**
 * The amount the target size is undershoot to accommodate overheads and average bitrate variance.
 */
export const SIZE_UNDERSHOOT_FACTOR = 0.88;

export interface Resolution {
  width: number;
  height: number;
  fps: number;
  expectedWidth: number;
  expectedHeight: number;
}

export function createResolution(
  { video }: Format,
  width: number,
  height: number,
  fps = 30
): Resolution {
  const scaleFactor = Math.min(1.0, width / video.width, height / video.height);
  return {
    width: Math.round((video.width * scaleFactor) / 2) * 2, // divisible by 2 for yuv420p colorspace
    height: Math.round((video.height * scaleFactor) / 2) * 2, // divisible by 2 for yuv420p colorspace
    fps: fps,
    expectedWidth: width,
    expectedHeight: height,
  };
}

export function possibleVideoFormats(source: Format): VideoFormat[] {
  const resolutions = [
    // calculateDimensions(source, 1920, 1080),
    createResolution(source, 1280, 720),
    createResolution(source, 854, 480),
    createResolution(source, 640, 360),
  ].filter(({ width }, index, list) => list[index + 1]?.width !== width);

  const gifResolutions = [createResolution(source, 600, 600)];

  return [
    ...videoFileSizeTargets(source, resolutions),
    ...videoGifTargets(source, gifResolutions),
    ...videoResolutionTargets(source, resolutions),
  ];
}

export function possibleAudioFormats(source: Format): AudioFormat[] {
  const options: AudioFormat[] = [];

  options.push({
    preset: "none",
    codec: "none",
    sampleRate: 0,
    channelSetup: "none",
    bitrate: 0,
  });

  if (source.audio.codec === "none") {
    return options;
  }

  options.push({
    preset: "bitrate_low",
    codec: "aac (HE-AACv2)",
    sampleRate: 48000,
    channelSetup: "stereo",
    bitrate: 32,
  });

  const originalSuitable =
    source.audio.codec.startsWith("aac") &&
    source.audio.bitrate < 260; /* ~256 */

  if (originalSuitable) {
    options.push({
      ...source.audio,
      preset: "bitrate_high",
    });
  } else {
    options.push({
      preset: "bitrate_high",
      codec: "aac (LC)",
      sampleRate: 48000,
      channelSetup: "stereo",
      bitrate: 192,
    });
  }

  return options;
}

export function videoFileSizeTargets(
  source: Format,
  resolutions: Resolution[]
): VideoFormat[] {
  const options: VideoFormat[] = [];

  for (const totalSizeTarget of [8000, 16000, 50000]) {
    let sizeTarget = totalSizeTarget * SIZE_UNDERSHOOT_FACTOR;
    let bitrateTarget = (sizeTarget * 8) / source.container.duration;

    const resolution = resolutions.find(
      (res) => sizeTarget >= computeSize(res, source.container.duration, 28)
    );
    if (resolution) {
      const maxSize = computeSize(resolution, source.container.duration, 18);
      const maxBitrate = (maxSize * 8) / source.container.duration;
      if (maxBitrate < bitrateTarget) {
        sizeTarget = maxSize;
        bitrateTarget = maxBitrate;
      }
    }

    const originalSuitable =
      source.video.codec.startsWith("h264") &&
      source.video.color === "yuv420p" &&
      source.video.bitrate !== undefined &&
      (source.video.bitrate * source.container.duration) / 8 <= sizeTarget;

    if (originalSuitable) {
      options.push({
        ...source.video,
        preset: `size_${totalSizeTarget / 1000}mb`,
        original: true,
      });
    } else {
      const fpsDivisor = Math.ceil(source.video.fps / (resolution?.fps ?? 30));
      options.push({
        preset: `size_${totalSizeTarget / 1000}mb`,
        implausible: !resolution,
        codec: "h264 (High)",
        color: "yuv420p",
        width: resolution ? resolution.width : 0,
        height: resolution ? resolution.height : 0,
        bitrate: Math.floor(bitrateTarget),
        fps: source.video.fps / fpsDivisor,
      });
    }
  }

  return options;
}

export function videoResolutionTargets(
  source: Format,
  resolutions: Resolution[]
): VideoFormat[] {
  const options: VideoFormat[] = [];

  for (const resolution of resolutions.reverse()) {
    const expectedSize = computeSize(resolution, source.container.duration, 21);

    const originalSuitable =
      source.video.codec.startsWith("h264") &&
      source.video.color === "yuv420p" &&
      source.video.width === resolution?.width &&
      source.video.height === resolution?.height &&
      source.video.fps <= resolution?.fps &&
      source.video.bitrate !== undefined &&
      (source.video.bitrate * source.container.duration) / 8 <= expectedSize;

    if (originalSuitable) {
      options.push({
        ...source.video,
        preset: `crf_${resolution.expectedHeight}p`,
        original: originalSuitable,
      });
    } else {
      options.push({
        preset: `crf_${resolution.expectedHeight}p`,
        original: originalSuitable,
        codec: "h264 (High)",
        color: "yuv420p",
        width: resolution.width,
        height: resolution.height,
        crf: 21,
        fps: source.video.fps / Math.ceil(source.video.fps / resolution.fps),
      });
    }
  }
  return options;
}

export function videoGifTargets(
  source: Format,
  resolutions: Resolution[]
): VideoFormat[] {
  const options: VideoFormat[] = [];

  for (const resolution of resolutions.reverse()) {
    options.push({
      preset: `gif_${resolution.expectedHeight}p`,
      codec: "gif",
      color: "bgra",
      width: resolution.width,
      height: resolution.height,
      fps: 100 / 6,
    });
  }

  return options;
}

export function computeSize(
  res: { width: number; height: number; fps: number },
  duration: number,
  crf: number
) {
  return (res.width * res.height * duration * Math.log2(res.fps)) / 768 / crf; // TODO better calculation
}
