import {
  FieldsetHTMLAttributes,
  ForwardedRef,
  forwardRef,
  RefObject,
  useRef,
} from "react";
import classNames from "classnames";

export interface DurationInputProps
  extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, "onChange"> {
  value: number;
  min?: number;
  max?: number;
  divisor?: number;
  onChange?: (value: number) => void;
}

export const DurationInput = forwardRef(function DurationInput(
  { value, min, max, divisor, onChange, ...props }: DurationInputProps,
  ref: ForwardedRef<HTMLFieldSetElement>
) {
  const minutesRef = useRef() as RefObject<HTMLInputElement>;
  const secondsRef = useRef() as RefObject<HTMLInputElement>;
  const fracRef = useRef() as RefObject<HTMLInputElement>;

  const handleChange = () => {
    const minutes = parseInt(minutesRef.current?.value ?? "0", 10);
    const seconds = parseInt(secondsRef.current?.value ?? "0", 10);
    const fractions = parseInt(fracRef.current?.value ?? "0", 10);
    if (Number.isNaN(minutes) || Number.isNaN(seconds)) {
      return;
    }

    let value = minutes * 60 + seconds;
    if (divisor && !Number.isNaN(fractions)) {
      value += fractions / divisor;
    }

    if (min !== undefined) {
      value = Math.max(value, min);
    }
    if (max !== undefined) {
      value = Math.min(value, max);
    }
    onChange?.(value);
  };

  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  const fractions = Math.round((value % 1) * (divisor ?? 0));

  const mDigits = Math.max(
    min !== undefined ? (min / 60).toFixed(0).length : 2,
    max !== undefined ? (max / 60).toFixed(0).length : 2,
    2
  );
  const sDigits = 2;
  const fDigits = divisor?.toString().length ?? 0;

  return (
    <fieldset
      {...props}
      className={classNames("whitespace-nowrap", props.className)}
      ref={ref}
    >
      <input
        type="number"
        aria-label="minutes"
        ref={minutesRef}
        className="text-right bg-transparent appearance-none no-arrows"
        style={{ width: `${mDigits}ch` }}
        onChange={handleChange}
        onFocus={(e) => e.target.select()}
        min={min !== undefined ? Math.floor(min / 60) : undefined}
        max={max !== undefined ? Math.ceil(max / 60) : undefined}
        value={minutes}
      />
      :
      <input
        type="number"
        aria-label="seconds"
        ref={secondsRef}
        className="text-right bg-transparent appearance-none no-arrows"
        style={{ width: `${sDigits}ch` }}
        onChange={handleChange}
        onFocus={(e) => e.target.select()}
        onBlur={({ currentTarget }) => {
          currentTarget.value = seconds.toString().padStart(2, "0");
        }}
        min={min !== undefined ? Math.floor(min - minutes * 60) : undefined}
        max={max !== undefined ? Math.ceil(max - minutes * 60) : undefined}
        value={
          secondsRef.current &&
          secondsRef.current === secondsRef.current.ownerDocument.activeElement
            ? seconds.toString()
            : seconds.toString().padStart(2, "0")
        }
      />
      {divisor && (
        <>
          .
          <input
            type="number"
            aria-label="fractions"
            ref={fracRef}
            className="text-right bg-transparent appearance-none no-arrows"
            style={{ width: `${fDigits}ch` }}
            onChange={handleChange}
            onFocus={(e) => e.target.select()}
            onBlur={({ currentTarget }) => {
              currentTarget.value = fractions.toString().padStart(fDigits, "0");
            }}
            value={
              fracRef.current &&
              fracRef.current === fracRef.current.ownerDocument.activeElement
                ? fractions.toString()
                : fractions.toString().padStart(fDigits, "0")
            }
            min={
              min !== undefined
                ? Math.floor((min - (minutes * 60 + seconds)) * divisor)
                : undefined
            }
            max={
              max !== undefined
                ? Math.ceil((max - (minutes * 60 + seconds)) * divisor)
                : undefined
            }
          />
        </>
      )}
    </fieldset>
  );
});
