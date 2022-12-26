import { Fragment } from "react";

export function FormattedCommand({
  children: [command, ...args],
  escapeClassName = "text-slate-400",
}: {
  children: string[];
  escapeClassName?: string;
}) {
  return (
    <pre className="my-2 text-sm">
      {command}
      {args.map((arg, index, array) => {
        const next = array[index + 1];
        const prev = array[index - 1];
        const isOption = arg.startsWith("-");
        const isValueOption = isOption && next && !next.startsWith("-");
        const isAfterValue = isOption && !prev?.startsWith("-");
        const isLastArg = index === array.length - 1;
        return (
          <Fragment key={index}>
            {" "}
            {(isValueOption || isAfterValue || isLastArg) && (
              <span className={escapeClassName}>{"\\\n  "}</span>
            )}
            {arg.includes(" ") ? `'${arg}'` : arg}
          </Fragment>
        );
      })}
    </pre>
  );
}
