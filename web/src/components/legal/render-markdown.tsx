import Link from "next/link";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

const linkClass =
  "font-medium text-[#FF6B35] underline underline-offset-2 hover:text-[#e85f2d]";

const components: Components = {
  h1: ({ children }) => (
    <h1 className="mt-10 text-balance text-3xl font-semibold tracking-tight text-foreground first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-10 scroll-mt-24 text-balance border-b border-white/10 pb-2 text-xl font-semibold tracking-tight text-foreground first:mt-6">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-6 text-lg font-semibold text-foreground">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  ul: ({ children }) => (
    <ul className="mt-4 list-inside list-disc space-y-2 text-muted-foreground">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-4 list-inside list-decimal space-y-2 text-muted-foreground">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  hr: () => <hr className="my-10 border-white/10" />,
  blockquote: ({ children }) => (
    <blockquote className="mt-4 border-l-4 border-[#FF6B35]/50 bg-white/[0.03] py-3 pl-4 pr-2 text-sm text-muted-foreground">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => {
    if (href?.startsWith("/")) {
      return (
        <Link href={href} className={linkClass}>
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        className={linkClass}
        target={href?.startsWith("mailto:") ? undefined : "_blank"}
        rel={
          href?.startsWith("mailto:") ? undefined : "noopener noreferrer"
        }
      >
        {children}
      </a>
    );
  },
};

type RenderMarkdownProps = {
  content: string;
  /** Extra class on wrapper */
  className?: string;
};

export function RenderMarkdown({ content, className }: RenderMarkdownProps) {
  return (
    <div className={className}>
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
