import {
  createCommands,
  createConcatFile,
  estimateH264Size,
  Format,
  KnownVideo,
} from "../src/video";
import { t } from "../src/intl";
import classNames from "classnames";
import { Markdown } from "./markdown";
import { FormattedCommand } from "./cli";
import {
  ConvertInstructions,
  toTargetFormat,
} from "../src/video_convert_format";

export function VideoDetails({
  video,
  instructions,
  ...props
}: {
  video: KnownVideo;
  instructions: ConvertInstructions;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <details {...props}>
      <summary>{t("conversion.details.headline")}</summary>
      <div className="overflow-auto flex-grow">
        <Markdown>{t("conversion.details.params_intro")}</Markdown>
        <VideoConversionDetails
          source={video.metadata}
          target={toTargetFormat(instructions)}
        />
        <Markdown>{t("conversion.details.command_intro")}</Markdown>
        <div className="overflow-auto">
          {instructions.containers.length !== 1 && (
            <pre className="text-sm">
              {`cat > concat.txt << EOF`}
              <div className="ml-3">
                {createConcatFile(video, instructions)}
              </div>
              {`EOF`}
            </pre>
          )}
          {(() => {
            try {
              return createCommands(video, instructions).map(({ args }, i) => (
                <FormattedCommand key={i}>
                  {["ffmpeg", ...args]}
                </FormattedCommand>
              ));
            } catch {
              return [];
            }
          })()}
        </div>
        <Markdown>{t("conversion.details.command_outro")}</Markdown>
      </div>
    </details>
  );
}

export function VideoConversionDetails({
  source,
  target,
}: {
  source: Partial<Format>;
  target: Partial<Format>;
}) {
  return (
    <table className="w-full table-fixed">
      <thead>
        <tr>
          <th />
          <th
            className="text-center text-xl font-normal pt-3 px-2"
            title={JSON.stringify(source, undefined, 2)}
          >
            {t("details.headline.source")}
          </th>
          <th
            className="text-center text-xl font-normal pt-3 px-2"
            title={JSON.stringify(target, undefined, 2)}
          >
            {t("details.headline.target")}
          </th>
        </tr>
      </thead>
      {source.container && target.container && (
        <tbody>
          <Comparison
            label={t("details.duration_label")}
            source={t("details.duration_value", {
              value: source.container.duration,
            })}
            target={t("details.duration_value", {
              value: target.container.duration,
            })}
          />
        </tbody>
      )}
      {source.video && target.video && (
        <tbody>
          <tr>
            <th className="text-center pt-4 text-xl font-normal">Video</th>
          </tr>
          <Comparison
            label={t("details.video_codec_label")}
            source={source.video.codec}
            target={target.video.codec}
          />
          <Comparison
            label={t("details.video_resolution_label")}
            source={t("details.video_resolution_value", {
              width: source.video.width,
              height: source.video.height,
            })}
            target={t("details.video_resolution_value", {
              width: target.video.width,
              height: target.video.height,
            })}
          />
          <Comparison
            label={t("details.framerate_label")}
            source={t("details.framerate_value", { value: source.video.fps })}
            target={t("details.framerate_value", { value: target.video.fps })}
          />
          <Comparison
            label={t("details.video_color_format_label")}
            source={source.video.color}
            target={target.video.color}
          />
          <Comparison
            label={t("details.bitrate_label")}
            source={
              Number.isFinite(source.video.bitrate)
                ? t("details.bitrate_value", { value: source.video.bitrate })
                : t("details.bitrate_value_unknown")
            }
            target={
              target.video.crf
                ? t("details.bitrate_value_crf", {
                    value: estimateH264Size(target.video, target.video.crf),
                  })
                : t("details.bitrate_value", { value: target.video.bitrate })
            }
          />
        </tbody>
      )}
      {source.audio?.codec && target.audio && (
        <tbody>
          <tr>
            <th className="text-center pt-4 text-xl font-normal">Audio</th>
          </tr>
          <Comparison
            label={t("details.audio_codec_label")}
            source={source.audio.codec}
            target={target.audio.codec}
          />
          {source.audio.codec !== "none" && (
            <Comparison
              label={t("details.audio_sample_rate_label")}
              source={t("details.audio_sample_rate_value", {
                value: source.audio.sampleRate,
              })}
              target={t("details.audio_sample_rate_value", {
                value: target.audio.sampleRate,
              })}
            />
          )}
          {source.audio.codec !== "none" && (
            <Comparison
              label={t("details.audio_channel_label")}
              source={source.audio.channelSetup}
              target={target.audio.channelSetup}
            />
          )}
          {source.audio.codec !== "none" && (
            <Comparison
              label={t("details.audio_bitrate_label")}
              source={t("details.audio_bitrate_value", {
                value: source.audio.bitrate,
              })}
              target={t("details.audio_bitrate_value", {
                value: target.audio.bitrate,
              })}
            />
          )}
        </tbody>
      )}
    </table>
  );
}

function Comparison({
  label,
  source,
  target,
}: {
  label: string;
  source: string;
  target: string;
}) {
  const columnClassName = "text-center px-2";
  const valueClassName = classNames(columnClassName, {
    "text-red-700 dark:text-red-300": source !== target,
  });
  return (
    <tr>
      <th className="text-center font-normal">{label}</th>
      <td className={columnClassName}>{source}</td>
      <td className={valueClassName}>{target}</td>
    </tr>
  );
}
