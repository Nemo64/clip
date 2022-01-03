import {fileOpen} from "browser-fs-access";
import Head from "next/head";
import {useContext, useEffect, useMemo, useState} from "react";
import {Controller, useForm} from "react-hook-form";
import {Button} from "../components/button";
import {AddFileIcon, BoltIcon, DownloadIcon, Spinner} from "../components/icons";
import {Markdown} from "../components/markdown";
import {ProgressBar} from "../components/progress";
import {AudioFormatSelect, VideoFormatSelect} from "../components/selects";
import {Timeline} from "../components/timeline";
import {t} from "../src/intl"
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

export default function Start() {
  const [video, setVideo] = useContext(VideoContext);
  const [progress, setProgress] = useState(-1);
  const [result, setResult] = useState<File>();

  // reset result when video changes
  useEffect(() => {
    setProgress(-1);
    setResult(undefined);
  }, [video]);

  const start = async (format: Format) => {
    if (video?.status !== 'known') {
      throw new Error("Video is not known");
    }

    try {
      console.log('convert using format', format);
      setProgress(0);
      const convertedVideo = await convertVideo(video, format, setProgress);
      setResult(convertedVideo.file);
      console.log('converted video', convertedVideo);
    } finally {
      setProgress(-1);
      try {
        video.ffmpeg.exit();
      } catch {
      }
    }
  };

  if (result && video?.status === "known") {
    return <DownloadPage video={video} file={result} setVideo={setVideo}/>
  }

  if (progress >= 0 && video) {
    return <ProgressPage video={video} progress={progress}/>;
  }

  if (video?.status === "new") {
    return <AnalyseVideo video={video}/>;
  }

  if (video?.status === "broken") {
    return <ErrorVideo video={video} setVideo={setVideo}/>;
  }

  if (video?.status === "known") {
    return <ConvertPage video={video} setVideo={setVideo} start={start}/>;
  }

  return <SelectPage setVideo={setVideo}/>;
};

function SelectPage({setVideo}: { setVideo: VideoState[1] }) {
  const [error, setError] = useState<string | undefined>();

  const changeVideo = async () => {
    try {
      setError(undefined);
      setVideo(await fileOpen({
        startIn: "videos",
        mimeTypes: ['video/*'],
        id: "video-select",
      }));
    } catch (e) {
      setError(String(e));
    }
  };

  return <>
    <Head>
      <title>{t('upload.title')}</title>
    </Head>
    <div className="max-w-lg mx-auto p-2 sm:my-8">
      <h1 className="text-2xl text-center my-4">
        {t('upload.title')}
      </h1>
      <Markdown className="text-center">
        {t('upload.description')}
      </Markdown>
      <Button onClick={changeVideo} className="mx-auto block relative px-4 py-2 rounded bg-red-800 hover:bg-red-700 text-white text-xl">
        <div className="absolute inset-0 -z-50 rounded bg-red-800 animate-ping opacity-20"/>
        <AddFileIcon className="align-text-bottom mr-2 -ml-1"/>
        {t('upload.button')}
      </Button>
      {error && (
        <p className="bg-red-600 py-2 px-4 rounded text-white text-center my-4">
          {error}
        </p>
      )}
    </div>
  </>
}

function AnalyseVideo({video}: { video: NewVideo }) {
  return <>
    <Head>
      <title>{t('analyse.title', {name: video.file.name})}</title>
    </Head>
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl text-center my-4">
        <Spinner className="mr-2 align-middle" />
        {t('analyse.title', {name: video.file.name})}
      </h1>
    </div>
  </>
}

function ErrorVideo({video, setVideo}: { video: BrokenVideo, setVideo: (video: File | undefined) => void }) {
  return <>
    <Head>
      <title>{t('broken.title', {name: video.file.name})}</title>
    </Head>
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl text-center my-4">
        {t('broken.title', {name: video.file.name})}
      </h1>
      {video.message && <p className="my-4 text-red-800">{video.message}</p>}
      <Button onClick={() => setVideo(undefined)} className="block mx-auto px-4 py-2 rounded bg-slate-500 hover:bg-slate-600 text-white">
        {t('conversion.button.change')}
      </Button>
    </div>
  </>
}

