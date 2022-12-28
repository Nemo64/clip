import { useEffect, useState } from "react";
import { trackEvent } from "./tracker";
import { createThumbnails } from "./video_convert";
import { KnownVideo } from "./video";

export function useThumbnails(video: KnownVideo, picInt: number) {
  const [pics, setPics] = useState<string[]>([]);

  useEffect(() => {
    let canceled = false;
    const pics: string[] = [];

    (async () => {
      // effects are triggered twice in dev mode so debounce this process
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (canceled) {
        return;
      }

      const startTime = Date.now();
      const formatStr = [
        video.metadata.video.codec,
        video.metadata.audio?.codec,
        `${2 ** Math.round(Math.log2(video.metadata.container.duration))}s`,
      ].join(":");

      try {
        trackEvent("thumbnail-start", "generate", formatStr);

        for await (const preview of createThumbnails(video, picInt)) {
          if (canceled) {
            break;
          }

          pics.push(URL.createObjectURL(preview));
          setPics([...pics]); // copy over so react rerenders
        }

        if (!canceled) {
          const duration = (Date.now() - startTime) / 1000;
          trackEvent("thumbnail-finish", "generate", formatStr, duration);
        }
      } catch (e) {
        const duration = (Date.now() - startTime) / 1000;
        trackEvent("thumbnail-error", "generate", String(e), duration);
        throw e;
      }
    })();

    return () => {
      canceled = true;
      pics.forEach(URL.revokeObjectURL);
      setPics([]);
    };
  }, [video, picInt]);

  return pics;
}
