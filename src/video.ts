import {createFFmpeg, fetchFile} from "@ffmpeg/ffmpeg";
import {LinkHTMLAttributes} from "react";

export type Video = NewVideo | KnownVideo;

export interface NewVideo {
  status: "new";
  file: File;
  ffmpeg: ReturnType<typeof createFFmpeg>;
}

export interface KnownVideo {
  status: "known";
  file: File;
  ffmpeg: ReturnType<typeof createFFmpeg>;
  metadata: Format;
}

export interface ConvertedVideo {
  status: "converted";
  file: File;
  metadata: Format;
}

/**
 * The paths are exported for preloading purposes.
 */
export const FFMPEG_PATHS: Record<string, LinkHTMLAttributes<HTMLLinkElement>> = {
  core: {
    href: `${process.env.NEXT_PUBLIC_FFMPEG_URL}/ffmpeg-core.js`,
    rel: 'prefetch',
    as: 'fetch',
    crossOrigin: 'anonymous',
  },
  wasm: {
    href: `${process.env.NEXT_PUBLIC_FFMPEG_URL}/ffmpeg-core.wasm`,
    rel: 'prefetch',
    as: 'fetch',
    crossOrigin: 'anonymous',
  },
  worker: {
    href: `${process.env.NEXT_PUBLIC_FFMPEG_URL}/ffmpeg-core.worker.js`,
    rel: 'prefetch',
    as: 'fetch',
    crossOrigin: 'anonymous',
  },
};

/**
 * Creates a new video object and starts its dedicated worker.
 */
export async function createVideo(file: File): Promise<NewVideo> {
  const ffmpeg = createFFmpeg({
    log: true,
    corePath: FFMPEG_PATHS.core.href,
  });

  const [, data] = await Promise.all([ffmpeg.load(), fetchFile(file)]);
  ffmpeg.FS('writeFile', file.name, data);

  return {status: "new", file, ffmpeg};
}

export interface ContainerFormat {
  duration: number; // in seconds
  start: number; // in seconds
}

export interface VideoFormat {
  preset?: string; // arbitrary name
  implausible?: boolean; // if true, this format is not suitable for the video
  codec: string; // eg. "h264"
  color: string; // eg. yuv420p
  width: number; // eg. 1920
  height: number; // eg. 1080
  bitrate?: number; // in kbit/s
  crf?: number; // constant rate factor ~ usually only available for encode
  expectedSize: number; // in kilobytes
  fps: number; // average frames per second
  // tbr?: number; // https://stackoverflow.com/a/3199582
}

export interface AudioFormat {
  preset?: string; // arbitrary name
  implausible?: boolean; // if true, this format is not suitable for the video
  codec: string; // eg. "aac"
  sampleRate: number; // eg. 48000
  channelSetup: string; // eg. "mono" or "stereo"
  bitrate: number; // in kbit/s
  expectedSize: number; // in kilobytes
}

export interface Format {
  container: ContainerFormat;
  video: VideoFormat;
  audio?: AudioFormat;
}

export * from "./video_analyse";
export * from "./video_convert";
export * from "./video_format";
