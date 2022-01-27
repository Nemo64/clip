import classNames from "classnames";
import { RefObject, useEffect, useRef, useState } from "react";
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

  const wrapperRef = useRef() as RefObject<HTMLDivElement>;
  const bodyRef = useRef() as RefObject<HTMLDivElement>;
  const leftRef = useRef() as RefObject<HTMLDivElement>;
  const rightRef = useRef() as RefObject<HTMLDivElement>;
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const body = bodyRef.current;
    const left = leftRef.current;
    const right = rightRef.current;
    if (!wrapper || !body || !left || !right) {
      return;
    }

    interface DragEvent {
      initialValue: Crop;
      valueChange: number;
    }

    const createDragHandler = (moveHandler: (event: DragEvent) => Crop) => {
      return ({ clientX }: MouseEvent) => {
        const rect = wrapper.getBoundingClientRect();
        const initialValue = { ...valueRef.current };
        const initialPosition =
          ((clientX - rect.left) / rect.width) * duration + start;
        const wrappedHandler = ({ clientX }: MouseEvent) => {
          const position =
            ((clientX - rect.left) / rect.width) * duration + start;
          const valueChange = position - initialPosition;
          valueRef.current = moveHandler({ initialValue, valueChange });
          onChange?.(valueRef.current);
        };
        const document = wrapper.ownerDocument;
        const detachHandler = () => {
          document.removeEventListener("mousemove", wrappedHandler);
          document.removeEventListener("mouseup", detachHandler);
          document.defaultView?.removeEventListener("blur", detachHandler);
          onBlur?.(valueRef.current);
        };
        document.addEventListener("mousemove", wrappedHandler);
        document.addEventListener("mouseup", detachHandler);
        document.defaultView?.addEventListener("blur", detachHandler);
      };
    };

    const bodyHandler = createDragHandler(({ initialValue, valueChange }) => {
      return {
        start: clamp(
          initialValue.start + valueChange,
          start,
          start + duration - initialValue.duration
        ),
        duration: initialValue.duration,
      };
    });

    const leftHandler = createDragHandler(({ initialValue, valueChange }) => {
      const maxDecrease = Math.max(
        initialValue.duration - maxDuration,
        -initialValue.start
      );
      const limitedChange = clamp(
        valueChange,
        maxDecrease,
        initialValue.duration
      );
      return {
        start: initialValue.start + limitedChange,
        duration: initialValue.duration - limitedChange,
      };
    });

    const rightHandler = createDragHandler(({ initialValue, valueChange }) => {
      const maxIncrease = Math.min(
        maxDuration - initialValue.duration,
        start + duration - initialValue.start - initialValue.duration
      );
      const limitedChange = clamp(
        valueChange,
        -initialValue.duration,
        maxIncrease
      );
      return {
        start: initialValue.start,
        duration: initialValue.duration + limitedChange,
      };
    });

    body.addEventListener("mousedown", bodyHandler);
    left.addEventListener("mousedown", leftHandler);
    right.addEventListener("mousedown", rightHandler);
    return () => {
      body.removeEventListener("mousedown", bodyHandler);
      left.removeEventListener("mousedown", leftHandler);
      right.removeEventListener("mousedown", rightHandler);
    };
  }, [start, duration, maxDuration, onChange, onBlur]);

  const [cursor, setCursor] = useState<number | undefined>();
  const updateCursor = ({ clientX }: { clientX: number }) => {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    setCursor(((clientX - rect.left) / rect.width) * duration + start);
  };

  const left = (value.start - start) / duration;
  const right = (value.start + value.duration - start) / duration;
  const aspectRatio = `${width} / ${height}`;
  return (
    <>
      <div
        className="w-full rounded-2xl overflow-hidden relative bg-slate-100"
        style={{ aspectRatio }}
      >
        {pics?.length ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={
              (cursor && picInt && pics[Math.floor(cursor / picInt)]) || pics[0]
            }
            alt="preview"
            className="absolute w-full h-full object-contain"
          />
        ) : (
          <div className="p-4 text-center">{t("timeline.no_preview")}</div>
        )}
      </div>
      <div
        className="h-16 mt-2 bg-black bg-slate-800 rounded-2xl overflow-hidden relative select-none"
        ref={wrapperRef}
        onMouseMove={updateCursor}
      >
        <div className="absolute inset-0 flex flex-row">
          {picInt &&
            pics?.map((pic, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={pic}
                src={pic}
                alt={index.toString()}
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
          ref={bodyRef}
          style={{ left: `${left * 100}%`, right: `${100 - right * 100}%` }}
        />
        <div
          className="h-full bg-red-800/70 absolute backdrop-grayscale backdrop-contrast-200"
          style={{ left: `0%`, right: `${100 - left * 100}%` }}
        />
        <div
          className="h-full bg-red-800/70 absolute backdrop-grayscale backdrop-contrast-200"
          style={{ left: `${right * 100}%`, right: `0%` }}
        />
        {cursor !== undefined && (
          <div
            className="w-0.5 h-full -mx-0.25 bg-black/50 absolute pointer-events-none"
            style={{ left: `${(cursor / duration) * 100}%` }}
          />
        )}
        <div
          className="h-full w-2 bg-red-800 absolute cursor-col-resize"
          ref={leftRef}
          style={{ left: `${left * 100}%` }}
        />
        <div
          className="h-full w-2 bg-red-800 absolute cursor-col-resize"
          ref={rightRef}
          style={{ right: `${100 - right * 100}%` }}
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
            value={value.start.toFixed(3)}
            step="0.001"
            min={start.toFixed(3)}
            max={(start + duration - value.duration).toFixed(3)}
            onInput={(e) =>
              onChange?.({
                start: parseFloat(e.currentTarget.value),
                duration: value.duration,
              })
            }
          />
        </div>
        <div>
          <label htmlFor="duration">{t("timeline.duration")} </label>
          <input
            type="number"
            id="duration"
            disabled={disabled}
            className="w-20 bg-transparent text-right"
            value={value.duration.toFixed(3)}
            step="0.001"
            min="0.000"
            max={maxDuration.toFixed(3)}
            onInput={(e) =>
              onChange?.({
                start: value.start,
                duration: parseFloat(e.currentTarget.value),
              })
            }
          />
        </div>
        <div>
          <label htmlFor="end">{t("timeline.end_time")} </label>
          <input
            type="number"
            id="end"
            disabled={disabled}
            className="w-20 bg-transparent text-right"
            value={(value.start + value.duration).toFixed(3)}
            step="0.001"
            min={start.toFixed(3)}
            max={(start + duration).toFixed(3)}
            onInput={(e) =>
              onChange?.({
                start: value.start,
                duration: parseFloat(e.currentTarget.value) - value.duration,
              })
            }
          />
        </div>
      </div>
    </>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
