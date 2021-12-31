import type {AppProps} from 'next/app'
import Head from "next/head";
import {createContext, useState} from "react";
import {Video} from "../src/video";
import '../styles/globals.css'

export type VideoState = [Video | undefined, (video: Video | undefined) => void];
export const VideoContext = createContext<VideoState>([undefined, () => undefined]);

function MyApp({Component, pageProps}: AppProps) {
  const videoState: VideoState = useState<Video | undefined>(undefined);

  return <>
    <Head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <meta name="robots" content="noindex"/>
    </Head>
    <VideoContext.Provider value={videoState}>
      <Component {...pageProps} />
    </VideoContext.Provider>
  </>;
}

export default MyApp;
