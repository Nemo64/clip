import {fileOpen} from "browser-fs-access";
import Head from "next/head";
import {useContext, useEffect, useMemo, useState} from "react";
import {Controller, useForm} from "react-hook-form";
import {Button} from "../components/button";
import {Markdown} from "../components/markdown";
import {ProgressBar} from "../components/progress";
import {AudioFormatSelect, VideoFormatSelect} from "../components/selects";
import {Timeline} from "../components/timeline";
import {t} from "../src/intl"
import {convertVideo, createPreviews, Format, KnownVideo, NewVideo, possibleAudioFormats, possibleVideoFormats, Video} from "../src/video";
import {VideoContext, VideoState} from "./_app";

export default function Start() {
  const [video, setVideo] = useContext(VideoContext);
  const [progress, setProgress] = useState(-1);
  const [result, setResult] = useState<File>();

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

  const setVideoWrapped = (video: Parameters<typeof setVideo>[0]) => {
    setVideo(video);
    setProgress(-1);
    setResult(undefined);
  };

  if (result && video?.status === "known") {
    return <DownloadPage video={video} file={result} setVideo={setVideoWrapped}/>
  }

  if (progress >= 0 && video) {
    return <ProgressPage video={video} progress={progress}/>;
  }

  if (video?.status === "new") {
    return <AnalyseVideo video={video}/>;
  }

  if (video?.status === "known") {
    return <ConvertPage video={video} setVideo={setVideoWrapped} start={start}/>;
  }

  return <SelectPage setVideo={setVideoWrapped}/>;
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
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline-block align-text-top mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        </svg>
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
    <div className="max-w-sm mx-auto">
      <h1 className="text-2xl text-center my-4">
        <div className="inline-block w-4 h-4 mr-2 animate-spin rounded-full border-2 border-red-200 border-r-red-500"/>
        {t('analyse.title', {name: video.file.name})}
      </h1>
    </div>
  </>
}

const MAX_DURATION = 2 * 60;

function ConvertPage({video, setVideo, start}: { video: KnownVideo, setVideo: VideoState[1], start: (format: Format) => Promise<void> }) {
  const picInt = Math.max(video.metadata.container.duration / 64, 1);
  const [pics, setPics] = useState<string[]>([]);
  const [picsDone, setPicsDone] = useState(false);

  useEffect(() => {
    let stop = false;
    (async () => {
      try {
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
        duration: Math.min(video.metadata.container.duration, MAX_DURATION),
      },
      video: undefined,
      audio: undefined,
    },
  });

  const currentContainer = watch('container');
  const audioFormats = useMemo(() => {
    const audioFormats = possibleAudioFormats({...video.metadata, container: currentContainer});
    const currentPreset = getValues('audio.preset') ?? localStorage.getItem('audio.preset') ?? 'bitrate_high';
    setValue('audio', audioFormats.find(f => f.preset === currentPreset) ?? audioFormats[0]);
    return audioFormats;
  }, [video.metadata, currentContainer, getValues, setValue]);

  const currentAudio = watch('audio');
  const videoFormats = useMemo(() => {
    const videoFormats = possibleVideoFormats({...video.metadata, container: currentContainer, audio: currentAudio});
    const currentPreset = getValues('video.preset') ?? localStorage.getItem('video.preset') ?? 'size_8mb';
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
    <form className="max-w-lg mx-auto p-2" onSubmit={handleSubmit(start)}>
      <h1 className="text-2xl my-4">
        {t('conversion.title', {name: video.file.name})}
      </h1>

      <div className="my-4">
        <label htmlFor="video_format">{t('conversion.video_quality.label')}</label>
        <Controller control={control} name="video" rules={formatRules} render={({field: {ref, ...field}}) => (
          <VideoFormatSelect formats={videoFormats} id="video_format" {...field} />
        )}/>
      </div>

      <div className="my-4">
        <label htmlFor="audio_format">{t('conversion.audio_quality.label')}</label>
        <Controller control={control} name="audio" rules={formatRules} render={({field: {ref, ...field}}) => (
          <AudioFormatSelect formats={audioFormats} id="audio_format" {...field} />
        )}/>
      </div>

      <div className="my-4">
        <Controller control={control} name="container" render={({field: {ref, ...field}}) => <>
          <Timeline frame={video.metadata.container} limit={MAX_DURATION} pics={pics} picInt={picInt} metadata={video.metadata} {...field}/>
        </>}/>
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="px-4 py-2 rounded bg-red-800 hover:bg-red-700 text-white" disabled={!picsDone}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline-block align-bottom mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {t('conversion.button.start')}
        </Button>

        <Button onClick={() => setVideo(undefined)} className="px-4 py-2 rounded bg-slate-400 hover:bg-slate-500 text-white">
          {t('conversion.button.change')}
        </Button>
      </div>
    </form>
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

  return <>
    <Head>
      <title>{t('download.title', {name: file.name})}</title>
    </Head>
    <div className="max-w-lg mx-auto p-2">
      <h1 className="text-2xl my-4">
        {t('download.title', {name: file.name})}
      </h1>

      <div className="block w-full my-4" style={{aspectRatio: `${video.metadata.video.width} / ${video.metadata.video.height}`}}>
        {url ? <video className="mx-auto w-full" controls autoPlay={true} src={url}/> : t('download.loading')}
      </div>

      <Button href={url} download={file.name} className="mx-auto table my-4 px-4 py-2 rounded bg-red-800 hover:bg-red-700 text-white">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline-block align-bottom mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        {t('download.button', {size: Math.ceil(file.size / 1000)})}
      </Button>

      <Button onClick={() => setVideo(undefined)} className="mx-auto table relative my-4 px-4 py-2 rounded bg-slate-400 hover:bg-slate-500 text-white">
        {t('conversion.button.change')}
      </Button>
    </div>
  </>;
}
