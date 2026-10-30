import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Markdown({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn('prose-legal', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            const url = href || '#';
            if (url.startsWith('/')) return <Link href={url}>{children}</Link>;
            return <a href={url} target="_blank" rel="noopener noreferrer">{children}</a>;
          },
        }}
      >{content}</ReactMarkdown>
    </div>
  );
}
