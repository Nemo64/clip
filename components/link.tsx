import NextLink from "next/link";
import { AnchorHTMLAttributes, ForwardedRef, forwardRef } from "react";
import classNames from "classnames";

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
  { href, prefetch, ...props }: LinkProps,
  ref: ForwardedRef<HTMLAnchorElement>
) {
  if (!href?.startsWith("/") && !href?.startsWith("#")) {
    return (
      // eslint-disable-next-line react/jsx-no-target-blank
      <a
        href={href}
        target="_blank"
        rel={classNames("noopener", props.rel)}
        {...props}
        ref={ref}
      />
    );
  }

  return (
    <NextLink href={href} prefetch={prefetch ? undefined : false}>
      <a ref={ref} {...props} />
    </NextLink>
  );
});
