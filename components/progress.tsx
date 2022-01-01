import classNames from "classnames";
import {ReactNode} from "react";


export function ProgressBar({progress, children, className}: {progress: number, children: ReactNode[], className?: string}) {
  return (
    <div role="progressbar" className={classNames('block h-8 bg-red-200 relative', className)}
         aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
      <div className="bg-red-500 h-8" style={{width: `${progress}%`}}/>
      <div className="absolute inset-0 text-white text-center leading-8">
        {children}
      </div>
    </div>
  );
}
