import {ReactNode} from "react";


export function ProgressBar({progress, children}: {progress: number, children: ReactNode[]}) {
  return (
    <div role="progressbar" className="block my-3 h-8 bg-red-200 relative"
         aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
      <div className="bg-red-500 h-8" style={{width: `${progress}%`}}/>
      <div className="absolute inset-0 text-white text-center leading-8">
        {children}
      </div>
    </div>
  );
}
