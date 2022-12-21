import i18next from "i18next";
import type { AppProps } from "next/app";
import Head from "next/head";
import { createContext, useCallback, useEffect, useState } from "react";
import { Footer } from "../components/footer";
import { trackEvent, trackPageView } from "../src/tracker";
import { analyzeVideo, createVideo, Video } from "../src/video";
import "../styles/globals.css";
import { setLocale } from "../src/intl";

export type VideoState = [
  Video | undefined,
  (file: File | undefined, action?: string) => void
];
export const VideoContext = createContext<VideoState>([
  undefined,
  () => undefined,
]);

export default function MyApp({ Component, pageProps, router }: AppProps) {
  setLocale(router.locale ?? "en");

  const canonicalUrl = `${process.env.NEXT_PUBLIC_HOST}/${router.locale}${router.pathname}`;
  useEffect(() => {
    trackPageView(canonicalUrl);
  }, [canonicalUrl]);

  const [video, setVideo] = useState<Video | undefined>(undefined);
  const setVideoFile = useCallback(
    async (file: File | undefined, action?: string) => {
      if (!file) {
        setVideo(undefined);
        return;
      }

      try {
        let fileExtension = file.name.match(/\.\w{2,5}$/)?.[0].toLowerCase();
        trackEvent("upload", action ?? "unknown", fileExtension, file.size);
        const newVideo = await createVideo(file);
        setVideo(newVideo);

        const identifiedVideo = await analyzeVideo(newVideo);
        const formatStr = [
          identifiedVideo.metadata.video.codec,
          identifiedVideo.metadata.audio?.codec,
          `${
            2 **
            Math.round(Math.log2(identifiedVideo.metadata.container.duration))
          }s`,
        ].join(":");
        trackEvent("analyze", action ?? "unknown", formatStr);
        setVideo(identifiedVideo);
        router.push("/video").catch(console.error);
      } catch (e) {
        trackEvent("analyze-error", action ?? "unknown", String(e));
        setVideo({ status: "broken", file, message: String(e) });
        router.push("/video").catch(console.error);
      }
    },
    [router, setVideo]
  );

  return (
    <>
      <Head>
        <link key="canonical" rel="canonical" href={canonicalUrl} />
        <link
          key="x-default"
          rel="alternate"
          href={`${process.env.NEXT_PUBLIC_HOST}${router.pathname}`}
          hrefLang="x-default"
        />
        {router.locales?.map((locale) => (
          <link
            key={locale}
            rel="alternate"
            href={`${process.env.NEXT_PUBLIC_HOST}/${locale}${router.pathname}`}
            hrefLang={locale}
          />
        ))}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <VideoContext.Provider value={[video, setVideoFile]}>
        <Component {...pageProps} />
      </VideoContext.Provider>
      <Footer />
      <DragArea setVideo={setVideoFile} />
    </>
  );
}

function DragArea({ setVideo }: { setVideo: VideoState[1] }) {
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const handler = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      let file = e.dataTransfer?.files[0];
      if (file) {
        setVideo(file, "dropped");
      }
    };
    const allowDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(true);
    };
    const dragLeave = () => {
      setDragOver(false);
    };

    document.addEventListener("drop", handler);
    document.addEventListener("dragover", allowDrop);
    document.addEventListener("dragend", dragLeave);
    window.addEventListener("blur", dragLeave);
    document.addEventListener("keydown", dragLeave);
    document.addEventListener("click", dragLeave);
    return () => {
      document.removeEventListener("drop", handler);
      document.removeEventListener("dragover", allowDrop);
      document.removeEventListener("dragend", dragLeave);
      window.removeEventListener("blur", dragLeave);
      document.removeEventListener("keydown", dragLeave);
      document.removeEventListener("click", dragLeave);
    };
  }, [setVideo]);

  if (!dragOver) {
    return <></>;
  }

  return (
    <div className="fixed inset-0 bg-slate-500/50 flex items-center justify-around">
      <div className="flex bg-white rounded-2xl p-4 shadow-xl text-2xl animate-pulse">
        {i18next.t("drop_video")}
      </div>
    </div>
  );
}
