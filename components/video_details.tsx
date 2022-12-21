import { estimateSize, Format } from "../src/video";
import { t } from "../src/intl";

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
            className="text-right font-normal pt-3 px-2"
            title={JSON.stringify(source, undefined, 2)}
          >
            {t("details.headline.source")}
          </th>
          <th
            className="text-right font-normal pt-3 px-2"
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
            source={t("details.bitrate_value", { value: source.video.bitrate })}
            target={
              target.video.crf
                ? t("details.bitrate_value_crf", {
                    value: Math.ceil(
                      estimateSize(target.video, 8, target.video.crf - 5)
                    ),
                  })
                : t("details.bitrate_value", { value: target.video.bitrate })
            }
          />
        </tbody>
      )}
      {source.audio?.codec && target.audio && (
        <tbody>
          <Comparison
            label={t("details.audio_codec_label")}
            source={source.audio.codec}
            target={target.audio.codec}
          />
          <Comparison
            label={t("details.audio_bitrate_label")}
            source={t("details.audio_bitrate_value", {
              value: source.audio.bitrate,
            })}
            target={t("details.audio_bitrate_value", {
              value: target.audio.bitrate,
            })}
          />
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
  return (
    <tr className={source !== target ? "font-bold" : undefined}>
      <th className="text-right font-normal">{label}</th>
      <td className="text-right px-2">{source}</td>
      <td className="text-right px-2">{target}</td>
    </tr>
  );
}
