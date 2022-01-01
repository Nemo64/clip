import {Link} from "./link";
import ReactMarkdown from 'react-markdown';

const components: Parameters<typeof ReactMarkdown>[0]["components"] = {
  a({node, href, ...props}) {
    // @ts-ignore
    return href ? <Link href={href} {...props} /> : <a {...props} />;
  },
  p({node, className, ...props}) {
    // @ts-ignore
    return <p className={`my-4 ${className}`} {...props} />;
  },
}

export function Markdown({children, ...props}: Omit<Parameters<typeof ReactMarkdown>[0], "components">) {
  return (
    <ReactMarkdown components={components} {...props}>
      {children}
    </ReactMarkdown>
  )
}
