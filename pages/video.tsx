import Head from "next/head";
import {useRouter} from "next/router";
import {useContext, useEffect, useMemo, useState} from "react";
import {Controller, useForm} from "react-hook-form";
import {Button} from "../components/button";
import {BoltIcon, DownloadIcon, Spinner} from "../components/icons";
import {ProgressBar} from "../components/progress";
import {AudioFormatSelect, VideoFormatSelect} from "../components/selects";
import {Timeline} from "../components/timeline";
import {t} from "../src/intl";
import {trackEvent} from "../src/tracker";
import {
  BrokenVideo,
  convertVideo,
  createPreviews,
  Format,
  KnownVideo,
  NewVideo,
  possibleAudioFormats,
  possibleVideoFormats,
  Video,
} from "../src/video";
import {VideoContext, VideoState} from "./_app";

export default function VideoPage() {
  const [video, setVideo] = useContext(VideoContext);
  const [progress, setProgress] = useState(-1);
  const [result, setResult] = useState<File>();
  const router = useRouter();

  // reset result when video changes
  useEffect(() => {
    setProgress(-1);
    setResult(undefined);
  }, [video]);

  // redirect to startpage if video is not known
  useEffect(() => {
    if (!video) {
      router.push("/");
    }
  }, [video, router]);

  const start = async (format: Format) => {
    if (video?.status !== 'known') {
      throw new Error("Video is not known");
    }

    const startTime = Date.now();
    const presetStr = `${format.video.original ? 'original' : format.video.preset}:${format.audio?.original ? 'original' : format.audio?.preset}:${2 ** Math.round(Math.log2(format.container.duration))}s`;
    const formatStr = `${video.metadata.video.codec}:${video.metadata.audio?.codec}:${2 ** Math.round(Math.log2(video.metadata.container.duration))}s`;
    try {
      console.log('convert using format', format);
      trackEvent('convert-start', presetStr, formatStr);
      setProgress(0);
      const convertedVideo = await convertVideo(video, format, setProgress);
      trackEvent('convert-finish', presetStr, formatStr, (Date.now() - startTime) / 1000);
      console.log('converted video', convertedVideo);
      setResult(convertedVideo.file);
      setProgress(-1);
    } catch (e) {
      trackEvent('convert-error', presetStr, String(e), (Date.now() - startTime) / 1000);
      setProgress(-1);
      throw e;
    }
  };

  if (result && video?.status === "known") {
    return <DownloadPage video={video} file={result}/>;
  }

  if (progress >= 0 && video) {
    return <ProgressPage video={video} progress={progress}/>;
  }

  if (video?.status === "new") {
    return <AnalyseVideo video={video}/>;
  }

  if (video?.status === "broken") {
    return <ErrorVideo video={video}/>;
  }

  if (video?.status === "known") {
    return <ConvertPage video={video} setVideo={setVideo} start={start}/>;
  }

  return <></>;
}

function AnalyseVideo({video}: { video: NewVideo }) {
  return <>
    <Head>
      <title>{t('analyse.title', {name: video.file.name})}</title>
    </Head>
    <div className="max-w-lg mx-auto motion-safe:animate-fly-1">
      <h1 className="text-2xl text-center my-4">
        <Spinner className="mr-2 align-middle"/>
        {t('analyse.title', {name: video.file.name})}
      </h1>
    </div>
  </>;
}

function ErrorVideo({video}: { video: BrokenVideo }) {
  return <>
    <Head>
      <title>{t('broken.title', {name: video.file.name})}</title>
    </Head>
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl text-center my-4 animate-fly-1">
        {t('broken.title', {name: video.file.name})}
      </h1>
      <div className="motion-safe:animate-fly-2">
        {video.message && <p className="my-4 text-red-800">{video.message}</p>}
      </div>
      <div className="text-center animate-fly-3">
        <Button href="/" className="px-4 py-2 rounded-2xl bg-slate-500 hover:bg-slate-600 text-white">
          {t('conversion.button.change')}
        </Button>
      </div>
    </div>
  </>;
}

const MAX_DURATION = 5 * 60;

