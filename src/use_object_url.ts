import { useEffect } from "react";

// a global map of files that have an object URL
type FileObject = Parameters<typeof URL.createObjectURL>[0];
const urlMap = new Map<FileObject, { url: string; refCounter: number }>();

export function useObjectURL(file: FileObject | undefined) {
  // if there isn't already an object url for the given file, create one
  if (file && !urlMap.has(file)) {
    const url = URL.createObjectURL(file);
    urlMap.set(file, { url, refCounter: 0 });
    console.log("URL.createObjectURL", url, file);
  }

  // to ensure proper cleanup, we need to keep track of how many times
  // the hook has been called for a given file
  useEffect(() => {
    const fileInfo = file && urlMap.get(file);
    if (!fileInfo) {
      return;
    }

    fileInfo.refCounter++;

    return () => {
      fileInfo.refCounter--;

      // if there are no more references, schedule a cleanup
      // the cleanup must not happen immediately, because:
      // 1. the url might be used again in the next render cycle
      // 2. react does trigger effects twice in development mode
      if (fileInfo.refCounter === 0) {
        setTimeout(() => {
          if (fileInfo.refCounter === 0 && urlMap.get(file) === fileInfo) {
            URL.revokeObjectURL(fileInfo.url);
            urlMap.delete(file);
            console.log("URL.revokeObjectURL", fileInfo.url, file);
          }
        }, 5_000);
      }
    };
  }, [file]);

  if (file === undefined) {
    return undefined;
  }

  return urlMap.get(file)!.url;
}
