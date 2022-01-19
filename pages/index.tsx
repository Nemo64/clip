import {fileOpen} from "browser-fs-access";
import Head from "next/head";
import {useRouter} from "next/router";
import {useContext, useEffect, useState} from "react";
import {Button} from "../components/button";
import {AddFileIcon} from "../components/icons";
import {Markdown} from "../components/markdown";
import {Crop, Timeline} from "../components/timeline";
import {ensureFreshFfmpegInstance} from "../src/ffmpeg";
import {t} from "../src/intl";
import {VideoContext} from "./_app";

const DEMO_TIMELINE: Crop = {start: 0, duration: 888};
const DEMO_IMAGES = [...Array(28)].map((_, i) => `/demo/${(i + 1).toString().padStart(2, "0")}.jpeg`);

export default function Start() {
  const [video, setVideo] = useContext(VideoContext);
  const [error, setError] = useState<string | undefined>();
  const [demoCrop, setDemoCrop] = useState<Crop>({start: DEMO_TIMELINE.start, duration: DEMO_TIMELINE.duration * 0.75});
  const router = useRouter();

  useEffect(() => {
    ensureFreshFfmpegInstance();
    router.prefetch("/video").catch(console.error);
  }, [router]);

  const selectVideo = async () => {
    try {
      setError(undefined);
      const file = await fileOpen({
        startIn: "videos",
        mimeTypes: ['video/*'],
        id: "video-select",
      });
      setVideo(file, 'selected');
    } catch (e) {
      setError(String(e));
    }
  };

  return <>
    <Head>
      <title>{t('upload.title')}</title>
      <meta name="description" content={t('upload.description')}/>
      <meta name="og:title" content={t('upload.title')}/>
      <meta name="og:description" content={t('upload.description')}/>
      <meta name="og:image" content={`${process.env.NEXT_PUBLIC_HOST}/og.png`}/>
      <meta name="og:url" content={`${process.env.NEXT_PUBLIC_HOST}${router.pathname}`}/>
    </Head>
    <div className="bg-red-600 text-white">
      <div className="container mx-auto md:py-16 flex flex-row-reverse flex-wrap items-center justify-center">

        <div className="md:w-7/12 p-2 pb-16">
          <h1 className="text-5xl font-semibold whitespace-pre-wrap text-center my-8 motion-safe:animate-fly-1">{t('upload.title')}</h1>
          <div className="motion-safe:animate-fly-2">
            <p className="my-4 text-center whitespace-pre-wrap">{t('upload.description')}</p>
            <Button onClick={selectVideo} className="mx-auto block relative px-5 py-3 text-2xl rounded-3xl shadow-lg shadow-red-900/50 bg-red-900 hover:bg-red-800 text-white text-xl">
              <div className="absolute inset-0 rounded-3xl bg-red-900/20 animate-ping pointer-events-none"/>
              <div className="relative">
                <AddFileIcon className="align-text-bottom mr-2 -ml-1"/>
                {t('upload.button')}
              </div>
            </Button>
            <div className="my-4 text-center text-sm text-red-200">{t('upload.drop_hint')}</div>
            {error && <p className="bg-red-600 py-2 px-4 rounded-2xl text-white text-center my-4">{error}</p>}
          </div>
        </div>

        <div className="md:w-5/12 p-8 drop-shadow-xl motion-safe:animate-fly-3" role="img">
          <div className="-skew-y-6">
            <Timeline frame={DEMO_TIMELINE} width={640} height={272} value={demoCrop} onChange={setDemoCrop}
                      pics={DEMO_IMAGES} picInt={DEMO_TIMELINE.duration / DEMO_IMAGES.length} />
          </div>
        </div>

      </div>

      <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full">
        <path d="M1200,0H0V120H281.94C572.9,116.24,602.45,3.86,602.45,3.86h0S632,116.24,923,120h277Z" className="fill-white rotate-180 origin-center" />
      </svg>
    </div>
    <div className="max-w-lg mx-auto p-2">
      <Markdown>
        {t('upload.use_cases')}
      </Markdown>
    </div>
  </>;
}
