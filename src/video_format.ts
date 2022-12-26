import { AudioFormat, Format, VideoFormat } from "./video";

export function possibleVideoFormats(source: Format): VideoFormat[] {
  const filterSensibleResolutions = (
    { width }: Resolution,
    index: number,
    list: Resolution[]
  ) => list[index + 1]?.width !== width;

  // these resolutions are for the user to select from
  const roughResolutions = [
    createResolution(source, 1280, 720), // 16:9 small HD resolution
    createResolution(source, 640, 480), // 4:3 PAL resolution
  ].filter(filterSensibleResolutions);

  // these are all sensible resolutions to automatically select
  const fineResolutions = [
    createResolution(source, 1280, 720),
    createResolution(source, 854, 480),
    createResolution(source, 640, 360),
    createResolution(source, 426, 240),
  ].filter(filterSensibleResolutions);

  const gifResolutions = [createResolution(source, 600, 600)];

  return [
    ...videoFileSizeTargets(source, fineResolutions),
    ...videoGifTargets(source, gifResolutions),
    ...videoResolutionTargets(source, roughResolutions),
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
    sampleRate: source.audio.sampleRate === 44100 ? 44100 : 48000,
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
      sampleRate: source.audio.sampleRate === 44100 ? 44100 : 48000,
      channelSetup: "stereo",
      bitrate: 192,
    });
  }

  return options;
}

export function videoFileSizeTargets(
  source: Format,
  resolutions: Resolution[] // expected to be in descending order
): VideoFormat[] {
  const options: VideoFormat[] = [];

  for (const totalSizeTarget of [8000, 16000, 50000]) {
    // we have to undershoot the file size target to account for overheads and average bitrate variance
    // 0.88 is just a guess, but it seems to work well
    let sizeTarget = totalSizeTarget * 0.88;
    let bitrateTarget = (sizeTarget * 8) / source.container.duration;

    const resolution = resolutions.find(
      (res) =>
        sizeTarget >= estimateH264Size(res, source.container.duration, 28)
    );
    if (!resolution) {
      const worst = resolutions[resolutions.length - 1];
      options.push({
        preset: `size_${totalSizeTarget / 1000}mb`,
        implausible: true,
        codec: "h264 (High)",
        color: "yuv420p",
        width: worst.width,
        height: worst.height,
        bitrate: Math.floor(bitrateTarget),
        fps: source.video.fps / Math.ceil(source.video.fps / worst.fps),
      });
      continue;
    }

    const maxSize = estimateH264Size(resolution, source.container.duration, 12);
    const maxBitrate = (maxSize * 8) / source.container.duration;
    if (maxBitrate < bitrateTarget) {
      sizeTarget = maxSize;
      bitrateTarget = maxBitrate;
    }

    const originalSuitable =
      source.video.codec.startsWith("h264") &&
      source.video.color === "yuv420p" &&
      source.video.width <= resolution.width * 2 &&
      source.video.height <= resolution.height * 2 &&
      source.video.fps <= resolution.fps &&
      source.video.bitrate !== undefined &&
      (source.video.bitrate * source.container.duration) / 8 <= sizeTarget;

    if (originalSuitable) {
      options.push({
        ...source.video,
        preset: `size_${totalSizeTarget / 1000}mb`,
        original: true,
      });
    } else {
      options.push({
        preset: `size_${totalSizeTarget / 1000}mb`,
        codec: "h264 (High)",
        color: "yuv420p",
        width: resolution.width,
        height: resolution.height,
        bitrate: Math.floor(bitrateTarget),
        fps: source.video.fps / Math.ceil(source.video.fps / resolution.fps),
      });
    }
  }

  return options;
}

export function videoResolutionTargets(
  source: Format,
  resolutions: Resolution[] // expected to be in descending order
): VideoFormat[] {
  const options: VideoFormat[] = [];

  for (const resolution of resolutions.reverse()) {
    const size = estimateH264Size(resolution, source.container.duration, 18);

    const originalSuitable =
      source.video.codec.startsWith("h264") &&
      source.video.color === "yuv420p" &&
      source.video.width <= resolution.width &&
      source.video.height <= resolution.height &&
      source.video.fps <= resolution.fps &&
      source.video.bitrate !== undefined &&
      (source.video.bitrate * source.container.duration) / 8 <= size;

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
  resolutions: Resolution[] // expected to be in descending order
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

/**
 * Estimate the size of an h264 video stream.
 * This can vary widely depending on the content.
 * But it can be used for sanity checks.
 *
 * Sensible values for the crf are 18-28.
 * 18 is a pretty good quality while 28 is a very low quality.
 */
export function estimateH264Size(
  res: { width: number; height: number; fps: number },
  duration: number,
  crf: number
) {
  return (res.width * res.height * duration * Math.log2(res.fps)) / 512 / crf; // TODO better calculation
}

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
