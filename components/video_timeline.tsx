import classNames from "classnames";
import React, {
  MouseEvent,
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
  limit?: number;
  value: Crop;
  videoSrc?: string;
  fps: number;
  onChange?: (crop: Crop) => void;
  onBlur?: (crop: Crop) => void;
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
  limit,
  value,
  videoSrc,
  fps,
  onChange,
  onBlur,
  disabled,
  muted,
  pics = [],
  picInt = frame.duration / pics.length,
}: TimelineProps) {
  const maxDuration = limit ? Math.min(limit, frame.duration) : frame.duration;
  const [initialPicsLength] = useState(pics?.length ?? 0);

  const [cursor, setCursor] = useState(0);
  const [paused, setPaused] = useState(false);

  const startPercent = ((value.start - frame.start) / frame.duration) * 100;
  const endPercent =
    ((value.start + value.duration - frame.start) / frame.duration) * 100;

  const minPlaybackLength = Math.min(1, value.duration);

  const timeStampRef = useRef() as RefObject<HTMLElement>;
  const timeStampWidth = timeStampRef.current?.clientWidth ?? 0;
  const timeStampArea = timeStampRef.current?.parentElement?.clientWidth ?? 1;
  const timeStampMoveFactor = timeStampArea / (timeStampArea - timeStampWidth);

  const playing =
    !paused &&
    cursor >= value.start - 1 / fps &&
    cursor <= value.start + value.duration - 1 / fps;

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

  const togglePlay = useCallback(
    (evt?: { preventDefault: () => void }) => {
      evt?.preventDefault();
      if (playing) {
        setPaused(true);
      } else {
        setPaused(false);
        // ensure playing is even possible
        if (cursor < value.start) {
          setCursor(value.start);
        } else if (cursor > value.start + value.duration - minPlaybackLength) {
          setCursor(value.start);
        }
      }
    },
    [cursor, minPlaybackLength, playing, value.duration, value.start]
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
            setCursor={setCursor}
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
        <div className="flex-grow h-16 bg-neutral-900 rounded-r-2xl relative select-none touch-none">
          <div className="absolute inset-0 flex flex-row rounded-r-2xl overflow-hidden">
            {pics.map((pic, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={pic}
                src={pic}
                role="none"
                alt=""
                style={{ width: `${(picInt / frame.duration) * 100}%` }}
                className={classNames({
                  "object-cover h-full": true,
                  "motion-safe:animate-fly-in": index >= initialPicsLength,
                })}
              />
            ))}
          </div>
          <div className="absolute inset-0 shadow-inner" />
          <div // body range ~ the active part of the timeline
            className="h-full bg-red-800/0 absolute cursor-move"
            style={{ left: `${startPercent}%`, right: `${100 - endPercent}%` }}
            onMouseMove={updateCursor}
            onPointerDown={dragHandler(
              onChange,
              onBlur,
              ({ changeX, pointerType }) => {
                switch (pointerType) {
                  case "mouse":
                    const limitedChange = clamp(
                      frame.start + changeX * frame.duration,
                      frame.start - value.start,
                      frame.start +
                        frame.duration -
                        value.duration -
                        value.start
                    );
                    setCursor(value.start + limitedChange);
                    return {
                      start: value.start + limitedChange,
                      duration: value.duration,
                    };
                  default:
                    setCursor(
                      clamp(
                        cursor + changeX * frame.duration,
                        frame.start,
                        frame.start + frame.duration
                      )
                    );
                    return value; // no change
                }
              }
            )}
          />
          <div // left cut range ~ the part of the timeline before the body
            className="h-full bg-gradient-to-l from-red-800 bg-red-800/50 bg-[length:4rem_100%] bg-right bg-no-repeat absolute backdrop-contrast-200 backdrop-grayscale"
            style={{ left: `0%`, right: `${100 - startPercent}%` }}
            onMouseMove={updateCursor}
          />
          <div // right cut range ~ the part of the timeline after the body
            className="h-full rounded-r-2xl bg-gradient-to-r from-red-800 bg-red-800/50 bg-[length:4rem_100%] bg-left bg-no-repeat absolute backdrop-contrast-200 backdrop-grayscale"
            style={{ left: `${endPercent}%`, right: `0%` }}
            onMouseMove={updateCursor}
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
            onPointerDown={dragHandler(onChange, onBlur, ({ changeX }) => {
              const limitedChange = clamp(
                frame.start + changeX * frame.duration,
                Math.max(
                  frame.start - value.start,
                  value.duration - maxDuration
                ),
                value.duration
              );
              setCursor(value.start + limitedChange);
              return {
                start: value.start + limitedChange,
                duration: value.duration - limitedChange,
              };
            })}
          />
          <button // right drag handler ~ on the right side of the body
            type="button"
            className="w-4 px-1.5 -mx-2 -inset-y-1 bg-clip-content bg-red-800 absolute cursor-col-resize"
            style={{ right: `${100 - endPercent}%` }}
            onMouseEnter={() => {
              setCursor(value.start + value.duration);
            }}
            onPointerDown={dragHandler(onChange, onBlur, ({ changeX }) => {
              const limitedChange = clamp(
                frame.start + changeX * frame.duration,
                -value.duration,
                Math.min(
                  maxDuration - value.duration,
                  frame.start + frame.duration - value.start - value.duration
                )
              );
              setCursor(value.start + value.duration + limitedChange);
              return {
                start: value.start,
                duration: value.duration + limitedChange,
              };
            })}
            onPointerUp={() => {
              const endSeekOffset = paused ? 0 : minPlaybackLength;
              setCursor(value.start + value.duration - endSeekOffset);
            }}
          />
        </div>
      </div>
      <div className="flex flex-row justify-between">
        <div>
          <label htmlFor="start">{t("timeline.start_time")} </label>
          <DurationInput
            id="start"
            disabled={disabled}
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
            disabled={disabled}
            className="inline-block align-bottom"
            value={value.duration}
            min={0}
            max={maxDuration}
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
            disabled={disabled}
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
    </div>
  );
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
        setCursor(currentTarget.currentTime);
      }}
      {...additionalProps}
    />
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function dragHandler<T>(
  onChange: ((value: T) => void) | undefined,
  onBlur: ((value: T) => void) | undefined,
  handler: (event: {
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
      changeX: 0,
      changeY: 0,
      pointerType: start.pointerType,
    });

    const wrappedHandler = (current: PointerEvent) => {
      const positionX = (current.clientX - rect.left) / rect.width;
      const positionY = (start.clientY - rect.top) / rect.height;
      value = handler({
        changeX: positionX - initialX,
        changeY: positionY - initialY,
        pointerType: start.pointerType,
      });
      onChange?.(value);
    };

    const document = target.ownerDocument;
    console.log("start drag", { initialX, initialY, start });

    const detachHandler = () => {
      document.removeEventListener("pointermove", wrappedHandler);
      document.removeEventListener("pointerup", detachHandler);
      document.defaultView?.removeEventListener("blur", detachHandler);
      onBlur?.(value);
    };
    document.addEventListener("pointermove", wrappedHandler);
    document.addEventListener("pointerup", detachHandler);
    document.defaultView?.addEventListener("blur", detachHandler);
  };
}
