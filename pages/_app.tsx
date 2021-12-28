import '../styles/globals.css'
import type {AppProps} from 'next/app'
import {createContext, useState} from "react";
import {Video} from "../src/video";

export type VideoState = [Video | undefined, (video: Video | undefined) => void];
export const VideoContext = createContext<VideoState>([undefined, () => undefined]);

function MyApp({Component, pageProps}: AppProps) {
  const videoState: VideoState = useState<Video | undefined>(undefined);

  return (
    <VideoContext.Provider value={videoState}>
      <Component {...pageProps} />
    </VideoContext.Provider>
  )
}

export default MyApp;
