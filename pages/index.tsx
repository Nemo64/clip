import classNames from "classnames";
import Head from "next/head";
import Router, { useRouter } from "next/router";
import React, {
  useContext,
  useEffect,
  useState,
  MouseEvent,
  useRef,
  useCallback,
} from "react";
import { SoftwareApplication } from "schema-dts";
import {
  AddFileIcon,
  ChevronDownIcon,
  ComputerIcon,
} from "../components/icons";
import { Markdown } from "../components/markdown";
import { ensureFreshFfmpegInstance } from "../src/ffmpeg";
import { t } from "../src/intl";
import { VideoContext } from "./_app";
import { JsonLd } from "react-schemaorg";
import { Button } from "../components/button";
import { DemoTimeline } from "../components/demo";
import { DEFAULT_FPS } from "../src/video_analyse";
import { useHotkeys } from "react-hotkeys-hook";

export default function Start() {
  const [error, setError] = useState<string | undefined>();
  const { pathname } = useRouter();

  useEffect(() => {
    ensureFreshFfmpegInstance((e) => setError(String(e)));
    Router.prefetch("/video").catch(console.error);
  }, []);

  return (
    <>
      <Head>
        <title>{t("upload.title")}</title>
        <meta name="description" content={t("upload.description")} />
        <meta name="og:title" content={t("upload.title")} />
        <meta name="og:description" content={t("upload.description")} />
        <meta
          name="og:image"
          content={`${process.env.NEXT_PUBLIC_HOST}/og.png`}
        />
        <meta
          name="og:url"
          content={`${process.env.NEXT_PUBLIC_HOST}${pathname}`}
        />
        <JsonLd<SoftwareApplication>
          item={{
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Clip",
            url: `${process.env.NEXT_PUBLIC_HOST}/`,
            image: `${process.env.NEXT_PUBLIC_HOST}/og.png`,
            description: t("upload.description"),
            applicationCategory: "MultimediaApplication",
            operatingSystem: "Any",
            offers: {
              "@type": "Offer",
              price: "0",
            },
          }}
        />
      </Head>

      <div className="bg-red-600 text-white break-inside-avoid">
        <div className="container mx-auto md:py-16 widescreen:min-h-screen flex flex-row-reverse flex-wrap items-center justify-center relative">
          <div className="md:w-7/12 p-2">
            <h1 className="text-5xl font-semibold whitespace-pre-wrap text-center my-8 motion-safe:animate-fly-1">
              {t("upload.title")}
            </h1>
            <div className="text-center motion-safe:animate-fly-2">
              <Markdown>{t("upload.description")}</Markdown>
              {!error && (
                <div className="grid grid-cols-[max-content] justify-center gap-2 max-w-sm mx-auto">
                  <SelectFileButton />
                  <CaptureScreenButton />
                  {/*<DemoVideoButton />*/}
                </div>
              )}
              <p
                className={classNames("my-4 h-min-3l whitespace-pre-wrap", {
                  "text-red-200": error !== undefined,
                })}
              >
                {error ?? t("upload.disclaimer")}
              </p>
            </div>
          </div>
          <div
            className="md:w-5/12 p-8 drop-shadow-xl motion-safe:animate-fly-3"
            role="img"
          >
            <DemoTimeline className="-skew-y-6" />
          </div>
          <Button
            className="absolute left-1/2 bottom-0 p-16 -mx-16 hidden widescreen:block"
            aria-label="scroll down"
            onClick={(event: MouseEvent) => {
              window.scrollTo({
                top: event.currentTarget.getBoundingClientRect().bottom,
                behavior: "smooth",
              });
            }}
          >
            <ChevronDownIcon />
          </Button>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="w-full relative -bottom-px"
        >
          <path
            d="M1200,0H0V120H281.94C572.9,116.24,602.45,3.86,602.45,3.86h0S632,116.24,923,120h277Z"
            className="fill-white dark:fill-neutral-800 rotate-180 origin-center"
          />
        </svg>
      </div>

      <div className="max-w-lg mx-auto p-2 break-inside-avoid">
        <Markdown>{t("upload.text.use_cases")}</Markdown>
      </div>
    </>
  );
}

function SelectFileButton() {
  const [, setVideo] = useContext(VideoContext);
  return (
    <>
      <input
        type="file"
        id="file"
        accept="video/*"
        className="sr-only peer"
        onChange={({ currentTarget }) => {
          setVideo(currentTarget.files?.[0], "selected");
        }}
      />
      <label
        htmlFor="file"
        className="inline-block relative px-5 py-3 rounded-3xl bg-red-900 hover:bg-red-800 shadow-lg shadow-red-900/30 text-white text-xl cursor-pointer peer-focus:ring"
      >
        <div className="absolute inset-0 rounded-3xl bg-red-900/20 animate-ping pointer-events-none print:hidden motion-reduce:hidden" />
        <div className="relative">
          <AddFileIcon className="align-text-bottom mr-2 -ml-1" />
          {t("upload.button")}
          <span className="block text-sm text-red-200">
            {t("upload.drop_hint")}
          </span>
        </div>
      </label>
    </>
  );
}

