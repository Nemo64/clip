import Select, { Props } from "react-select";
import { t } from "../src/intl";
import { AudioFormat, VideoFormat } from "../src/video";

export type VideoProps = { formats: VideoFormat[] } & Omit<
  Props<VideoFormat>,
  "options" | "getOptionValue" | "formatOptionLabel"
>;
export type AudioProps = { formats: AudioFormat[] } & Omit<
  Props<AudioFormat>,
  "options" | "getOptionValue" | "formatOptionLabel"
>;

export function VideoFormatSelect({ formats, ...props }: VideoProps) {
  return (
    <Select
      {...props}
      maxMenuHeight={480}
      getOptionValue={(option) => String(option.preset)}
      options={[
        {
          label: t("conversion.video_quality.size_label"),
          options: formats.filter((formatOption) =>
            formatOption.preset?.startsWith("size")
          ),
        },
        {
          label: t("conversion.video_quality.crf_label"),
          options: formats.filter((formatOption) =>
            formatOption.preset?.startsWith("crf")
          ),
        },
      ]}
      formatOptionLabel={(option) => (
        <>
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

          {option.original && t("conversion.video_quality.original")}

          {option.preset?.startsWith("crf") &&
            (!option.implausible ? (
              <div className="opacity-60 text-sm">
                {t("conversion.video_quality.crf_details", option)}
              </div>
            ) : (
              <div className="text-red-500 text-sm">
                {t("conversion.video_quality.crf_implausible", option)}
              </div>
            ))}
          {option.preset?.startsWith("size") &&
            (!option.implausible ? (
              <div className="opacity-60 text-sm">
                {t("conversion.video_quality.size_details", option)}
              </div>
            ) : (
              <div className="text-red-500 text-sm">
                {t("conversion.video_quality.size_implausible", option)}
              </div>
            ))}
        </>
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
      formatOptionLabel={(option) => (
        <>
          {option.preset === "none" && t("conversion.audio_quality.none")}
          {option.preset === "bitrate_low" &&
            t("conversion.audio_quality.bitrate_low")}
          {option.preset === "bitrate_high" &&
            t("conversion.audio_quality.bitrate_high")}

          {option.original && t("conversion.audio_quality.original")}

          {option.preset?.startsWith("none") &&
            (!option.implausible ? (
              <div className="opacity-60 text-sm">
                {t("conversion.audio_quality.none_details")}
              </div>
            ) : (
              <div className="text-red-500 text-sm">
                {t("conversion.audio_quality.none_implausible")}
              </div>
            ))}
          {option.preset?.startsWith("bitrate") &&
            (!option.implausible ? (
              <div className="opacity-60 text-sm">
                {t("conversion.audio_quality.bitrate_details", option)}
              </div>
            ) : (
              <div className="text-red-500 text-sm">
                {t("conversion.audio_quality.bitrate_implausible")}
              </div>
            ))}
        </>
      )}
    />
  );
}