const MAX_DURATION = 5 * 60;

function ConvertPage({video, setVideo, start}: { video: KnownVideo, setVideo: VideoState[1], start: (format: Format) => Promise<void> }) {
  const picInt = Math.max(video.metadata.container.duration / 64, 0.5);
  const [pics, setPics] = useState<string[]>([]);
  const [picsDone, setPicsDone] = useState(false);

  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        setPicsDone(false);
        for await (const preview of createPreviews(video, picInt)) {
          if (stop) break;
          pics.push(URL.createObjectURL(preview));
          setPics([]); // hack to force re-render
          setPics(pics);
        }
      } finally {
        if (!stop) {
          setPicsDone(true);
        }
      }
    })();
    return () => {
      stop = true;
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

      <h1 className="text-2xl my-4">
        {t('conversion.title', {name: video.file.name})}
      </h1>

      <form className="flex flex-wrap sm:flex-nowrap justify-center gap-4" onSubmit={handleSubmit(start)}>
        <div className="flex-auto max-w-lg sm:max-w-none">
          <Controller control={control} name="container" render={({field: {ref, ...field}}) => <>
            <Timeline frame={video.metadata.container} pics={pics} picInt={picInt} limit={MAX_DURATION} metadata={video.metadata} {...field}/>
          </>}/>
        </div>
        <div className="flex-auto max-w-lg">
          <div className="mb-2">
            <label htmlFor="video_format">{t('conversion.video_quality.label')}</label>
            <Controller control={control} name="video" rules={formatRules} render={({field: {ref, ...field}}) => (
              <VideoFormatSelect formats={videoFormats} id="video_format" {...field} />
            )}/>
          </div>

          <div className="my-2">
            <label htmlFor="audio_format">{t('conversion.audio_quality.label')}</label>
            <Controller control={control} name="audio" rules={formatRules} render={({field: {ref, ...field}}) => (
              <AudioFormatSelect formats={audioFormats} id="audio_format" {...field} />
            )}/>
          </div>

          <div className="flex gap-2 mt-4">
            <Button type="submit" className="px-4 py-2 rounded bg-red-800 hover:bg-red-700 text-white" disabled={!picsDone}>
              {picsDone ? <BoltIcon className="align-bottom mr-2 -ml-1"/> : <Spinner className="align-bottom mr-2 -ml-1"/>}
              {t('conversion.button.start')}
            </Button>

            <Button onClick={() => setVideo(undefined)} className="px-4 py-2 rounded bg-slate-500 hover:bg-slate-600 text-white">
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
      <h1 className="text-2xl my-4">
        {t('progress.headline', {name: video.file.name})}
      </h1>
      <ProgressBar progress={progress} className="my-4">
        {t('progress.value', {progress})}
      </ProgressBar>
    </div>
  </>;
}

function DownloadPage({file, setVideo, video}: { file: File, setVideo: VideoState[1], video: KnownVideo }) {
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
        ? <video className="mx-auto h-full bg-slate-500" controls autoPlay={true} src={url} style={{aspectRatio}}/>
        : t('download.loading')}
    </div>
    <div className="mx-auto p-2 flex flex-row items-baseline justify-between flex-wrap gap-2 box-content" style={{maxWidth}}>
      <h1 className="flex text-2xl">
        {t('download.title', {name: file.name})}
      </h1>

      <div className="flex flex-row items-baseline gap-2">
        <Button href={url} download={file.name} className="table px-4 py-2 rounded bg-red-800 hover:bg-red-700 text-white">
          <DownloadIcon className="align-bottom mr-2 -ml-1"/>
          {t('download.button', {size: Math.ceil(file.size / 1000)})}
        </Button>

        <Button onClick={() => setVideo(undefined)} className="table relative px-4 py-2 rounded bg-slate-500 hover:bg-slate-600 text-white">
          {t('conversion.button.change')}
        </Button>
      </div>
    </div>
  </>;
}
