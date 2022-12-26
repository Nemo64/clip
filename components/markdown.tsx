import classNames from "classnames";
import ReactMarkdown from "react-markdown";
import { Link } from "./link";

const components: Parameters<typeof ReactMarkdown>[0]["components"] = {
  h2: ({ node, className, ...props }) => (
    <h2
      className={classNames("my-4 text-2xl font-semibold", className)}
      {...props}
    />
  ),
  a: ({ node, className, href, ...props }) => (
    <Link
      className={classNames("my-4 text-red-800 hover:text-red-700", className)}
      href={href}
      {...props}
    />
  ),
  p: ({ node, className, ...props }) => (
    <p className={classNames("my-4", className)} {...props} />
  ),
  ul: ({ node, className, ordered, ...props }) => (
    <ul className={classNames("my-4 pl-8 list-disc", className)} {...props} />
  ),
};

export type MarkdownProps = Omit<
  Parameters<typeof ReactMarkdown>[0],
  "components"
>;

export function Markdown({ children, ...props }: MarkdownProps) {
  return (
    <ReactMarkdown components={components} {...props}>
      {children}
    </ReactMarkdown>
  );
}
