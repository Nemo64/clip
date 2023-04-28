import { AudioFormat, ContainerFormat, Format, VideoFormat } from "./video";

export interface ConvertInstructions {
  modification: Modification;
  video: VideoFormat;
  audio: AudioFormat;
}

export interface Modification {
  cuts: Cut[];
  crop: Crop;
}

export interface Cut {
  start: number;
  duration: number;
}

export interface Crop {
  top: number; // 0.0 - 1.0
  right: number; // 0.0 - 1.0
  bottom: number; // 0.0 - 1.0
  left: number; // 0.0 - 1.0
}

export function toTargetFormat(instructions: ConvertInstructions): Format {
  return {
    container: calculateContainer(instructions.modification),
    video: instructions.video,
    audio: instructions.audio,
  };
}

export function calculateContainer(
  modification: Modification
): ContainerFormat {
  return {
    start: Math.min(...modification.cuts.map((c) => c.start)),
    duration: calculateDuration(modification),
  };
}

export function calculateCroppedVideo(
  video: VideoFormat,
  modification: Modification
): VideoFormat {
  if (!isCropped(modification)) {
    return video;
  }

  const crop = modification.crop;
  return {
    ...video,
    width: video.width * (1 - crop.left - crop.right),
    height: video.height * (1 - crop.top - crop.bottom),
    original: false, // this is no longer the original video
  };
}

export function isCropped(modification: { crop: Crop }) {
  const { bottom, left, right, top } = modification.crop;
  return top !== 0 || right !== 0 || bottom !== 0 || left !== 0;
}

export function calculateDuration(modification: { cuts: Cut[] }): number {
  return modification.cuts.reduce((sum, c) => sum + c.duration, 0);
}
