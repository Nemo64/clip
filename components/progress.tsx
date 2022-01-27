import classNames from "classnames";
import { ReactNode } from "react";

export interface ProgressBarProps {
  progress: number;
  children: ReactNode[] | ReactNode;
  className?: string;
}

export function ProgressBar({
  progress,
  children,
  className,
}: ProgressBarProps) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      className={classNames(
        "block h-8 bg-red-200 rounded-2xl overflow-hidden relative",
        className
      )}
    >
      <div
        className="bg-red-500 w-full h-8 animate-pulse transition duration-700 ease-linear origin-left"
        style={{ transform: `scaleX(${progress / 100})` }}
      />
      <div className="absolute inset-0 text-white text-center leading-8">
        {children}
      </div>
    </div>
  );
}
