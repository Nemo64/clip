import {AudioFormat, Format, KnownVideo, VideoFormat} from "./video";

export function possibleVideoFormats(format: Format): VideoFormat[] {
  const options: VideoFormat[] = [];
  const overheadSize = format.audio?.expectedSize ?? 0;
  const sizeThresholdAdjustment = 0.9;

  const dimensions = [
    // calculateDimensions(format, 1920, 1080),
    calculateDimensions(format, 1280, 720),
    calculateDimensions(format, 854, 480),
    calculateDimensions(format, 640, 360),
  ].filter(({width}, index, list) => list[index + 1]?.width !== width);

  for (const sizeTarget of [8000, 16000, 50000]) {
    const resolution = dimensions.find(({width, height}) => {
      return sizeTarget >= calculateExpectedSize(width, height, format.container.duration, 25);
    });

    const bitrates = [
      (sizeTarget - overheadSize) * 8 * sizeThresholdAdjustment / format.container.duration,
    ];

    if (resolution) {
      const biggestSizeForBitrate = calculateExpectedSize(resolution.width, resolution.height, format.container.duration, 18);
      bitrates.push(biggestSizeForBitrate * 8 / format.container.duration);
    }

    options.push({
      preset: `size_${sizeTarget / 1000}mb`,
      implausible: !resolution,
      codec: 'h264',
      color: 'yuv420p',
      width: resolution ? resolution.width : 0,
      height: resolution ? resolution.height : 0,
      bitrate: Math.floor(Math.min(...bitrates)),
      expectedSize: sizeTarget,
      fps: format.video.fps / Math.ceil(format.video.fps / 30),
    });
  }

  for (const {width, height, expectedHeight} of dimensions.reverse()) {
    options.push({
      preset: `crf_${expectedHeight}p`,
      codec: 'h264',
      color: 'yuv420p',
      width,
      height,
      crf: 21,
      expectedSize: calculateExpectedSize(width, height, format.container.duration, 21) + overheadSize,
      fps: format.video.fps / Math.ceil(format.video.fps / 30),
    });
  }

  return options;
}

function calculateExpectedSize(width: number, height: number, duration: number, crf: number) {
  return width * height * duration / 120 / crf; // TODO better calculation
}

function calculateDimensions({video}: Format, width: number, height: number): { width: number, height: number, expectedWidth: number, expectedHeight: number } {
  const scaleFactor = Math.min(1.0, width / video.width, height / video.height);
  return {
    width: Math.round(video.width * scaleFactor / 2) * 2, // divisible by 2 for yuv420p colorspace
    height: Math.round(video.height * scaleFactor / 2) * 2, // divisible by 2 for yuv420p colorspace
    expectedWidth: width,
    expectedHeight: height,
  };
}

export function possibleAudioFormats(format: Format): AudioFormat[] {
  const options: AudioFormat[] = [];

  options.push({
    preset: 'none',
    codec: 'none',
    sampleRate: 0,
    channelSetup: 'none',
    bitrate: 0,
    expectedSize: 0,
  })

  if (!format.audio) {
    return options;
  }

  options.push({
    preset: 'bitrate_low',
    implausible: !format.audio,
    codec: 'aac he v2',
    sampleRate: 48000,
    channelSetup: 'stereo',
    bitrate: 32,
    expectedSize: 32 / 8 * format.container.duration,
  });

  options.push({
    preset: 'bitrate_high',
    implausible: !format.audio,
    codec: 'aac lc',
    sampleRate: 48000,
    channelSetup: 'stereo',
    bitrate: 128,
    expectedSize: 128 / 8 * format.container.duration,
  });

  return options;
}
