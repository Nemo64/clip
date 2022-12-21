import { useEffect } from "react";

type FileObject = Parameters<typeof URL.createObjectURL>[0];
interface FileUrlInfo {
  url: string;
  refs: number;
  cleanup?: ReturnType<typeof setTimeout>;
}

// a global map of files that have an object URL
const globalUrlMap = new Map<FileObject, FileUrlInfo>();

export function useObjectURL<T extends FileObject | undefined>(
  file: T
): T extends undefined ? string | undefined : string {
  // if there isn't already an object url for the given file, create one
  if (file && !globalUrlMap.has(file)) {
    const url = URL.createObjectURL(file);
    globalUrlMap.set(file, { url: url, refs: 0 });
    console.log("URL.createObjectURL", url, file);
  }

  // to ensure proper cleanup, we need to keep track of how many times
  // the hook has been called for a given file
  useEffect(() => {
    const fileInfo = file && globalUrlMap.get(file);
    if (!fileInfo) {
      return;
    }

    // increment the reference counter,
    // so we know how many times this url is used
    fileInfo.refs++;

    // check if there is a cleanup scheduled and cancel it
    if (fileInfo.cleanup) {
      clearTimeout(fileInfo.cleanup);
      fileInfo.cleanup = undefined;
    }

    return () => {
      // decrement the reference counter
      fileInfo.refs--;

      // if there are no more references, schedule a cleanup
      // the cleanup must not happen immediately, because:
      // 1. the url might be used again in the same render cycle
      // 2. react does trigger effects twice in development mode
      if (fileInfo.refs === 0 && !fileInfo.cleanup) {
        fileInfo.cleanup = setTimeout(() => {
          if (fileInfo.refs === 0) {
            URL.revokeObjectURL(fileInfo.url);
            globalUrlMap.delete(file);
            console.log("URL.revokeObjectURL", fileInfo.url, file);
          }
        }, 5_000);
      }
    };
  }, [file]);

  if (file === undefined) {
    return undefined!;
  }

  return globalUrlMap.get(file)!.url;
}
