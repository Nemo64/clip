import {RefObject, useEffect, useRef} from "react";

interface Crop {
  start: number;
  duration: number;
}

interface TimelineProps {
  frame: Crop;
  limit: number;
  value: Crop;
  onChange?: (crop: Crop) => void;
  onBlur?: (crop: Crop) => void;
  disabled?: boolean;
}

export function Timeline({frame, limit, value, onChange, onBlur, disabled}: TimelineProps) {
  limit = Math.min(limit, frame.duration);

  const wrapperRef = useRef() as RefObject<HTMLDivElement>;
  const bodyRef = useRef() as RefObject<HTMLDivElement>
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

    const createDragHandler = (moveHandler: (event: { initialValue: Crop, valueChange: number }) => Crop) => {
      return ({clientX}: MouseEvent) => {
        const rect = wrapper.getBoundingClientRect();
        const initialValue = {...valueRef.current};
        const initialPosition = (clientX - rect.left) / rect.width * frame.duration + frame.start;
        const wrappedHandler = ({clientX}: MouseEvent) => {
          const position = (clientX - rect.left) / rect.width * frame.duration + frame.start;
          const valueChange = position - initialPosition;
          valueRef.current = moveHandler({initialValue, valueChange});
          onChange?.(valueRef.current);
        };
        const detachHandler = () => {
          wrapper.ownerDocument.removeEventListener("mousemove", wrappedHandler);
          wrapper.ownerDocument.removeEventListener("mouseup", detachHandler);
          wrapper.ownerDocument.defaultView?.removeEventListener("blur", detachHandler);
          onBlur?.(valueRef.current);
        };
        wrapper.ownerDocument.addEventListener("mousemove", wrappedHandler);
        wrapper.ownerDocument.addEventListener("mouseup", detachHandler);
        wrapper.ownerDocument.defaultView?.addEventListener("blur", detachHandler);
      }
    };

    const bodyHandler = createDragHandler(({initialValue, valueChange}) => {
      return {
        start: clamp(initialValue.start + valueChange, frame.start, frame.start + frame.duration - initialValue.duration),
        duration: initialValue.duration,
      };
    });

    const leftHandler = createDragHandler(({initialValue, valueChange}) => {
      const limitedChange = clamp(valueChange, limit - initialValue.duration, initialValue.duration);
      return {
        start: initialValue.start + limitedChange,
        duration: initialValue.duration - limitedChange,
      };
    });

    const rightHandler = createDragHandler(({initialValue, valueChange}) => {
      const limitedChange = clamp(valueChange, -initialValue.duration, limit - initialValue.duration);
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
  }, [frame.start, frame.duration, limit, onChange, onBlur]);

  const left = (value.start - frame.start) / frame.duration;
  const right = (value.start + value.duration - frame.start) / frame.duration;
  return <>
    <label htmlFor="start">start time </label>
    <input type="number" id="start" disabled={disabled} className="w-24"
           value={value.start.toFixed(3)}
           step="0.001" min={frame.start.toFixed(3)} max={(frame.start + frame.duration - value.duration).toFixed(3)}
           onInput={e => onChange?.({start: parseFloat(e.currentTarget.value), duration: value.duration})}/>
    <label htmlFor="duration">duration </label>
    <input type="number" id="duration" disabled={disabled} className="w-24"
           value={value.duration.toFixed(3)}
           step="0.001" min={frame.start.toFixed(3)} max={limit.toFixed(3)}
           onInput={e => onChange?.({start: value.start, duration: parseFloat(e.currentTarget.value)})}/>
    <div className="h-8 bg-red-200 rounded overflow-hidden relative select-none" ref={wrapperRef}>
      <div className="h-8 bg-red-500 absolute cursor-move" ref={bodyRef}
           style={{left: `${left * 100}%`, right: `${100 - right * 100}%`}}/>
      <div className="h-8 w-2 bg-red-800 absolute cursor-col-resize" ref={leftRef}
           style={{left: `${left * 100}%`}}/>
      <div className="h-8 w-2 bg-red-800 absolute cursor-col-resize" ref={rightRef}
           style={{right: `${100 - right * 100}%`}}/>
    </div>
  </>;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
