import classNames from "classnames";
import { MouseEvent, RefObject, useEffect, useRef, useState } from "react";
import { t } from "../src/intl";
import { DurationInput } from "./input";
import { Button } from "./button";
import { PlayIcon, StopIcon } from "./icons";

export interface Crop {
  start: number;
  duration: number;
}

export interface TimelineProps {
  frame: Crop;
  width: number;
  height: number;
  className?: string;
  limit?: number;
  value: Crop;
  videoSrc?: string;
  fps: number;
  onChange?: (crop: Crop) => void;
  onBlur?: (crop: Crop) => void;
  disabled?: boolean;
  pics?: string[];
  picInt?: number;
}

export function Timeline({
  frame: { duration, start },
  width,
  height,
  className,
  limit,
  value,
  videoSrc,
  fps,
  onChange,
  onBlur,
  disabled,
  pics,
  picInt,
}: TimelineProps) {
  const maxDuration = limit ? Math.min(limit, duration) : duration;
  const [initialPicsLength] = useState(pics?.length ?? 0);
  const ref = useRef() as RefObject<HTMLElement>;

  const [cursor, setCursor] = useState(0);
  const updateCursor = ({ clientX, currentTarget }: MouseEvent) => {
    const rect = currentTarget.parentElement?.getBoundingClientRect();
    if (rect) {
      setCursor(
        clamp(
          ((clientX - rect.left) / rect.width) * duration + start,
          start,
          duration
        )
      );
    }
  };

  const startPercent = ((value.start - start) / duration) * 100;
  const endPercent = ((value.start + value.duration - start) / duration) * 100;
  const endSeekOffset = Math.min(1, value.duration);

  const timeStampWidth = ref.current?.clientWidth ?? 0;
  const timeStampArea = ref.current?.parentElement?.clientWidth ?? 1;
  const timeStampMoveFactor = timeStampArea / (timeStampArea - timeStampWidth);

  return (
    <div
      className={classNames("flex flex-col max-h-full font-mono", className)}
    >
      <div
        className="w-full rounded-2xl overflow-hidden relative bg-slate-100"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        {pics?.length && picInt ? (
          <VideoWithFallback
            videoSrc={videoSrc}
            pics={pics}
            picInt={picInt}
            fps={fps}
            cursor={cursor}
            setCursor={setCursor}
            play={
              cursor >= value.start - 1 / fps &&
              cursor <= value.start + value.duration - 1 / fps
            }
            className="absolute w-full h-full object-contain"
          />
        ) : (
          <div className="p-4 text-center">{t("timeline.no_preview")}</div>
        )}
        {cursor !== undefined && (
          <DurationInput
            ref={ref as any}
            value={cursor}
            onChange={setCursor}
            min={start}
            max={duration}
            divisor={Math.floor(fps)}
            className="absolute px-2 bottom-0 rounded-t-2xl bg-black/50 text-white"
            style={{
              left: `${(cursor / duration / timeStampMoveFactor) * 100}%`,
            }}
          />
        )}
      </div>
      <div className="h-16 mt-2 mb-8 bg-black bg-slate-800 rounded-2xl relative select-none">
        <div className="absolute inset-0 flex flex-row  rounded-2xl overflow-hidden">
          {picInt &&
            pics?.map((pic, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={pic}
                src={pic}
                role="none"
                alt=""
                style={{ width: `${(picInt / duration) * 100}%` }}
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
          onMouseDown={createDragHandler(onChange, onBlur, ({ changeX }) => {
            const limitedChange = clamp(
              changeX * duration + start,
              -value.start,
              duration - value.duration - value.start
            );
            setCursor(value.start + limitedChange);
            return {
              start: value.start + limitedChange,
              duration: value.duration,
            };
          })}
        />
        <div // left cut range ~ the part of the timeline before the body
          className="h-full rounded-l-2xl bg-gradient-to-l from-red-800 bg-red-800/50 bg-[length:4rem_100%] bg-right bg-no-repeat absolute backdrop-contrast-200 backdrop-grayscale"
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
            style={{ left: `${(cursor / duration) * 100}%` }}
          />
        )}
        <div // left drag handler ~ on the left side of the body
          className="w-4 px-1.5 -mx-2 -inset-y-1 bg-clip-content bg-red-800 absolute cursor-col-resize"
          style={{ left: `${startPercent}%` }}
          onMouseEnter={() => {
            setCursor(value.start);
          }}
          onMouseDown={createDragHandler(onChange, onBlur, ({ changeX }) => {
            const limitedChange = clamp(
              changeX * duration + start,
              Math.max(-value.start, value.duration - maxDuration),
              value.duration
            );
            setCursor(value.start + limitedChange);
            return {
              start: value.start + limitedChange,
              duration: value.duration - limitedChange,
            };
          })}
        />
        <Button
          className="absolute top-full w-6 h-6 -mx-3 my-1 text-red-800 hover:text-red-700"
          style={{ left: `${startPercent}%` }}
          onClick={() => {
            setCursor(value.start);
          }}
        >
          <PlayIcon />
        </Button>
        <div // right drag handler ~ on the right side of the body
          className="w-4 px-1.5 -mx-2 -inset-y-1 bg-clip-content bg-red-800 absolute cursor-col-resize"
          style={{ right: `${100 - endPercent}%` }}
          onMouseEnter={() => {
            setCursor(value.start + value.duration - endSeekOffset);
          }}
          onMouseDown={createDragHandler(onChange, onBlur, ({ changeX }) => {
            const limitedChange = clamp(
              changeX * duration + start,
              -value.duration,
              Math.min(
                maxDuration - value.duration,
                start + duration - value.start - value.duration
              )
            );
            setCursor(
              value.start + value.duration + limitedChange - endSeekOffset
            );
            return {
              start: value.start,
              duration: value.duration + limitedChange,
            };
          })}
        />
        <Button
          className="absolute top-full w-6 h-6 -mx-3 my-1 text-red-800 hover:text-red-700"
          style={{ right: `${100 - endPercent}%` }}
          onClick={() => {
            setCursor(value.start + value.duration);
          }}
        >
          <StopIcon />
        </Button>
      </div>
      <div className="flex flex-row justify-between">
        <div>
          <label htmlFor="start">{t("timeline.start_time")} </label>
          <DurationInput
            id="start"
            disabled={disabled}
            className="inline-block align-bottom"
            value={value.start}
            min={start}
            max={start + duration - value.duration}
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
              setCursor(value.start + value.duration - endSeekOffset);
            }}
            onChange={(newValue) => {
              setCursor(value.start + newValue - endSeekOffset);
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
            min={start}
            max={start + duration}
            divisor={Math.floor(fps)}
            onFocus={() => {
              setCursor(value.start + value.duration - endSeekOffset);
            }}
            onChange={(newValue) => {
              setCursor(newValue - endSeekOffset);
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
    return <img src={poster} alt="video preview" className={className} />;
  }

  return (
    <video
      src={videoSrc}
      poster={poster}
      className={className}
      autoPlay={play}
      ref={videoRef}
      onTimeUpdate={({ currentTarget }) => setCursor(currentTarget.currentTime)}
    />
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function createDragHandler<T>(
  onChange: ((value: T) => void) | undefined,
  onBlur: ((value: T) => void) | undefined,
  handler: (event: { changeX: number; changeY: number }) => T
) {
  return ({ clientX, clientY, currentTarget }: MouseEvent) => {
    const rect = currentTarget.parentElement?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const initialX = (clientX - rect.left) / rect.width;
    const initialY = (clientY - rect.top) / rect.height;
    let value = handler({ changeX: 0, changeY: 0 });

    const wrappedHandler = ({ clientX }: { clientX: number }) => {
      const positionX = (clientX - rect.left) / rect.width;
      const positionY = (clientY - rect.top) / rect.height;
      value = handler({
        changeX: positionX - initialX,
        changeY: positionY - initialY,
      });
      onChange?.(value);
    };

    const document = currentTarget.ownerDocument;
    const detachHandler = () => {
      document.removeEventListener("mousemove", wrappedHandler);
      document.removeEventListener("mouseup", detachHandler);
      document.defaultView?.removeEventListener("blur", detachHandler);
      onBlur?.(value);
    };
    document.addEventListener("mousemove", wrappedHandler);
    document.addEventListener("mouseup", detachHandler);
    document.defaultView?.addEventListener("blur", detachHandler);
  };
}
