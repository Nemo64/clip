import {fileOpen} from "browser-fs-access";
import Head from "next/head";
import {useContext, useMemo, useState} from "react";
import {Controller, useForm} from "react-hook-form";
import {Button} from "../components/button";
import {Markdown} from "../components/markdown";
import {ProgressBar} from "../components/progress";
import {AudioFormatSelect, VideoFormatSelect} from "../components/selects";
import {Timeline} from "../components/timeline";
import {t} from "../src/intl"
import {convertVideo, Format, KnownVideo, NewVideo, possibleAudioFormats, possibleVideoFormats, Video} from "../src/video";
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

  if (result) {
    return <DownloadPage file={result} setVideo={setVideoWrapped}/>
  }

  if (progress >= 0) {
    return <ProgressPage progress={progress}/>;
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
    <div className="max-w-sm mx-auto">
      <h1 className="text-2xl text-center my-4">
        {t('upload.title')}
      </h1>
      <Markdown className="text-center">
        {t('upload.description')}
      </Markdown>
      <Button className="mx-auto block relative px-4 py-2 rounded bg-red-800 hover:bg-red-700 text-white text-xl" onClick={changeVideo}>
        <div className="absolute inset-0 -z-50 rounded bg-red-800 animate-ping opacity-20"/>
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

const MAX_DURATION = 60;

function ConvertPage({video, setVideo, start}: { video: KnownVideo, setVideo: VideoState[1], start: (format: Format) => Promise<void> }) {
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
    <form className="container max-w-lg mx-auto" onSubmit={handleSubmit(start)}>
      <h1 className="text-2xl my-4">
        {t('conversion.title', {name: video.file.name})}
      </h1>

      <div className="max-w-lg">
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
      </div>

      <div className="my-4">
        <Controller control={control} name="container" render={({field: {ref, ...field}}) => <>
          <Timeline frame={video.metadata.container} limit={MAX_DURATION} {...field}/>
        </>}/>
      </div>

      <div className="flex gap-2">
        <Button className="px-4 py-2 rounded bg-red-800 hover:bg-red-700 text-white" type="submit">
          {t('conversion.button.start')}
        </Button>

        <Button className="px-4 py-2 rounded bg-slate-400 hover:bg-slate-500 text-white"
                onClick={() => setVideo(undefined)}>
          {t('conversion.button.change')}
        </Button>
      </div>
    </form>
  </>;
}

function ProgressPage({progress}: { progress: number }) {
  return <>
    <Head>
      <title>{t('conversion.progress', {progress})}</title>
    </Head>
    <div className="max-w-md mx-auto">
      <ProgressBar progress={progress}>
        {t('conversion.progress', {progress})}
      </ProgressBar>
    </div>
  </>;
}

function DownloadPage({file, setVideo}: { file: File, setVideo: VideoState[1] }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);

  return <>
    <Head>
      <title>{t('download.title', {name: file.name})}</title>
    </Head>
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl my-4">
        {t('download.title', {name: file.name})}
      </h1>

      <video className="mx-auto my-4" controls autoPlay={true} src={url}/>

      <Button className="mx-auto table my-4 px-4 py-2 rounded bg-red-800 hover:bg-red-700 text-white"
              href={url} download={file.name}>
        {t('download.button')}
      </Button>

      <Button className="mx-auto table relative my-4 px-4 py-2 rounded bg-slate-400 hover:bg-slate-500 text-white"
              onClick={() => setVideo(undefined)}>
        {t('conversion.button.change')}
      </Button>
    </div>
  </>;
}
