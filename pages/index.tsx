import classNames from "classnames";
import Head from "next/head";
import Router, { useRouter } from "next/router";
import { useContext, useEffect, useState } from "react";
import { SoftwareApplication } from "schema-dts";
import { AddFileIcon } from "../components/icons";
import { Markdown } from "../components/markdown";
import { Crop, Timeline } from "../components/timeline";
import { ensureFreshFfmpegInstance } from "../src/ffmpeg";
import { t } from "../src/intl";
import { VideoContext } from "./_app";
import { JsonLd } from "react-schemaorg";

const DEMO_TIMELINE: Crop = { start: 0, duration: 888 };
const DEMO_IMAGES = [...Array(28)].map(
  (_, i) => `/demo/${(i + 1).toString().padStart(2, "0")}.jpeg`
);

export default function Start() {
  const [video, setVideo] = useContext(VideoContext);
  const [demoCrop, setDemoCrop] = useState<Crop>({
    start: DEMO_TIMELINE.start,
    duration: DEMO_TIMELINE.duration * 0.75,
  });
  const [error, setError] = useState<string | undefined>();
  const { pathname } = useRouter();

  useEffect(() => {
    ensureFreshFfmpegInstance().catch((e) => setError(String(e)));
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
            url: process.env.NEXT_PUBLIC_HOST,
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
      <div className="bg-red-600 text-white">
        <div className="container mx-auto md:py-16 flex flex-row-reverse flex-wrap items-center justify-center">
          <div className="md:w-7/12 p-2">
            <h1 className="text-5xl font-semibold whitespace-pre-wrap text-center my-8 motion-safe:animate-fly-1">
              {t("upload.title")}
            </h1>
            <div className="text-center motion-safe:animate-fly-2">
              <Markdown>{t("upload.description")}</Markdown>
              <input
                type="file"
                id="file"
                accept="video/*"
                disabled={!!error}
                className="sr-only peer"
                onChange={(e) =>
                  setVideo(e.currentTarget.files?.[0], "selected")
                }
              />
              <label
                htmlFor="file"
                className={classNames(
                  "inline-block relative px-5 py-3 text-2xl rounded-3xl bg-red-900 hover:bg-red-800 shadow-lg shadow-red-900/30 text-white text-xl cursor-pointer peer-focus:ring",
                  { "opacity-50 cursor-not-allowed": !!error }
                )}
              >
                {!error && (
                  <div className="absolute inset-0 rounded-3xl bg-red-900/20 animate-ping pointer-events-none" />
                )}
                <div className="relative">
                  <AddFileIcon className="align-text-bottom mr-2 -ml-1" />
                  {t("upload.button")}
                  <span className="block text-sm text-red-200">
                    {t("upload.drop_hint")}
                  </span>
                </div>
              </label>
              <p
                className={classNames({
                  "my-4 h-min-3l whitespace-pre-wrap": true,
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
            <div className="-skew-y-6">
              <Timeline
                frame={DEMO_TIMELINE}
                width={640}
                height={272}
                value={demoCrop}
                onChange={setDemoCrop}
                pics={DEMO_IMAGES}
                picInt={DEMO_TIMELINE.duration / DEMO_IMAGES.length}
              />
            </div>
          </div>
        </div>

        <svg
          data-name="Layer 1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="w-full"
        >
          <path
            d="M1200,0H0V120H281.94C572.9,116.24,602.45,3.86,602.45,3.86h0S632,116.24,923,120h277Z"
            className="fill-white rotate-180 origin-center"
          />
        </svg>
      </div>
      <div className="max-w-lg mx-auto p-2">
        <Markdown>{t("upload.text.use_cases")}</Markdown>
      </div>
    </>
  );
}
