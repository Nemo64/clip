import classNames from "classnames";
import ReactMarkdown from 'react-markdown';
import {Link} from "./link";

const components: Parameters<typeof ReactMarkdown>[0]["components"] = {
  h2: ({node, className, ...props}) => <h2 className={classNames('my-4 text-2xl font-semibold', className)} {...props}/>,
  a: ({node, href, ref, ...props}) => <Link href={href} ref={ref as any} {...props} />,
  p: ({node, className, ...props}) => <p className={classNames('my-4', className)} {...props} />,
  ul: ({node, className, ...props}) => <ul className={classNames('my-4 pl-8 list-disc', className)} {...props} />,
};

export function Markdown({children, ...props}: Omit<Parameters<typeof ReactMarkdown>[0], "components">) {
  return (
    <ReactMarkdown components={components} {...props}>
      {children}
    </ReactMarkdown>
  );
}
