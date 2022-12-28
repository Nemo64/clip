import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

let running = false;
let instancePromise: ReturnType<typeof createInstance>;
let lastInputFiles: [string, number][] = [];

export interface FfmpegProps {
  files: File[];
  args: string[];
  logger?: Parameters<ReturnType<typeof createFFmpeg>["setLogger"]>[0];
}

/**
 * Runs an ffmpeg command with the specified input file.
 * It'll ensure that no other ffmpeg is running at the same time.
 * If there is another ffmpeg running, it'll be destroyed and a new one will be created.
 */
export function ffmpeg({ files, logger, args }: FfmpegProps) {
  ensureFreshFfmpegInstance();
  running = true;

  const isNewFile =
    lastInputFiles === undefined ||
    lastInputFiles.length !== files.length ||
    files.some((file, i) => file.name !== lastInputFiles[i][0]) ||
    files.some((file, i) => file.size !== lastInputFiles[i][1]);

  const promise = Promise.all([
    instancePromise,
    ...(isNewFile ? files.map(fetchFile) : []),
  ]).then(async ([instance, ...blobs]) => {
    if (isNewFile) {
      lastInputFiles.forEach(([name]) => {
        try {
          instance.FS("unlink", name);
        } catch (e) {
          console.error("cleanup error", e);
        }
      });
      lastInputFiles = files.map((file, i) => {
        const filename = sanitizeFileName(file.name);
        instance.FS("writeFile", filename, blobs[i]);
        return [file.name, file.size];
      });
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
export function ensureFreshFfmpegInstance(onError?: (error: any) => void) {
  if (running && instancePromise) {
    console.warn("ffmpeg is already running, destroying it");
    instancePromise.then((instance) => instance.exit());
  }

  if (running || !instancePromise) {
    console.log("create new ffmpeg instance");
    instancePromise = createInstance();
    lastInputFiles = [];
    running = false;
  }

  if (onError) {
    instancePromise.catch(onError);
  }
}

async function createInstance() {
  const instance = createFFmpeg({
    log: true,
    corePath: new URL(
      `${process.env.NEXT_PUBLIC_FFMPEG_URL}/ffmpeg-core.js`,
      document.location as any
    ).href,
  });

  await instance.load();

  // @ts-ignore GLOBAL EXPOSE
  global.ffmpeg = instance;

  return instance;
}

export function sanitizeFileName(name: string) {
  return name.replace(/[^\w.]+/g, " ");
}
