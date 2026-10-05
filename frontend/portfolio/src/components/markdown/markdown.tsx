import type { ReactNode } from "react";
import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkCjkFriendly from "remark-cjk-friendly";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import { SuggestedQuestions } from "@/components/chat/suggested-questions";
import { CodeBlock } from "@/components/molecules/code-block";
import { headingId } from "@/lib/headings";
import { cn } from "@/lib/utils";
import { remarkQuestions } from "./remark-questions";

function text(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(text).join("");
  return "";
}

/** 본문 링크. 내부 문서는 클라이언트 이동, 바깥은 새 탭. */
function InlineLink({ href = "", children }: { href?: string; children?: ReactNode }) {
  const style = "text-accent-text hover:underline";
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={style}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noreferrer" className={style}>
      {children}
    </a>
  );
}

/*
 * sonic 위키 본문 스타일(wiki-prose)을 react-markdown 요소에 입힌다.
 * 본문 전체가 Pretendard 16px/1.75, 데이터·코드만 mono다.
 */
const components = {
  h2: ({ children }) => (
    <h2 id={headingId(text(children))} className="mt-14 mb-4 scroll-mt-6 font-display text-lg font-medium tracking-[-0.02em]">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      id={headingId(text(children))}
      className="mt-8 mb-3 scroll-mt-6 font-display text-base leading-normal font-semibold tracking-[-0.02em]"
    >
      {children}
    </h3>
  ),
  h4: ({ children }) => <h4 className="mt-6 mb-2 font-display text-md font-semibold">{children}</h4>,
  p: ({ children }) => <p className="my-6 break-keep">{children}</p>,
  a: ({ href, children }) => <InlineLink href={href}>{children}</InlineLink>,
  // 700은 쓰지 않는다. 강조는 500까지다.
  strong: ({ children }) => <strong className="font-medium text-text-1">{children}</strong>,
  ul: ({ children }) => <ul className="my-6 flex list-outside list-disc flex-col gap-2 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-6 flex list-outside list-decimal flex-col gap-2 pl-5">{children}</ol>,
  li: ({ children }) => <li className="break-keep marker:text-text-3 [&>ol]:my-2 [&>ul]:my-2">{children}</li>,
  // 좌측 2px accent-line. 인용을 표시하는 유일한 방법이다.
  blockquote: ({ children }) => (
    <blockquote className="my-6 border-l-2 border-accent-line pl-4 text-text-2 [&>p]:my-3">{children}</blockquote>
  ),
  hr: () => <hr className="my-10 border-border" />,
  // 펜스 코드는 CodeBlock이 <pre>까지 그린다. 여기서는 감싸지 않는다.
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children }) => {
    const lang = /language-(\S+)/.exec(className ?? "")?.[1] ?? null;
    const value = text(children);
    // 펜스 코드는 언어가 있거나 줄바꿈으로 끝난다. 나머지는 인라인이다.
    if (lang || value.endsWith("\n")) return <CodeBlock code={value.replace(/\n$/, "")} lang={lang} />;
    return <code className="rounded-xs bg-surface px-1 py-px font-mono text-sm">{children}</code>;
  },
  // 좁은 화면에서 표만 가로로 흐르게 한다. 페이지는 흔들지 않는다.
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse text-left">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-surface">{children}</thead>,
  th: ({ children }) => (
    <th scope="col" className="border-b border-border px-3 py-2.5 align-top text-sm font-medium text-text-2">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border-b border-border px-3 py-2.5 align-top text-md">{children}</td>,
  img: ({ src, alt }) =>
    // 본문 이미지는 외부 주소라 next/image 최적화 대상이 아니다.
    // eslint-disable-next-line @next/next/no-img-element
    typeof src === "string" ? <img src={src} alt={alt ?? ""} className="my-6 rounded-md border border-border" /> : null,
  "suggested-questions": ({ questions }: { questions?: string }) => (
    <SuggestedQuestions questions={questions ? (JSON.parse(questions) as string[]) : []} />
  ),
} as Components;

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("font-body text-base leading-[1.75] text-text-1", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkCjkFriendly, remarkDirective, remarkQuestions]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
