import classNames from "classnames";
import {Link} from "./link";
import ReactMarkdown from 'react-markdown';

const components: Parameters<typeof ReactMarkdown>[0]["components"] = {
  h2({node, className, ...props}) {
    return <h2 className={classNames('my-4 text-xl font-semibold', className)} {...props}/>;
  },
  a({node, href, ...props}) {
    // @ts-ignore
    return href ? <Link href={href} {...props} /> : <a {...props} />;
  },
  p({node, className, ...props}) {
    return <p className={classNames('my-4', className)} {...props} />;
  },
  ul({node, className, ...props}) {
    return <ul className={classNames('my-4 pl-8 list-disc', className)} {...props} />;
  },
}

export function Markdown({children, ...props}: Omit<Parameters<typeof ReactMarkdown>[0], "components">) {
  return (
    <ReactMarkdown components={components} {...props}>
      {children}
    </ReactMarkdown>
  )
}
