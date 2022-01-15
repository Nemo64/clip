export type Video = NewVideo | KnownVideo | BrokenVideo;

export interface NewVideo {
  status: "new";
  file: File;
}

export interface KnownVideo {
  status: "known";
  file: File;
  metadata: Format;
}

export interface BrokenVideo {
  status: "broken";
  file: File;
  message: string;
}

export interface ConvertedVideo {
  status: "converted";
  file: File;
  metadata: Format;
}

/**
 * Creates a new video object and starts its dedicated worker.
 */
export async function createVideo(file: File): Promise<NewVideo> {
  return {status: "new", file};
}

export interface ContainerFormat {
  duration: number; // in seconds
  start: number; // in seconds
}

export interface GenericStreamFormat {
  preset?: string; // arbitrary name
  original?: boolean; // indicate if the stream is from the source
  implausible?: boolean; // if true, this format is not suitable for the video
  expectedSize: number; // in kilobytes
}

export interface VideoFormat extends GenericStreamFormat {
  codec: string; // eg. "h264"
  color: string; // eg. yuv420p
  width: number; // eg. 1920
  height: number; // eg. 1080
  bitrate?: number; // in kbit/s
  crf?: number; // constant rate factor ~ usually only available for encode
  fps: number; // average frames per second
  // tbr?: number; // https://stackoverflow.com/a/3199582
}

export interface AudioFormat extends GenericStreamFormat {
  codec: string; // eg. "aac"
  sampleRate: number; // eg. 48000
  channelSetup: string; // eg. "mono" or "stereo"
  bitrate: number; // in kbit/s
}

export interface Format {
  container: ContainerFormat;
  video: VideoFormat;
  audio?: AudioFormat;
}

export * from "./video_analyse";
export * from "./video_convert";
export * from "./video_format";
