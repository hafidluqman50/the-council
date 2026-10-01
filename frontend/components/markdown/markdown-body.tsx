import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { CSSProperties } from "react";

export function MarkdownBody({
  children,
  className = "",
  style,
}: {
  children: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`space-y-3 text-[16px] leading-[1.55] text-slate [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 ${className}`}
      style={style}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children: kids }) => <p className="m-0" style={{ textWrap: "pretty" }}>{kids}</p>,
          strong: ({ children: kids }) => <strong className="font-semibold text-ink">{kids}</strong>,
          em: ({ children: kids }) => <em className="italic">{kids}</em>,
          a: ({ children: kids, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-ink underline underline-offset-2">
              {kids}
            </a>
          ),
          ul: ({ children: kids }) => <ul className="ml-5 list-disc space-y-1">{kids}</ul>,
          ol: ({ children: kids }) => <ol className="ml-5 list-decimal space-y-1">{kids}</ol>,
          li: ({ children: kids }) => <li>{kids}</li>,
          blockquote: ({ children: kids }) => (
            <blockquote className="border-l-2 py-0.5 pl-3.5 text-[14px] leading-[1.5]" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
              {kids}
            </blockquote>
          ),
          code: ({ children: kids }) => (
            <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[13px] text-ink">
              {kids}
            </code>
          ),
          h1: ({ children: kids }) => <p className="m-0 text-lg font-semibold text-ink">{kids}</p>,
          h2: ({ children: kids }) => <p className="m-0 text-base font-semibold text-ink">{kids}</p>,
          h3: ({ children: kids }) => <p className="m-0 text-base font-semibold text-ink">{kids}</p>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
