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

export function calculateDuration(modification: Modification): number {
  return modification.cuts.reduce((sum, c) => sum + c.duration, 0);
}
