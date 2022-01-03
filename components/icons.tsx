import classNames from "classnames";

export interface IconProps {
  className?: string;
}

export function Spinner ({className}: IconProps) {
  return (
    <div className={classNames('inline-block w-6 h-6 animate-spin rounded-full border-4 border-red-200 border-r-current', className)}/>
  );
}

export function BoltIcon({className}: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={classNames('h-6 w-6 inline-block', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

export function DownloadIcon({className}: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={classNames('h-6 w-6 inline-block', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
    </svg>
  );
}

export function AddFileIcon({className}: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={classNames('h-6 w-6 inline-block', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    </svg>
  )
}

export function TranslateIcon({className}: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={classNames('h-6 w-6 inline-block', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
    </svg>
  );
}
