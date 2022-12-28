import { AudioFormat, ContainerFormat, Format, VideoFormat } from "./video";

export interface ConvertInstructions {
  containers: ContainerFormat[];
  video: VideoFormat;
  audio: AudioFormat;
}

export function toTargetFormat(instructions: ConvertInstructions): Format {
  return {
    container: mergeContainers(instructions.containers),
    video: instructions.video,
    audio: instructions.audio,
  };
}

export function mergeContainers(
  containers: ContainerFormat[]
): ContainerFormat {
  return {
    start: Math.min(...containers.map((c) => c.start)),
    duration: containers.reduce((sum, c) => sum + c.duration, 0),
  };
}

export function calculateDuration(instructions: ConvertInstructions): number {
  return instructions.containers.reduce((sum, c) => sum + c.duration, 0);
}
