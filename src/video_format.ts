import { AudioFormat, ContainerFormat, Format, VideoFormat } from "./video";

export function getVideoFormats(source: Format): VideoFormat[] {
  const filterSensibleResolutions = (
    { width, height, fps }: Resolution,
    index: number,
    list: Resolution[]
  ) =>
    list[index + 1] === undefined ||
    list[index + 1].width !== width ||
    list[index + 1].height !== height ||
    list[index + 1].fps !== fps;

  // these resolutions are for the user to select from
  const roughResolutions = [
    createResolution(source, 1920, 1080, 60), // 16:9 full HD resolution
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

export function getAudioFormats(source: Format): AudioFormat[] {
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
    source.audio.original &&
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
  { container, audio, video }: Format,
  resolutions: Resolution[] // expected to be in descending order
): VideoFormat[] {
  const options: VideoFormat[] = [];

  for (const totalSizeTarget of [8000, 16000, 50000]) {
    // we have to undershoot the file size target to account for overheads and average bitrate variance
    // 0.88 is just a guess, but it seems to work well
    const audioBitrate = audio?.bitrate || 0;
    let sizeTarget = totalSizeTarget * 0.88;
    let bitrateTarget = (sizeTarget * 8) / container.duration - audioBitrate;

    const resolution = resolutions.find(
      (res) => sizeTarget >= estimateH264Size(res, 28, container.duration)
    );
    if (!resolution || bitrateTarget < 100) {
      const worst = resolutions[resolutions.length - 1];
      options.push({
        preset: `size_${totalSizeTarget / 1000}mb`,
        implausible: true,
        codec: "h264 (High)",
        color: "yuv420p",
        width: worst.width,
        height: worst.height,
        rotation: 0,
        bitrate: Math.floor(bitrateTarget),
        fps: video.fps / Math.ceil(video.fps / worst.fps),
      });
      continue;
    }

    const maxSize = estimateH264Size(resolution, 18, container.duration);
    const maxBitrate = (maxSize * 8) / container.duration;
    if (maxBitrate < bitrateTarget) {
      sizeTarget = maxSize;
      bitrateTarget = maxBitrate;
    }

    const originalSuitable =
      video.original &&
      h264Level42Compatible(video) &&
      // the important part: the final video must fit the size constraint
      // I only have the average bitrate, so I divide by 6 instead of 8
      video.bitrate !== undefined &&
      (video.bitrate * container.duration) / 6 <= sizeTarget;

    if (originalSuitable) {
      options.push({
        ...video,
        preset: `size_${totalSizeTarget / 1000}mb`,
      });
    } else {
      options.push({
        preset: `size_${totalSizeTarget / 1000}mb`,
        codec: "h264 (High)",
        color: "yuv420p",
        width: resolution.width,
        height: resolution.height,
        rotation: 0,
        bitrate: Math.floor(bitrateTarget),
        fps: video.fps / Math.ceil(video.fps / resolution.fps),
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
    const originalSuitable =
      source.video.original &&
      h264Level42Compatible(source.video) &&
      // the resolution is our target, but I allow 50% leeway
      // the "best" target of 1920x1080 can also accept 2880x1620
      // the "HD" target of 1280x720 can also accept 1920x1080
      // the "SD" target of 640x480 can also accept 960x720
      source.video.width <= resolution.width * 1.5 &&
      source.video.height <= resolution.height * 1.5 &&
      // bitrate isn't important here, but I still want to avoid huge files
      source.video.bitrate !== undefined &&
      (source.video.bitrate * source.container.duration) / 8 <=
        estimateH264Size(resolution, 18, source.container.duration);

    if (originalSuitable) {
      options.push({
        ...source.video,
        preset: `crf_${resolution.expectedHeight}p`,
      });
    } else {
      options.push({
        preset: `crf_${resolution.expectedHeight}p`,
        codec: "h264 (High)",
        color: "yuv420p",
        width: resolution.width,
        height: resolution.height,
        rotation: 0,
        crf: resolution.expectedHeight === 1080 ? 18 : 21,
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
      rotation: 0,
      fps: 100 / 6,
    });
  }

  return options;
}

function h264Level42Compatible(video: VideoFormat) {
  return (
    video.codec.startsWith("h264") &&
    video.color === "yuv420p" &&
    // I count the 16x16 macroblocks here, which 4.2 allows 8704 of.
    Math.ceil(video.width / 16) * Math.ceil(video.height / 16) <= 8704 &&
    // while you can technically have more fps if you have fewer macroblocks,
    // I don't allow more than 60 since I don't know how compatible that is
    video.fps <= 60
  );
}

/**
 * Estimate the size of an h264 video stream.
 * This can vary widely depending on the content.
 * But it can be used for sanity checks.
 *
 * Sensible values for the crf are 18-28.
 * 18 is a pretty good quality while 28 is a very low quality.
 *
 * Tipp, a length of 8 seconds will directly output kbit/s.
 */
export function estimateH264Size(
  res: { width: number; height: number; fps: number },
  crf: number,
  duration: number = 8
) {
  return Math.floor(
    (res.width * res.height * duration * Math.log2(res.fps)) / 20 / crf ** 2
  );
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
  // I want to support vertical orientations
  // so width and height are irrelevant for the scaling calculation
  const scaleFactor = Math.min(
    Math.min(width, height) / Math.min(video.width, video.height),
    Math.max(width, height) / Math.max(video.width, video.height),
    1.0 // never scale up
  );
  return {
    width: Math.round((video.width * scaleFactor) / 2) * 2, // divisible by 2 for yuv420p colorspace
    height: Math.round((video.height * scaleFactor) / 2) * 2, // divisible by 2 for yuv420p colorspace
    fps: fps,
    expectedWidth: width,
    expectedHeight: height,
  };
}
