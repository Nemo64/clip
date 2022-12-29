import Select, { ClassNamesConfig, Props } from "react-select";
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

const selectStyles = {
  unstyled: true,
  classNames: {
    control: ({ isFocused }) =>
      classNames(
        "px-4 py-2 rounded-xl border bg-white text-neutral-800 dark:bg-neutral-800 dark:text-white",
        { ring: isFocused }
      ),
    menu: () =>
      "my-2 py-2 rounded-xl overflow-hidden border shadow-xl fly-in bg-white text-neutral-800 dark:bg-neutral-800 dark:text-white",
    group: () => "pt-4 first:pt-0",
    option: ({ className, isSelected }) =>
      classNames(
        className,
        "px-4 py-2 hover:bg-red-100 dark:hover:bg-red-900",
        { "bg-red-100 dark:bg-red-900": isSelected }
      ),
  } as ClassNamesConfig<any>,
} as const;

export function VideoFormatSelect({ formats, ...props }: VideoProps) {
  const isSizeTarget = (formatOption: VideoFormat) =>
    formatOption.preset?.startsWith("size");
  const isCrfOption = (formatOption: VideoFormat) =>
    formatOption.preset?.startsWith("crf");

  return (
    <Select
      {...props}
      {...selectStyles}
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
          label: t("conversion.video_quality.other_label"),
          options: formats.filter(
            (formatOption) =>
              !isSizeTarget(formatOption) && !isCrfOption(formatOption)
          ),
        },
      ]}
      formatGroupLabel={(group) => <div className="sr-only">{group.label}</div>}
      formatOptionLabel={(option, { context }) => (
        <div className="leading-4 pt-1">
          {option.preset === "crf_720p" &&
            t("conversion.video_quality.crf_720p")}
          {option.preset === "crf_480p" &&
            t("conversion.video_quality.crf_480p")}

          {option.preset === "size_50mb" &&
            t("conversion.video_quality.size_50mb")}
          {option.preset === "size_16mb" &&
            t("conversion.video_quality.size_16mb")}
          {option.preset === "size_8mb" &&
            t("conversion.video_quality.size_8mb")}

          {option.preset === "gif_600p" &&
            t("conversion.video_quality.gif_600p")}

          {(() => {
            if (option.implausible) {
              return (
                <div className="text-red-500 text-sm font-light">
                  {t("conversion.video_quality.implausible", option)}
                </div>
              );
            }
            if (option.original) {
              return (
                <div className="text-lime-600 text-sm font-light">
                  {t("conversion.video_quality.original_details", option)}
                </div>
              );
            }
            if (option.preset?.startsWith("crf")) {
              return (
                <div className="text-slate-400 text-sm font-light">
                  {t("conversion.video_quality.crf_details", option)}
                </div>
              );
            }
            if (option.preset?.startsWith("size")) {
              return (
                <div className="text-slate-400 text-sm font-light">
                  {t("conversion.video_quality.size_details", option)}
                </div>
              );
            }
            if (option.preset?.startsWith("gif")) {
              return (
                <div className="text-slate-400 text-sm font-light">
                  {t("conversion.video_quality.gif_details", option)}
                </div>
              );
            }
          })()}
        </div>
      )}
    />
  );
}

export function AudioFormatSelect({ formats, ...props }: AudioProps) {
  return (
    <Select
      {...props}
      {...selectStyles}
      getOptionValue={(option) => String(option?.preset)}
      options={formats}
      formatOptionLabel={(option, { context }) => (
        <div className="leading-4 pt-1">
          {option.preset === "none" && t("conversion.audio_quality.none")}
          {option.preset === "bitrate_low" &&
            t("conversion.audio_quality.bitrate_low")}
          {option.preset === "bitrate_high" &&
            t("conversion.audio_quality.bitrate_high")}

          {(() => {
            if (option.implausible) {
              return (
                <div className="text-red-500 text-sm font-light">
                  {t("conversion.audio_quality.implausible", option)}
                </div>
              );
            }
            if (option.original) {
              return (
                <div className="text-lime-600 text-sm font-light">
                  {t("conversion.audio_quality.original_details", option)}
                </div>
              );
            }
            if (option.preset?.startsWith("none")) {
              return (
                <div className="text-slate-400 text-sm font-light">
                  {t("conversion.audio_quality.none_details", option)}
                </div>
              );
            }
            if (option.preset?.startsWith("bitrate")) {
              return (
                <div className="text-slate-400 text-sm font-light">
                  {t("conversion.audio_quality.bitrate_details", option)}
                </div>
              );
            }
          })()}
        </div>
      )}
    />
  );
}
