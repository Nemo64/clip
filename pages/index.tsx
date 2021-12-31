import Head from "next/head";
import {useContext, useMemo, useState} from "react";
import {Controller, useForm} from "react-hook-form";
import {Button} from "../components/button";
import {AudioFormatSelect, VideoFormatSelect} from "../components/selects";
import {Timeline} from "../components/timeline";
import {t} from "../src/intl"
// @ts-ignore
// import { showOpenFilePicker, showSaveFilePicker } from 'native-file-system-adapter';
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

  if (video?.status === "known") {
    return <ConvertPage video={video} setVideo={setVideo}/>;
  }

  return <SelectPage setVideo={setVideo}/>;
};

async function selectVideo() {
  const file = await showOpenFilePicker({
    excludeAcceptAllOption: true,
    multiple: false,
    types: [{
      description: "Video",
      accept: {"video/*": [".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v"]},
    }],
  });

  const newVideo = await createVideo(await file[0].getFile());
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
      <Button className="mx-auto block px-4 py-2 rounded bg-red-800 hover:bg-red-700 text-white text-xl" onClick={changeVideo}>
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

function ConvertPage({video, setVideo}: { video: KnownVideo, setVideo: (video: Video) => void }) {
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

  const [progress, setProgress] = useState(-1);
  const working = progress >= 0;

  const changeVideo = async () => {
    setVideo(await selectVideo())
  };

  const onSubmit = handleSubmit(async format => {
    try {
      const handlePromise = showSaveFilePicker({
        suggestedName: video.file.name.replace(/\.\w{2,4}$|$/, ".mp4"),
        excludeAcceptAllOption: true,
        types: [{
          description: "Video",
          accept: {"video/*": [".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v"]},
        }],
      });

      console.log('convert using format', format);
      setProgress(0);
      const conversion = convertVideo(video, format, setProgress);
      const [handle, convertedVideo] = await Promise.all([handlePromise, conversion]);
      console.log('converted video', convertedVideo);

      const writer = await handle.createWritable({keepExistingData: false});
      await writer.write(convertedVideo.file);
      await writer.close();
    } finally {
      setProgress(-1);
      try {
        video.ffmpeg.exit();
      } catch {
      }
    }
  });

  const formatRules = {
    required: true,
    validate: (format?: { implausible?: boolean }): boolean => !format?.implausible,
  };

  return <>
    <Head>
      <title>{t("conversion.title", {name: video.file.name})}</title>
    </Head>
    <form className="container max-w-lg mx-auto" onSubmit={onSubmit} aria-busy={working}>
      <h1 className="text-2xl my-4">
        {t('conversion.headline', {name: video.file.name})}
      </h1>

      <div className="max-w-lg">
        <div className="my-4">
          <label htmlFor="video_format">{t('conversion.video_quality.label')}</label>
          <Controller control={control} name="video" rules={formatRules} render={({field: {ref, ...field}}) => (
            <VideoFormatSelect formats={videoFormats} id="video_format" isDisabled={working} {...field} />
          )}/>
        </div>

        <div className="my-4">
          <label htmlFor="audio_format">{t('conversion.audio_quality.label')}</label>
          <Controller control={control} name="audio" rules={formatRules} render={({field: {ref, ...field}}) => (
            <AudioFormatSelect formats={audioFormats} id="audio_format" isDisabled={working} {...field} />
          )}/>
        </div>
      </div>

      <div className="my-4">
        <Controller control={control} name="container" render={({field: {ref, ...field}}) => <>
          <Timeline frame={video.metadata.container} limit={MAX_DURATION} {...field}/>
        </>}/>
      </div>

      <div className="flex gap-2">
        <Button className="px-4 py-2 rounded bg-red-800 hover:bg-red-700 text-white"
                disabled={working} type="submit">
          {t('conversion.button.start')}
        </Button>

        <Button className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-white"
                disabled={working} onClick={changeVideo}>
          {t('conversion.button.change')}
        </Button>
      </div>

      {working && (
        <div role="progressbar" className="block my-3 h-8 bg-red-200 relative"
             aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <div className="bg-red-500 h-8" style={{width: `${progress}%`}}/>
          <div className="absolute inset-0 text-white text-center leading-8">
            {t('conversion.progress', {progress})}
          </div>
        </div>
      )}
    </form>
  </>;
}
