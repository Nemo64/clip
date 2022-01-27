import classNames from "classnames";
import { MouseEvent, useState } from "react";
import { t } from "../src/intl";

export interface Crop {
  start: number;
  duration: number;
}

export interface TimelineProps {
  frame: Crop;
  width: number;
  height: number;
  limit?: number;
  value: Crop;
  onChange?: (crop: Crop) => void;
  onBlur?: (crop: Crop) => void;
  disabled?: boolean;
  pics?: string[];
  picInt?: number;
}

const fractionDigits = 3;

export function Timeline({
  frame: { duration, start },
  width,
  height,
  limit,
  value,
  onChange,
  onBlur,
  disabled,
  pics,
  picInt,
}: TimelineProps) {
  const maxDuration = limit ? Math.min(limit, duration) : duration;
  const [initialPicsLength] = useState(pics?.length ?? 0);

  const startBodyDrag = createDragHandler(onChange, onBlur, ({ changeX }) => {
    const limitedChange = clamp(
      changeX * duration + start,
      -value.start,
      duration - value.duration - value.start
    );
    return {
      start: value.start + limitedChange,
      duration: value.duration,
    };
  });

  const startLeftDrag = createDragHandler(onChange, onBlur, ({ changeX }) => {
    const limitedChange = clamp(
      changeX * duration + start,
      Math.max(-value.start, value.duration - maxDuration),
      value.duration
    );
    return {
      start: value.start + limitedChange,
      duration: value.duration - limitedChange,
    };
  });

  const startRightDrag = createDragHandler(onChange, onBlur, ({ changeX }) => {
    const limitedChange = clamp(
      changeX * duration + start,
      -value.duration,
      Math.min(
        maxDuration - value.duration,
        start + duration - value.start - value.duration
      )
    );
    return {
      start: value.start,
      duration: value.duration + limitedChange,
    };
  });

  const [cursor, setCursor] = useState(0);
  const updateCursor = ({ clientX, currentTarget }: MouseEvent) => {
    const rect = currentTarget.getBoundingClientRect();
    setCursor(((clientX - rect.left) / rect.width) * duration + start);
  };

  const startPercent = ((value.start - start) / duration) * 100;
  const endPercent = ((value.start + value.duration - start) / duration) * 100;
  return (
    <>
      <div
        className="w-full rounded-2xl overflow-hidden relative bg-slate-100"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        {pics?.length && picInt ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pics[Math.floor(cursor / picInt)] || pics[0]}
            alt="preview"
            className="absolute w-full h-full object-contain"
          />
        ) : (
          <div className="p-4 text-center">{t("timeline.no_preview")}</div>
        )}
      </div>
      <div
        className="h-16 mt-2 bg-black bg-slate-800 rounded-2xl overflow-hidden relative select-none"
        onMouseMove={updateCursor}
      >
        <div className="absolute inset-0 flex flex-row">
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
        <div
          className="h-full bg-red-800/0 absolute cursor-move"
          style={{ left: `${startPercent}%`, right: `${100 - endPercent}%` }}
          onMouseDown={startBodyDrag}
        />
        <div
          className="h-full bg-red-800/70 absolute backdrop-contrast-200"
          style={{ left: `0%`, right: `${100 - startPercent}%` }}
        />
        <div
          className="h-full bg-red-800/70 absolute backdrop-contrast-200"
          style={{ left: `${endPercent}%`, right: `0%` }}
        />
        {cursor !== undefined && (
          <div
            className="w-0.5 h-full -mx-0.25 bg-black/50 absolute pointer-events-none"
            style={{ left: `${(cursor / duration) * 100}%` }}
          />
        )}
        <div
          className="h-full w-2 bg-red-800 absolute cursor-col-resize"
          style={{ left: `${startPercent}%` }}
          onMouseDown={startLeftDrag}
        />
        <div
          className="h-full w-2 bg-red-800 absolute cursor-col-resize"
          style={{ right: `${100 - endPercent}%` }}
          onMouseDown={startRightDrag}
        />
      </div>
      <div className="flex flex-row justify-between">
        <div>
          <label htmlFor="start">{t("timeline.start_time")} </label>
          <input
            type="number"
            id="start"
            disabled={disabled}
            className="w-20 bg-transparent text-right"
            value={value.start.toFixed(fractionDigits)}
            step={1 / 10 ** fractionDigits}
            min={start.toFixed(fractionDigits)}
            max={(start + duration - value.duration).toFixed(fractionDigits)}
            onInput={(e) => {
              onChange?.({
                start: parseFloat(e.currentTarget.value),
                duration: value.duration,
              });
            }}
          />
        </div>
        <div>
          <label htmlFor="duration">{t("timeline.duration")} </label>
          <input
            type="number"
            id="duration"
            disabled={disabled}
            className="w-20 bg-transparent text-right"
            value={value.duration.toFixed(fractionDigits)}
            step={1 / 10 ** fractionDigits}
            min={(0).toFixed(fractionDigits)}
            max={maxDuration.toFixed(fractionDigits)}
            onInput={(e) => {
              onChange?.({
                start: value.start,
                duration: parseFloat(e.currentTarget.value),
              });
            }}
          />
        </div>
        <div>
          <label htmlFor="end">{t("timeline.end_time")} </label>
          <input
            type="number"
            id="end"
            disabled={disabled}
            className="w-20 bg-transparent text-right"
            value={(value.start + value.duration).toFixed(fractionDigits)}
            step={1 / 10 ** fractionDigits}
            min={start.toFixed(fractionDigits)}
            max={(start + duration).toFixed(fractionDigits)}
            onInput={(e) => {
              onChange?.({
                start: value.start,
                duration: parseFloat(e.currentTarget.value) - value.duration,
              });
            }}
          />
        </div>
      </div>
    </>
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
