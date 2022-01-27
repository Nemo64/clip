import classNames from "classnames";
import {
  ButtonHTMLAttributes,
  ForwardedRef,
  forwardRef,
  MouseEvent,
  ReactElement,
  useState,
} from "react";
import { Link, LinkProps as OriginalLinkProps } from "./link";

// <a href> buttons extensions
export interface LinkProps extends OriginalLinkProps {
  href: string; // enforce href for identification

  onClick?: (e: MouseEvent<HTMLAnchorElement>) => Promise<void> | void;
  disabled?: boolean; // fixates disabled style
}

// <button> buttons extensions
export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "href"> {
  onClick?: (e: MouseEvent<HTMLButtonElement>) => Promise<void> | void;
  disabled?: boolean; // fixates disabled attribute and style
}

/**
 * This abstracts the html away from the concept of a "button".
 *
 * - <Button href="https://www.example.com">Link Text</Button>
 * - <Button href="/local/page">Link text</Button>
 * - <Button onClick={() => alert("hi")}>Button text</Button>
 * - <Button type="submit">Submit text</Button>
 *
 * All those 4 example create fairly different html but look and feel the same.
 * Also, onClick handlers, that return a promise, will disable the button until it resolves.
 *
 * Don't use this for inline links, use {@see Link} instead.
 */
export const Button = forwardRef(function Button(
  { onClick, disabled, className, ...props }: LinkProps | ButtonProps,
  ref: ForwardedRef<HTMLAnchorElement> | ForwardedRef<HTMLButtonElement>
): ReactElement {
  const [busy, setBusy] = useState(false);
  const isDisabled = disabled || busy;

  // if onClick returns a promise, then disable the button until the promise resolves
  if (onClick !== undefined) {
    const originalClickHandler = onClick;
    onClick = (event: any) => {
      const promise = originalClickHandler(event);
      if (promise && "finally" in promise) {
        setBusy(true);
        promise.finally(() => {
          setBusy(false);
        });
      }
    };
  }

  const classes = classNames(className, {
    "opacity-75 pointer-events-none cursor-not-allowed": isDisabled,
  });

  if ("href" in props) {
    return (
      <Link
        {...props}
        role={props.role ?? "button"}
        ref={ref as ForwardedRef<HTMLAnchorElement>}
        prefetch={props.prefetch ?? !isDisabled}
        href={isDisabled ? undefined : props.href}
        onClick={isDisabled ? undefined : (onClick as LinkProps["onClick"])}
        className={classes}
        aria-busy={busy ? true : undefined}
        aria-disabled={isDisabled ? true : undefined}
      />
    );
  } else {
    return (
      <button
        {...props}
        type={props.type ?? "button"}
        ref={ref as ForwardedRef<HTMLButtonElement>}
        onClick={isDisabled ? undefined : (onClick as ButtonProps["onClick"])}
        className={classes}
        aria-busy={busy ? true : undefined}
        disabled={isDisabled ? true : undefined}
      />
    );
  }
});
