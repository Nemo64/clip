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
    </Head>
    <div className="container mx-auto md:my-16 flex flex-wrap items-center justify-center">
      <div className="md:w-5/12 p-8 -skew-y-6 drop-shadow-xl" tabIndex={-1} role="img">
        <Timeline frame={DEMO_TIMELINE} width={640} height={272} value={demoCrop} onChange={setDemoCrop}
                  pics={DEMO_IMAGES} picInt={DEMO_TIMELINE.duration / DEMO_IMAGES.length} />
      </div>
      <div className="md:w-7/12 p-2 pb-16">
        <h1 className="text-2xl font-semibold text-center my-4">
          {t('upload.title')}
        </h1>
        <Markdown className="text-center">
          {t('upload.description')}
        </Markdown>
        <Button onClick={selectVideo} className="mx-auto block relative px-4 py-2 rounded-lg bg-red-800 hover:bg-red-700 text-white text-xl">
          <div className="absolute inset-0 -z-50 rounded-lg bg-red-800 animate-ping opacity-20"/>
          <AddFileIcon className="align-text-bottom mr-2 -ml-1"/>
          {t('upload.button')}
        </Button>
        <div className="text-center text-sm text-slate-500">
          {t('upload.drop_hint')}
        </div>
        {error && (
          <p className="bg-red-600 py-2 px-4 rounded-lg text-white text-center my-4">
            {error}
          </p>
        )}
      </div>
    </div>
    <div className="max-w-lg mx-auto p-2">
      <Markdown>
        {t('upload.use_cases')}
      </Markdown>
    </div>
  </>;
}
