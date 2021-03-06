import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

let running = false;
let instancePromise: ReturnType<typeof createInstance>;
let lastInputFile: [string, number] | undefined;

export interface FfmpegProps {
  file: File;
  args: string[];
  logger?: Parameters<ReturnType<typeof createFFmpeg>["setLogger"]>[0];
}

/**
 * Runs an ffmpeg command with the specified input file.
 * It'll ensure that no other ffmpeg is running at the same time.
 * If there is another ffmpeg running, it'll be destroyed and a new one will be created.
 */
export function ffmpeg({ file, logger, args }: FfmpegProps) {
  ensureFreshFfmpegInstance();
  running = true;

  const isNewFile =
    lastInputFile === undefined ||
    lastInputFile[0] !== file.name ||
    lastInputFile[1] !== file.size;
  const promise = Promise.all([
    instancePromise,
    isNewFile && fetchFile(file),
  ]).then(async ([instance, blob]) => {
    if (isNewFile && lastInputFile) {
      instance.FS("unlink", lastInputFile[0]);
    }

    if (isNewFile && blob) {
      const filename = sanitizeFileName(file.name);
      instance.FS("writeFile", filename, blob);
      lastInputFile = [filename, file.size];
    }

    instance.setLogger(logger ?? (() => void 0));
    await instance.run(...args);
    running = false;
    return instance;
  });

  return {
    promise: promise,
    instance: instancePromise,
  };
}

/**
 * Ensures that the ffmpeg instance is ready for a new process.
 * You don't need to call it, but it can save time.
 */
export function ensureFreshFfmpegInstance() {
  if (running || !instancePromise) {
    if (instancePromise) {
      console.warn("ffmpeg is already running, destroying it");
      instancePromise.then((instance) => instance.exit());
    }

    instancePromise = createInstance();
    lastInputFile = undefined;
    running = false;
  }

  return instancePromise;
}

async function createInstance() {
  const instance = createFFmpeg({
    log: true,
    corePath: `${process.env.NEXT_PUBLIC_FFMPEG_URL}/ffmpeg-core.js`,
  });
  await instance.load();
  return instance;
}

export function sanitizeFileName(name: string) {
  return name.replace(/[^\x00-\x7F]/g, "_");
}
