import classNames from "classnames";
import React, {
  Fragment,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { t } from "../src/intl";
import { DurationInput } from "./input";
import { Button } from "./button";
import { PauseIcon, PlayIcon } from "./icons";
import { useHotkeys } from "react-hotkeys-hook";

export interface Crop {
  start: number;
  duration: number;
}

export interface TimelineProps {
  frame: Crop;
  width: number;
  height: number;
  className?: string;
  videoClassName?: string;
  value: Crop[];
  videoSrc?: string;
  fps: number;
  onChange?: (crop: Crop[]) => void;
  onBlur?: (crop: Crop[]) => void;
  disabled?: boolean;
  muted?: boolean;
  pics?: string[];
  picInt?: number;
}

export function VideoTimeline({
  frame,
  width,
  height,
  className,
  videoClassName = "object-contain bg-slate-200 dark:bg-neutral-900",
  value: values,
  videoSrc,
  fps,
  onChange = () => void 0,
  onBlur = () => void 0,
  disabled,
  muted,
  pics = [],
  picInt = frame.duration / pics.length,
}: TimelineProps) {
  const [cursor, setCursor] = useState(0);
  const [paused, setPaused] = useState(false);

  const timeStampRef = useRef() as RefObject<HTMLElement>;
  const timeStampWidth = timeStampRef.current?.clientWidth ?? 0;
  const timeStampArea = timeStampRef.current?.parentElement?.clientWidth ?? 1;
  const timeStampMoveFactor = timeStampArea / (timeStampArea - timeStampWidth);

  const playing =
    !paused &&
    values.some(
      (value) =>
        cursor >= value.start - 1 / fps &&
        cursor <= value.start + value.duration - 1 / fps
    );

  const togglePlay = useCallback(
    (evt?: { preventDefault: () => void }) => {
      evt?.preventDefault();
      if (playing) {
        setPaused(true);
      } else {
        setPaused(false);

        // ensure playing is even possible
        const isInsideRanges = values.some(({ start, duration }) => {
          return cursor >= start && cursor <= start + duration - 1;
        });
        if (!isInsideRanges) {
          setCursor(values[0].start);
        }
      }
    },
    [cursor, playing, values]
  );

  useHotkeys("space", togglePlay, [togglePlay]);

  return (
    <div className={classNames("flex flex-col font-mono", className)}>
      <div
        className="w-full rounded-2xl overflow-hidden relative"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        {pics?.length && picInt ? (
          <VideoWithFallback
            videoSrc={videoSrc}
            pics={pics}
            picInt={picInt}
            fps={fps}
            play={playing}
            muted={muted}
            cursor={cursor}
            setCursor={(cursor) => {
              for (const { start, duration } of values) {
                if (cursor >= start && cursor < start + duration) {
                  setCursor(cursor);
                  return;
                }

                if (cursor < start) {
                  setCursor(start);
                  return;
                }
              }

              // fallback
              setCursor(cursor);
            }}
            onClick={togglePlay}
            className={classNames("absolute w-full h-full", videoClassName)}
          />
        ) : (
          <div className="p-4 text-center">{t("timeline.no_preview")}</div>
        )}
        {cursor !== undefined && (
          <DurationInput
            ref={timeStampRef as any}
            value={cursor}
            onChange={setCursor}
            min={frame.start}
            max={frame.duration}
            divisor={Math.floor(fps)}
            className="absolute px-2 bottom-0 rounded-t-2xl bg-black/50 text-white"
            style={{
              left: `${(cursor / frame.duration / timeStampMoveFactor) * 100}%`,
            }}
          />
        )}
      </div>
      <div className="flex flex-row my-2 gap-2">
        <Button
          className="w-16 h-16 bg-red-800 hover:bg-red-700 text-white rounded-l-2xl"
          onClick={togglePlay}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </Button>
        <Timeline
          value={values}
          frame={frame}
          pics={pics}
          picInt={picInt}
          cursor={cursor}
          setCursor={setCursor}
          paused={paused}
          onChange={onChange}
          onBlur={onBlur}
        />
      </div>
      {values.map((value, index) => (
        <SegmentInputs
          key={index}
          frame={frame}
          value={value}
          fps={fps}
          setCursor={setCursor}
          onChange={(newValue) => {
            onChange([
              ...values.slice(0, index),
              newValue,
              ...values.slice(index + 1),
            ]);
          }}
        />
      ))}
    </div>
  );
}

function SegmentInputs({
  frame,
  value,
  fps,
  setCursor,
  onChange,
}: {
  frame: Crop;
  value: Crop;
  fps: number;
  setCursor: (cursor: number) => void;
  onChange: (value: Crop) => void;
}) {
  return (
    <div className="flex flex-row justify-between">
      <div>
        <label htmlFor="start">{t("timeline.start_time")} </label>
        <DurationInput
          id="start"
          className="inline-block align-bottom"
          value={value.start}
          min={frame.start}
          max={frame.start + frame.duration - value.duration}
          divisor={Math.floor(fps)}
          onFocus={() => {
            setCursor(value.start);
          }}
          onChange={(newValue) => {
            setCursor(newValue);
            onChange?.({
              start: newValue,
              duration: value.duration,
            });
          }}
        />
      </div>
      <div>
        <label htmlFor="duration">{t("timeline.duration")} </label>
        <DurationInput
          id="duration"
          className="inline-block align-bottom"
          value={value.duration}
          min={0}
          max={frame.duration - frame.start}
          divisor={Math.floor(fps)}
          onFocus={() => {
            setCursor(value.start + value.duration);
          }}
          onChange={(newValue) => {
            setCursor(value.start + newValue);
            onChange?.({
              start: value.start,
              duration: newValue,
            });
          }}
        />
      </div>
      <div>
        <label htmlFor="end">{t("timeline.end_time")} </label>
        <DurationInput
          id="end"
          className="inline-block align-bottom"
          value={value.start + value.duration}
          min={frame.start}
          max={frame.start + frame.duration}
          divisor={Math.floor(fps)}
          onFocus={() => {
            setCursor(value.start + value.duration);
          }}
          onChange={(newValue) => {
            setCursor(newValue);
            onChange?.({
              start: value.start,
              duration: newValue - value.start,
            });
          }}
        />
      </div>
    </div>
  );
}

function Timeline({
  frame,
  pics,
  picInt,
  cursor,
  setCursor,
  value: values,
  paused,
  onChange,
  onBlur,
}: {
  cursor: number;
  setCursor: (cursor: number) => void;
  paused: boolean;
} & Required<
  Pick<
    TimelineProps,
    "frame" | "pics" | "picInt" | "value" | "onChange" | "onBlur"
  >
>) {
  const updateCursor = ({ clientX, currentTarget }: React.MouseEvent) => {
    const rect = currentTarget.parentElement?.getBoundingClientRect();
    if (rect) {
      const moved = (clientX - rect.left) / rect.width;
      setCursor(
        clamp(
          moved * frame.duration + frame.start,
          frame.start,
          frame.start + frame.duration
        )
      );
    }
  };

  const updateHandlers = {
    onChange: onChange,
    onBlur: (newValues: Crop[]) => {
      newValues = normalizeCrops(newValues);

      if (newValues.length < values.length) {
        onChange(newValues);
      }

      onBlur(newValues);
    },
  };

  return (
    <div className="flex-grow h-16 bg-neutral-900 rounded-r-2xl relative select-none touch-none">
      <div className="absolute inset-0 flex flex-row rounded-r-2xl overflow-hidden">
        <div className="absolute inset-0 z-10 shadow-inner pointer-events-none" />
        {pics.map((pic, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={pic}
            src={pic}
            role="none"
            alt=""
            style={{ width: `${(picInt / frame.duration) * 100}%` }}
            className="object-cover h-full motion-safe:animate-fly-in"
          />
        ))}
      </div>

      <div // first empty space
        className={classNames({
          "h-full bg-red-800/50 absolute backdrop-contrast-200 backdrop-grayscale":
            true,
          "bg-gradient-to-l from-red-800 bg-[length:4rem_100%] bg-right bg-no-repeat":
            values.length > 0,
        })}
        style={{
          left: `0%`,
          right: `${
            100 - ((values[0]?.start ?? frame.duration) / frame.duration) * 100
          }%`,
        }}
        onMouseMove={updateCursor}
        onPointerDown={dragHandler(updateHandlers, ({ initialX, changeX }) => {
          const initial = initialX * frame.duration;
          const change = clamp(
            changeX * frame.duration,
            frame.start - initial,
            (values[0]?.start ?? frame.duration + frame.start) - initial
          );
          setCursor(initial + change);
          return [
            change > 0
              ? { start: initial, duration: change }
              : { start: initial + change, duration: -change },
            ...values,
          ];
        })}
      />

      {values.map((value, index) => {
        const startPercent =
          ((value.start - frame.start) / frame.duration) * 100;
        const endPercent =
          ((value.start + value.duration - frame.start) / frame.duration) * 100;
        const nextPercent = values[index + 1]
          ? ((values[index + 1].start - frame.start) / frame.duration) * 100
          : 100;

        const minPlaybackLength = Math.min(1, value.duration);
        const left =
          index > 0
            ? values[index - 1].start + values[index - 1].duration
            : frame.start;
        const right =
          index < values.length - 1
            ? values[index + 1].start
            : frame.start + frame.duration;

        return (
          <Fragment key={index}>
            <div // right empty space ~ the part of the timeline after the body
              className={classNames({
                "h-full bg-red-800/50 absolute backdrop-contrast-200 backdrop-grayscale":
                  true,
                "bg-gradient-to-r from-red-800 bg-[length:4rem_100%] bg-left bg-no-repeat rounded-r-2xl":
                  index === values.length - 1,
                "bg-gradient-to-r from-red-800 via-red-800/0 to-red-800 bg-no-repeat":
                  index < values.length - 1,
              })}
              style={{ left: `${endPercent}%`, right: `${100 - nextPercent}%` }}
              onMouseMove={updateCursor}
              onPointerDown={dragHandler(
                updateHandlers,
                ({ initialX, changeX }) => {
                  const initial = initialX * frame.duration;
                  const change = clamp(
                    changeX * frame.duration,
                    value.start + value.duration - initial,
                    right - initial
                  );
                  setCursor(initial + change);
                  return [
                    ...values.slice(0, index + 1),
                    change > 0
                      ? { start: initial, duration: change }
                      : { start: initial + change, duration: -change },
                    ...values.slice(index + 1),
                  ];
                }
              )}
            />

            <div // body range ~ the active part of the timeline
              className="h-full bg-red-800/0 absolute cursor-move"
              style={{
                left: `${startPercent}%`,
                right: `${100 - endPercent}%`,
              }}
              onMouseMove={updateCursor}
              onDoubleClick={(start: React.MouseEvent) => {
                const target = start.currentTarget as HTMLElement;
                const rect = target.parentElement?.getBoundingClientRect();
                if (!rect) {
                  return;
                }

                const p1 =
                  ((start.clientX - rect.left) / rect.width) * frame.duration;
                const p2 = p1 + (frame.duration / rect.width) * 10;
                onChange([
                  ...values.slice(0, index),
                  { start: value.start, duration: p1 - value.start },
                  { start: p2, duration: value.start + value.duration - p2 },
                  ...values.slice(index + 1),
                ]);
              }}
              onPointerDown={dragHandler(
                updateHandlers,
                ({ changeX, pointerType }) => {
                  switch (pointerType) {
                    case "mouse":
                      const limitedChange = clamp(
                        changeX * frame.duration,
                        left - value.start,
                        right - value.duration - value.start
                      );
                      setCursor(value.start + limitedChange);
                      return [
                        ...values.slice(0, index),
                        {
                          start: value.start + limitedChange,
                          duration: value.duration,
                        },
                        ...values.slice(index + 1),
                      ];
                    default:
                      setCursor(
                        clamp(cursor + changeX * frame.duration, left, right)
                      );
                      return values; // no change
                  }
                }
              )}
            />

            {cursor !== undefined && (
              <div // the small cursor line
                className="w-1 -mx-0.5 -inset-y-1 border-x border-black/50 bg-white/50 absolute pointer-events-none"
                style={{ left: `${(cursor / frame.duration) * 100}%` }}
              />
            )}

            <button // left drag handler ~ on the left side of the body
              type="button"
              className="w-4 px-1.5 -mx-2 -inset-y-1 bg-clip-content bg-red-800 absolute cursor-col-resize"
              style={{ left: `${startPercent}%` }}
              onMouseEnter={() => {
                setCursor(value.start);
              }}
              onPointerDown={dragHandler(updateHandlers, ({ changeX }) => {
                const limitedChange = clamp(
                  changeX * frame.duration,
                  Math.max(left - value.start, value.duration - (right - left)),
                  value.duration
                );
                setCursor(value.start + limitedChange);
                return [
                  ...values.slice(0, index),
                  {
                    start: value.start + limitedChange,
                    duration: value.duration - limitedChange,
                  },
                  ...values.slice(index + 1),
                ];
              })}
            />

            <button // right drag handler ~ on the right side of the body
              type="button"
              className="w-4 px-1.5 -mx-2 -inset-y-1 bg-clip-content bg-red-800 absolute cursor-col-resize"
              style={{ right: `${100 - endPercent}%` }}
              onMouseEnter={() => {
                setCursor(value.start + value.duration);
              }}
              onPointerDown={dragHandler(updateHandlers, ({ changeX }) => {
                const limitedChange = clamp(
                  changeX * frame.duration,
                  -value.duration,
                  Math.min(
                    right - left - value.duration,
                    right - value.start - value.duration
                  )
                );
                setCursor(value.start + value.duration + limitedChange);
                return [
                  ...values.slice(0, index),
                  {
                    start: value.start,
                    duration: value.duration + limitedChange,
                  },
                  ...values.slice(index + 1),
                ];
              })}
              onPointerUp={() => {
                const endSeekOffset = paused ? 0 : minPlaybackLength;
                setCursor(value.start + value.duration - endSeekOffset);
              }}
            />
          </Fragment>
        );
      })}
    </div>
  );
}

function normalizeCrops(crops: Crop[]): Crop[] {
  const normalized: Crop[] = [];

  for (let i = 0; i < crops.length; i++) {
    const curr = crops[i];
    if (curr.duration <= 0) {
      continue;
    }

    if (i > 0) {
      const prev = crops[i - 1];
      if (prev.start + prev.duration >= curr.start) {
        prev.duration += curr.duration;
        continue;
      }
    }

    normalized.push(curr);
  }

  return normalized;
}

interface VideoWithFallbackProps
  extends Pick<TimelineProps, "videoSrc" | "pics" | "picInt" | "fps"> {
  cursor: number;
  setCursor: (cursor: number) => void;
  className: string;
  play?: boolean;
  muted?: boolean;
  onClick?: () => void;
}

function VideoWithFallback({
  videoSrc,
  pics,
  picInt,
  fps,
  cursor,
  setCursor,
  className,
  play,
  muted,
  ...additionalProps
}: VideoWithFallbackProps) {
  const videoRef = useRef() as RefObject<HTMLVideoElement>;

  useEffect(() => {
    if (videoRef.current) {
      const delta = Math.abs(videoRef.current.currentTime - cursor);
      if (delta > 1 / fps) {
        videoRef.current.currentTime = cursor;
      }
    }
  }, [cursor, fps]);

  useEffect(() => {
    if (videoRef.current) {
      if (play) {
        if (videoRef.current.paused) {
          videoRef.current.play().catch(console.warn);
        }
      } else {
        if (!videoRef.current.paused) {
          videoRef.current.pause();
        }
      }
    }
  }, [play]);

  const poster =
    pics && picInt ? pics[Math.floor(cursor / picInt)] || pics[0] : undefined;

  if (!videoSrc) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={poster}
        alt="video preview"
        className={className}
        {...additionalProps}
      />
    );
  }

  return (
    <video
      src={videoSrc}
      poster={poster}
      className={className}
      autoPlay={play}
      muted={muted}
      playsInline={true}
      ref={videoRef}
      onTimeUpdate={({ currentTarget }) => {
        if (play) {
          setCursor(currentTarget.currentTime);
        }
      }}
      {...additionalProps}
    />
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function dragHandler<T>(
  handlers: {
    onChange: ((value: T) => void) | undefined;
    onBlur: ((value: T) => void) | undefined;
  },
  handler: (event: {
    initialX: number;
    initialY: number;
    changeX: number;
    changeY: number;
    pointerType: string;
  }) => T
) {
  return (start: React.PointerEvent) => {
    const target = start.currentTarget as HTMLElement;
    const rect = target.parentElement?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const initialX = (start.clientX - rect.left) / rect.width;
    const initialY = (start.clientY - rect.top) / rect.height;

    let value = handler({
      initialX,
      initialY,
      changeX: 0,
      changeY: 0,
      pointerType: start.pointerType,
    });

    const wrappedHandler = (current: PointerEvent) => {
      const positionX = (current.clientX - rect.left) / rect.width;
      const positionY = (start.clientY - rect.top) / rect.height;
      value = handler({
        initialX,
        initialY,
        changeX: positionX - initialX,
        changeY: positionY - initialY,
        pointerType: start.pointerType,
      });
      handlers?.onChange?.(value);
    };

    const document = target.ownerDocument;
    console.log("start drag", { initialX, initialY, start });

    const detachHandler = () => {
      document.removeEventListener("pointermove", wrappedHandler);
      document.removeEventListener("pointerup", detachHandler);
      document.defaultView?.removeEventListener("blur", detachHandler);
      handlers?.onBlur?.(value);
    };
    document.addEventListener("pointermove", wrappedHandler);
    document.addEventListener("pointerup", detachHandler);
    document.defaultView?.addEventListener("blur", detachHandler);
  };
}
