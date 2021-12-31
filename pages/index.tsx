import {fileOpen, fileSave} from "browser-fs-access";
import Head from "next/head";
import {useContext, useMemo, useState} from "react";
import {Controller, useForm} from "react-hook-form";
import {Button} from "../components/button";
import {ProgressBar} from "../components/progress";
import {AudioFormatSelect, VideoFormatSelect} from "../components/selects";
import {Timeline} from "../components/timeline";
import {t} from "../src/intl"
import {
  analyzeVideo,
  convertVideo,
  createVideo,
  Format,
  KnownVideo,
  possibleAudioFormats,
  possibleVideoFormats,
  Video,
} from "../src/video";
import {VideoContext} from "./_app";

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

  if (result) {
    const download = async () => {
      await fileSave(result, {
        startIn: "videos",
        fileName: result.name,
        mimeTypes: ['video/mp4'],
        id: 'video-save',
      });
      setProgress(-1);
      setResult(undefined);
      setVideo(undefined);
    };

    return (
      <div className="max-w-md mx-auto">
        <Button onClick={download} className="block mx-auto my-2 bg-red-600 py-2 px-4 rounded text-white">
          {t('conversion.download')}
        </Button>
      </div>
    );
  }

  if (progress >= 0) {
    return <>
      <div className="max-w-md mx-auto">
        <ProgressBar progress={progress}>
          {t('conversion.progress', {progress})}
        </ProgressBar>
      </div>
    </>;
  }

  if (video?.status === "known") {
    return <ConvertPage video={video} setVideo={setVideo} start={start}/>;
  }

  return <SelectPage setVideo={setVideo}/>;
};

async function selectVideo() {
  const file = await fileOpen({
    startIn: "videos",
    mimeTypes: ['video/*'],
    multiple: false,
    id: "video-select",
  })

  const newVideo = await createVideo(file);
  const knownVideo = await analyzeVideo(newVideo);
  console.log('video info', knownVideo);

  return knownVideo;
}

function SelectPage({setVideo}: { setVideo: (video: Video) => void }) {
  const [error, setError] = useState<string | undefined>();

  const changeVideo = async () => {
    try {
      setError(undefined);
      setVideo(await selectVideo());
    } catch (e) {
      setError(String(e));
    }
  };

  return <>
    <Head>
      <title>{t('upload.title')}</title>
    </Head>
    <div className="max-w-xs mx-auto">
      <h1 className="text-2xl text-center my-4">
        {t('upload.headline')}
      </h1>
      <p className="text-center my-4">
        {t('upload.description')}
      </p>
      <Button className="mx-auto block relative px-4 py-2 rounded bg-red-800 hover:bg-red-700 text-white text-xl" onClick={changeVideo}>
        <div className="absolute inset-0 -z-50 rounded bg-red-800 animate-ping opacity-20" />
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

const MAX_DURATION = 60;

function ConvertPage({video, setVideo, start}: { video: KnownVideo, setVideo: (video: Video) => void, start: (format: Format) => Promise<void> }) {
  const initialAudioFormats = useMemo(() => possibleAudioFormats(video.metadata), [video.metadata]);
  const initialVideoFormats = useMemo(() => possibleVideoFormats(video.metadata), [video.metadata]);

  const {control, handleSubmit, watch, getValues, setValue} = useForm<Format>({
    defaultValues: {
      container: {
        start: video.metadata.container.start,
        duration: Math.min(video.metadata.container.duration, MAX_DURATION),
      },
      video: initialVideoFormats[0],
      audio: initialAudioFormats[0],
    },
  });

  const currentContainer = watch('container');
  const audioFormats = useMemo(() => {
    const audioFormats = possibleAudioFormats({...video.metadata, container: currentContainer});
    const currentPreset = getValues('audio.preset');
    setValue('audio', audioFormats.find(f => f.preset === currentPreset) ?? audioFormats[0]);
    return audioFormats;
  }, [video.metadata, currentContainer, getValues, setValue]);

  const currentAudio = watch('audio');
  const videoFormats = useMemo(() => {
    const videoFormats = possibleVideoFormats({...video.metadata, container: currentContainer, audio: currentAudio});
    const currentPreset = getValues('video.preset');
    setValue('video', videoFormats.find(f => f.preset === currentPreset) ?? videoFormats[0]);
    return videoFormats
  }, [video.metadata, currentContainer, currentAudio, getValues, setValue]);

  const changeVideo = async () => {
    setVideo(await selectVideo())
  };

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
        {t('conversion.headline', {name: video.file.name})}
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

        <Button className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-white" onClick={changeVideo}>
          {t('conversion.button.change')}
        </Button>
      </div>
    </form>
  </>;
}
