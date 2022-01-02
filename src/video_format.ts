import {AudioFormat, Format, KnownVideo, VideoFormat} from "./video";

export function possibleVideoFormats(format: Format): VideoFormat[] {
  const options: VideoFormat[] = [];
  const overheadSize = format.audio?.expectedSize ?? 0;
  const sizeThresholdAdjustment = 0.9;

  const resolutions = [
    // calculateDimensions(format, 1920, 1080),
    createResolution(format, 1280, 720),
    createResolution(format, 854, 480),
    createResolution(format, 640, 360),
    createResolution(format, 426, 240, 20),
  ].filter(({width}, index, list) => list[index + 1]?.width !== width);

  for (const sizeTarget of [8000, 16000, 50000]) {
    const adjustedSizeTarget = sizeTarget - overheadSize;

    const resolution = resolutions.find(resolution => {
      return adjustedSizeTarget >= calculateExpectedSize(resolution, format.container.duration, 25);
    });

    const bitrates = [
      adjustedSizeTarget * 8 * sizeThresholdAdjustment / format.container.duration,
    ];

    if (resolution) {
      const biggestSizeForBitrate = calculateExpectedSize(resolution, format.container.duration, 18);
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
      fps: format.video.fps / Math.ceil(format.video.fps / (resolution?.fps ?? 30)),
    });
  }

  for (const resolution of resolutions.reverse()) {
    options.push({
      preset: `crf_${resolution.expectedHeight}p`,
      codec: 'h264',
      color: 'yuv420p',
      width: resolution.width,
      height: resolution.height,
      crf: 21,
      expectedSize: calculateExpectedSize(resolution, format.container.duration, 21) + overheadSize,
      fps: format.video.fps / Math.ceil(format.video.fps / resolution.fps),
    });
  }

  return options;
}

export interface Resolution {
  width: number;
  height: number;
  fps: number;
  expectedWidth: number;
  expectedHeight: number;
}

function calculateExpectedSize(res: Resolution, duration: number, crf: number) {
  return res.width * res.height * duration / Math.log2(res.fps) / 24 / crf; // TODO better calculation
}

export function createResolution({video}: Format, width: number, height: number, fps = 30): Resolution {
  const scaleFactor = Math.min(1.0, width / video.width, height / video.height);
  return {
    width: Math.round(video.width * scaleFactor / 2) * 2, // divisible by 2 for yuv420p colorspace
    height: Math.round(video.height * scaleFactor / 2) * 2, // divisible by 2 for yuv420p colorspace
    fps: fps,
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
    codec: 'aac (HEv2)',
    sampleRate: 48000,
    channelSetup: 'stereo',
    bitrate: 32,
    expectedSize: 32 / 8 * format.container.duration,
  });

  if (format.audio.codec.startsWith('aac') && format.audio.bitrate < 300) {
    options.push({
      ...format.audio,
      preset: 'bitrate_high',
      expectedSize: format.audio.bitrate / 8 * format.container.duration,
    });
  } else {
    options.push({
      preset: 'bitrate_high',
      implausible: !format.audio,
      codec: 'aac (LC)',
      sampleRate: 48000,
      channelSetup: 'stereo',
      bitrate: 128,
      expectedSize: 128 / 8 * format.container.duration,
    });
  }

  return options;
}
