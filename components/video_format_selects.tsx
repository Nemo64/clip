import Select, { Props } from "react-select";
import { t } from "../src/intl";
import { AudioFormat, VideoFormat } from "../src/video";
import classNames from "classnames";

export type VideoProps = { formats: VideoFormat[] } & Omit<
  Props<VideoFormat>,
  "options" | "getOptionValue" | "formatOptionLabel"
>;
export type AudioProps = { formats: AudioFormat[] } & Omit<
  Props<AudioFormat>,
  "options" | "getOptionValue" | "formatOptionLabel"
>;

export function VideoFormatSelect({ formats, ...props }: VideoProps) {
  const isSizeTarget = (formatOption: VideoFormat) =>
    formatOption.preset?.startsWith("size");
  const isCrfOption = (formatOption: VideoFormat) =>
    formatOption.preset?.startsWith("crf");

  return (
    <Select
      {...props}
      maxMenuHeight={480}
      getOptionValue={(option) => String(option.preset)}
      options={[
        {
          label: t("conversion.video_quality.size_label"),
          options: formats.filter(isSizeTarget),
        },
        {
          label: t("conversion.video_quality.crf_label"),
          options: formats.filter(isCrfOption),
        },
        {
          label: t("conversion.video_quality.other"),
          options: formats.filter(
            (formatOption) =>
              !isSizeTarget(formatOption) && !isCrfOption(formatOption)
          ),
        },
      ]}
      formatGroupLabel={(group) => <div className="sr-only">{group.label}</div>}
      formatOptionLabel={(option, { context }) => (
        <div className="leading-4 pt-1">
          {option.preset === "crf_1080p" &&
            t("conversion.video_quality.crf_1080p")}
          {option.preset === "crf_720p" &&
            t("conversion.video_quality.crf_720p")}
          {option.preset === "crf_480p" &&
            t("conversion.video_quality.crf_480p")}
          {option.preset === "crf_360p" &&
            t("conversion.video_quality.crf_360p")}

          {option.preset === "size_50mb" &&
            t("conversion.video_quality.size_50mb")}
          {option.preset === "size_16mb" &&
            t("conversion.video_quality.size_16mb")}
          {option.preset === "size_8mb" &&
            t("conversion.video_quality.size_8mb")}

          {option.preset === "gif_600p" &&
            t("conversion.video_quality.gif_600p")}

          {option.preset?.startsWith("crf") &&
            (!option.implausible ? (
              <div className="opacity-60 text-sm font-light">
                {t("conversion.video_quality.crf_details", option)}
              </div>
            ) : (
              <div className="text-red-500 text-sm font-light">
                {t("conversion.video_quality.crf_implausible", option)}
              </div>
            ))}
          {option.preset?.startsWith("size") &&
            (!option.implausible ? (
              <div className="opacity-60 text-sm font-light">
                {t("conversion.video_quality.size_details", option)}
              </div>
            ) : (
              <div className="text-red-500 text-sm font-light">
                {t("conversion.video_quality.size_implausible", option)}
              </div>
            ))}
          {option.preset?.startsWith("gif") &&
            (!option.implausible ? (
              <div className="opacity-60 text-sm font-light">
                {t("conversion.video_quality.gif_details", option)}
              </div>
            ) : (
              <div className="text-red-500 text-sm font-light">
                {t("conversion.video_quality.gif_implausible", option)}
              </div>
            ))}
        </div>
      )}
    />
  );
}

export function AudioFormatSelect({ formats, ...props }: AudioProps) {
  return (
    <Select
      {...props}
      getOptionValue={(option) => String(option?.preset)}
      options={formats}
      formatOptionLabel={(option, { context }) => (
        <div className="leading-4 pt-1">
          {option.preset === "none" && t("conversion.audio_quality.none")}
          {option.preset === "bitrate_low" &&
            t("conversion.audio_quality.bitrate_low")}
          {option.preset === "bitrate_high" &&
            t("conversion.audio_quality.bitrate_high")}

          <span className={context === "value" ? "text-green-700" : ""}>
            {option.original && t("conversion.audio_quality.original")}
          </span>

          {option.preset?.startsWith("none") &&
            (!option.implausible ? (
              <div className="opacity-60 text-sm font-light">
                {t("conversion.audio_quality.none_details")}
              </div>
            ) : (
              <div className="text-red-500 text-sm font-light">
                {t("conversion.audio_quality.none_implausible")}
              </div>
            ))}
          {option.preset?.startsWith("bitrate") &&
            (!option.implausible ? (
              <div className="opacity-60 text-sm font-light">
                {t("conversion.audio_quality.bitrate_details", option)}
              </div>
            ) : (
              <div className="text-red-500 text-sm font-light">
                {t("conversion.audio_quality.bitrate_implausible")}
              </div>
            ))}
        </div>
      )}
    />
  );
}
