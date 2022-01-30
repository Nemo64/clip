import { useEffect, useRef } from "react";

export function useBinarySrc<
  T extends Parameters<typeof URL.createObjectURL>[0] | undefined
>(file: T): T extends undefined ? string | undefined : string {
  const object = useRef<{ file: typeof file; url: string }>();

  // if the file is replaced, revoke the old url
  if (object.current && object.current.file !== file) {
    URL.revokeObjectURL(object.current.url);
    object.current = undefined;
  }

  // create new url when the file changes or initially
  if (!object.current && file !== undefined) {
    object.current = { file, url: URL.createObjectURL(file) };
  }

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (object.current) {
        URL.revokeObjectURL(object.current.url);
        object.current = undefined;
      }
    };
  }, []);

  // @ts-ignore
  return object.current?.url;
}
