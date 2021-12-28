import NextLink from "next/link";
import {AnchorHTMLAttributes, ForwardedRef, forwardRef} from "react";

// <a href> buttons extensions
export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string | undefined;
  prefetch?: boolean;
}

/**
 * This component abstracts away the plain html <a href=""></a> element.
 *
 * - all links get rel="noreferrer" to ensure opener and refererrer aren't leaked.
 * - remote links (or links that do not start with "/") will get target="_blank".
 * - local links will be wrapped by the next.js {@see NextLink} component.
 */
export const Link = forwardRef(function Link(
  {href, prefetch, ...props}: LinkProps,
  ref: ForwardedRef<HTMLAnchorElement>,
) {
  if (!href?.startsWith('/')) {
    return (
      <a rel="noreferrer" ref={ref} href={href} target="_blank" {...props}/>
    );
  }

  return (
    <NextLink href={href} prefetch={prefetch ? undefined : false}>
      <a rel="noreferrer" ref={ref} {...props}/>
    </NextLink>
  );
});
