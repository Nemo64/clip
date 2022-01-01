import type {AppProps} from 'next/app'
import Head from "next/head";
import {createContext, useCallback, useEffect, useState} from "react";
import {Footer} from "../components/footer";
import {Link} from "../components/link";
import {t} from "../src/intl";
import {analyzeVideo, createVideo, FFMPEG_PATHS, Video} from "../src/video";
import '../styles/globals.css'

export type VideoState = [Video | undefined, (file: File | undefined) => void];
export const VideoContext = createContext<VideoState>([undefined, () => undefined]);

function MyApp({Component, pageProps}: AppProps) {
  const [video, setVideo] = useState<Video | undefined>(undefined);

  const setVideoWrapped = useCallback(async (file: File | undefined) => {
    if (video) try {
      video.ffmpeg.exit()
    } catch {
    }
    if (!file) {
      setVideo(undefined);
      return;
    }
    const newVideo = await createVideo(file);
    setVideo(newVideo);
    const identifiedVideo = await analyzeVideo(newVideo);
    setVideo(identifiedVideo);
  }, [video, setVideo]);

  useEffect(() => {
    const handler = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setVideoWrapped(e.dataTransfer?.files[0]);
    };
    document.addEventListener('drop', handler);
    return () => {
      document.removeEventListener('drop', handler);
    };
  }, [setVideoWrapped]);

  return <>
    <Head>
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
  </>;
}

export default MyApp;