function ConvertPage({video, setVideo, start}: { video: KnownVideo, setVideo: VideoState[1], start: (format: Format) => Promise<void> }) {
  const picInt = Math.max(video.metadata.container.duration / 30, 0.5);
  const [pics, setPics] = useState<string[]>([]);

  useEffect(() => {
    let canceled = false;
    const pics: string[] = [];
    (async () => {
      const startTime = Date.now();
      const formatStr = `${video.metadata.video.codec}:${video.metadata.audio?.codec}:${2 ** Math.round(Math.log2(video.metadata.container.duration))}s`;
      try {
        trackEvent('thumbnail-start', 'generate', formatStr);
        for await (const preview of createPreviews(video, picInt)) {
          if (canceled) break;
          pics.push(URL.createObjectURL(preview));
          setPics([...pics]); // copy over so react rerenders
        }
        if (!canceled) {
          trackEvent('thumbnail-finish', 'generate', formatStr, (Date.now() - startTime) / 1000);
        }
      } catch (e) {
        trackEvent('thumbnail-error', 'generate', String(e), (Date.now() - startTime) / 1000);
        throw e;
      }
    })();
    return () => {
      canceled = true;
      pics.forEach(URL.revokeObjectURL);
      setPics([]);
    };
  }, [video, picInt]);

  const {control, handleSubmit, watch, getValues, setValue} = useForm<Format>({
    defaultValues: {
      container: {
        start: video.metadata.container.start,
        duration: Math.min(video.metadata.container.duration, MAX_DURATION, 60), // start with 60 seconds
      },
      video: undefined,
      audio: undefined,
    },
  });

  const currentContainer = watch('container');
  const audioFormats = useMemo(() => {
    const audioFormats = possibleAudioFormats({...video.metadata, container: currentContainer});
    const currentPreset = getValues('audio.preset') ?? 'bitrate_high';
    setValue('audio', audioFormats.find(f => f.preset === currentPreset) ?? audioFormats[0]);
    return audioFormats;
  }, [video.metadata, currentContainer, getValues, setValue]);

  const currentAudio = watch('audio');
  const videoFormats = useMemo(() => {
    const videoFormats = possibleVideoFormats({...video.metadata, container: currentContainer, audio: currentAudio});
    const currentPreset = getValues('video.preset') ?? 'size_8mb';
    setValue('video', videoFormats.find(f => f.preset === currentPreset) ?? videoFormats[0]);
    return videoFormats;
  }, [video.metadata, currentContainer, currentAudio, getValues, setValue]);

  const formatRules = {
    required: true,
    validate: (format?: { implausible?: boolean }): boolean => !format?.implausible,
  };

  return <>
    <Head>
      <title>{t("conversion.title", {name: video.file.name})}</title>
    </Head>
    <div className="container mx-auto p-2">

      <h1 className="text-2xl my-4 motion-safe:animate-fly-1">
        {t('conversion.title', {name: video.file.name})}
      </h1>

      <form className="flex flex-wrap sm:flex-nowrap justify-center gap-4" onSubmit={handleSubmit(start)}>
        <div className="flex-auto max-w-lg sm:max-w-none motion-safe:animate-fly-5">
          <Controller control={control} name="container" render={({field: {ref, ...field}}) => <>
            <Timeline frame={video.metadata.container} width={video.metadata.video.width} height={video.metadata.video.height}
                      pics={pics} picInt={picInt} limit={MAX_DURATION} {...field}/>
          </>}/>
        </div>
        <div className="flex-auto max-w-lg">
          <div className="mb-2 motion-safe:animate-fly-2">
            <label htmlFor="video_format">{t('conversion.video_quality.label')}</label>
            <Controller control={control} name="video" rules={formatRules} render={({field: {ref, ...field}}) => (
              <VideoFormatSelect formats={videoFormats} id="video_format" {...field} />
            )}/>
          </div>

          <div className="my-2 motion-safe:animate-fly-3">
            <label htmlFor="audio_format">{t('conversion.audio_quality.label')}</label>
            <Controller control={control} name="audio" rules={formatRules} render={({field: {ref, ...field}}) => (
              <AudioFormatSelect formats={audioFormats} id="audio_format" {...field} />
            )}/>
          </div>

          <div className="flex gap-2 mt-4 motion-safe:animate-fly-4">
            <Button type="submit" className="px-4 py-2 rounded-2xl bg-red-800 hover:bg-red-700 text-white">
              <BoltIcon className="align-bottom mr-2 -ml-1"/>
              {t('conversion.button.start')}
            </Button>

            <Button href="/" className="px-4 py-2 rounded-2xl bg-slate-500 hover:bg-slate-600 text-white">
              {t('conversion.button.change')}
            </Button>
          </div>
        </div>
      </form>

    </div>
  </>;
}

function ProgressPage({video, progress}: { video: Video, progress: number }) {
  return <>
    <Head>
      <title>{t('progress.value', {progress})}</title>
    </Head>
    <div className="max-w-lg mx-auto p-2">
      <h1 className="text-2xl my-4 motion-safe:animate-fly-1">
        {t('progress.headline', {name: video.file.name})}
      </h1>
      <ProgressBar progress={progress} className="my-4 motion-safe:animate-fly-2">
        {t('progress.value', {progress})}
      </ProgressBar>
    </div>
  </>;
}

function DownloadPage({file, video}: { file: File, video: KnownVideo }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, setUrl]);

  const aspectRatio = `${video.metadata.video.width} / ${video.metadata.video.height}`;
  const maxWidth = `${80 * video.metadata.video.width / video.metadata.video.height}vh`;

  return <>
    <Head>
      <title>{t('download.title', {name: file.name})}</title>
    </Head>
    <div className="block w-full max-h-[80vh] min-w-full bg-slate-300" style={{aspectRatio}}>
      {url
        ? <video className="mx-auto h-full bg-slate-500 motion-safe:animate-fly-1" controls autoPlay={true} src={url} style={{aspectRatio}}/>
        : t('download.loading')}
    </div>
    <div className="mx-auto p-2 flex flex-row items-baseline justify-between flex-wrap gap-2 box-content" style={{maxWidth}}>
      <h1 className="flex text-2xl motion-safe:animate-fly-2">
        {t('download.title', {name: file.name})}
      </h1>

      <div className="flex flex-row items-baseline gap-2 motion-safe:animate-fly-3">
        <Button href={url} download={file.name} className="table px-4 py-2 rounded-2xl bg-red-800 hover:bg-red-700 text-white">
          <DownloadIcon className="align-bottom mr-2 -ml-1"/>
          {t('download.button', {size: Math.ceil(file.size / 1000)})}
        </Button>

        <Button href="/" className="table relative px-4 py-2 rounded-2xl bg-slate-500 hover:bg-slate-600 text-white">
          {t('conversion.button.change')}
        </Button>
      </div>
    </div>
  </>;
}
