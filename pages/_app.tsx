import i18next from "i18next";
import type {AppProps} from 'next/app'
import Head from "next/head";
import {createContext, useCallback, useEffect, useState} from "react";
import {Footer} from "../components/footer";
import {analyzeVideo, createVideo, FFMPEG_PATHS, Video} from "../src/video";
import '../styles/globals.css'

export type VideoState = [Video | undefined, (file: File | undefined) => void];
export const VideoContext = createContext<VideoState>([undefined, () => undefined]);

export default function MyApp({Component, pageProps, router}: AppProps) {
  if (i18next.languages[0] !== router.locale) {
    i18next.changeLanguage(router.locale).catch(console.error);
  }

  const [video, setVideo] = useState<Video | undefined>(undefined);
  const [dragOver, setDragOver] = useState(false);

  const setVideoWrapped = useCallback(async (file: File | undefined) => {
    if (video && "ffmpeg" in video) try {
      video.ffmpeg.exit()
    } catch {
    }

    if (!file) {
      setVideo(undefined);
      return;
    }

    try {
      const newVideo = await createVideo(file);
      setVideo(newVideo);
      const identifiedVideo = await analyzeVideo(newVideo);
      setVideo(identifiedVideo);
    } catch (e) {
      setVideo({status: "broken", file, message: String(e)});
    }
  }, [video, setVideo]);

  useEffect(() => {
    const handler = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      setVideoWrapped(e.dataTransfer?.files[0]);
    };
    const allowDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(true);
    };
    const dragLeave = () => {
      setDragOver(false);
    };

    document.addEventListener('drop', handler);
    document.addEventListener('dragover', allowDrop);
    document.addEventListener('dragend', dragLeave);
    window.addEventListener('blur', dragLeave);
    document.addEventListener('keydown', dragLeave);
    document.addEventListener('click', dragLeave);
    return () => {
      document.removeEventListener('drop', handler);
      document.removeEventListener('dragover', allowDrop);
      document.removeEventListener('dragend', dragLeave);
      window.removeEventListener('blur', dragLeave);
      document.removeEventListener('keydown', dragLeave);
      document.removeEventListener('click', dragLeave);
    };
  }, [setVideoWrapped]);

  return <>
    <Head>
      <link key="canonical" rel="canonical" href={`${process.env.NEXT_PUBLIC_HOST}/${router.locale}${router.pathname}`}/>
      <link key="x-default" rel="alternate" href={`${process.env.NEXT_PUBLIC_HOST}${router.pathname}`} hrefLang="x-default"/>
      {router.locales?.map(locale => (
        <link key={locale} rel="alternate" href={`${process.env.NEXT_PUBLIC_HOST}/${locale}${router.pathname}`} hrefLang={locale}/>
      ))}
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <meta name="robots" content="noindex"/>
      {Object.values(FFMPEG_PATHS).map(info => (
        <link key={info.href} {...info}/>
      ))}
    </Head>
    <VideoContext.Provider value={[video, setVideoWrapped]}>
      <Component {...pageProps} />
    </VideoContext.Provider>
    <Footer/>
    {dragOver && (
      <div className="fixed inset-0 bg-slate-500/50 flex items-center justify-around">
        <div className="flex bg-white rounded p-4 shadow-xl text-2xl animate-pulse">
          {i18next.t('drop_video')}
        </div>
      </div>
    )}
  </>;
}