function CaptureScreenButton() {
  const [, setVideo] = useContext(VideoContext);
  const [supportedFormat, setSupportedFormat] = useState<string>();
  const [recorder, setRecorder] = useState<MediaRecorder>();
  const abort = useRef(true); // the recording is discarded unless false
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (video.current) {
      video.current.srcObject = recorder?.stream ?? null;
      video.current.play();
    }
    if (recorder) {
      return () => {
        recorder.stop();
        recorder.stream.getTracks().forEach((track) => track.stop());
      };
    }
  }, [recorder]);

  useHotkeys("esc", () => {
    setRecorder(undefined);
  });

  useEffect(() => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      return;
    }

    // - I always prefer h264 because of hardware support and the chance that I don't even need to re-encode the video
    // - vp8 is supported everywhere, but usually not hardware accelerated
    // - vp9 might be slow and since the video is re-encoded, I'd avoid it
    const formats = [
      'video/webm;codecs="avc1.640029"', // profile: high; level 5.1
      'video/webm;codecs="avc1"', // any avc1 that the platform supports
      'video/mp4;codecs="avc1.640029"', // the same but in mp4 for safari ~ I had fewer problems with webm but mp4 seems to work well on safari
      'video/mp4;codecs="avc1"', // the same but in mp4 for safari
    ];
    for (const format of formats) {
      if (MediaRecorder.isTypeSupported(format)) {
        setSupportedFormat(format);
        break;
      }
    }
  }, []);

  if (!supportedFormat) {
    return <></>;
  }

  const startRecording = async () => {
    const stream = await navigator.mediaDevices?.getDisplayMedia({
      audio: {
        channelCount: 2,
        sampleRate: 48000,
      },
      video: {
        frameRate: DEFAULT_FPS,
        // @ts-ignore somehow unknown property but documented here: https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/displaySurface
        displaySurface: { ideal: "window" },
      },
    });

    const recorder = new MediaRecorder(stream, {
      mimeType: supportedFormat,
    });

    let startTime = Date.now();
    recorder.addEventListener("start", (event) => {
      startTime = event.timeStamp;
    });

    recorder.addEventListener("dataavailable", (event) => {
      setRecorder(undefined);
      if (abort.current) {
        return;
      }

      const blob = new File([event.data], "recording", {
        type: recorder.mimeType,
      });
      setVideo(blob, "captured", {
        container: {
          duration: (event.timeStamp - startTime) / 1000,
          start: 0.0,
        },
      });
    });

    recorder.addEventListener("error", (event) => {
      console.error(event);
      setRecorder(undefined);
    });

    abort.current = true;
    recorder.start();
    setRecorder(recorder);
  };

  return (
    <>
      <Button
        className="inline-block relative px-5 py-3 rounded-3xl bg-red-900 hover:bg-red-800 shadow-lg shadow-red-900/30 text-white text-xl cursor-pointer"
        onClick={startRecording}
      >
        <div className="relative">
          <ComputerIcon className="align-text-bottom mr-2 -ml-1" />
          {t("upload.button_capture")}
          <span className="block text-sm text-red-200">
            {t("upload.button_capture_hint")}
          </span>
        </div>
      </Button>
      {recorder && (
        <div className="fixed z-50 inset-0 bg-slate-500/50 flex items-center justify-around">
          <div className="bg-white text-neutral-800 rounded-3xl p-4 shadow-xl">
            <div className="block text-2xl animate-pulse">
              {t("screen_recording.in_progress")}
              <video
                className="object-contain w-full max-w-[80vw] max-h-[80vh] rounded-2xl"
                ref={video}
                muted={true}
                autoPlay={true}
              />
            </div>
            <div className="flex flex-row gap-3 mt-3 justify-end">
              <Button
                className="px-4 py-2 rounded-2xl bg-red-800 hover:bg-red-700 text-white"
                onClick={() => {
                  abort.current = false;
                  setRecorder(undefined);
                }}
              >
                {t("screen_recording.use_recording")}
              </Button>
              <Button
                className="px-4 py-2 rounded-2xl bg-slate-500 hover:bg-slate-400 text-white"
                onClick={() => {
                  abort.current = true;
                  setRecorder(undefined);
                }}
              >
                {t("screen_recording.cancel_recording")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DemoVideoButton() {
  const [, setVideo] = useContext(VideoContext);
  return (
    <Button
      className="inline-block relative px-5 py-3 rounded-3xl bg-red-900 hover:bg-red-800 shadow-lg shadow-red-900/30 text-white text-xl cursor-pointer"
      onClick={async () => {
        const response = await fetch("/demo/Sintel.high.mp4");
        const blob = await response.blob();
        const file = new File([blob], "Sintel.mp4", { type: blob.type });
        setVideo(file, "selected");
      }}
    >
      <div className="relative">
        <ComputerIcon className="align-text-bottom mr-2 -ml-1" />
        {t("upload.button_capture")}
      </div>
    </Button>
  );
}
