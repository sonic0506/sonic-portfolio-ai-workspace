import type { ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkCjkFriendly from "remark-cjk-friendly";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./code-block";
import { remarkQuestions } from "./remark-questions";

/** 목차와 본문 제목이 같은 id를 쓰도록 텍스트에서 만든다. 한글은 그대로 둔다. */
export function headingId(text: string): string {
  return `h-${text.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "")}`;
}

function text(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(text).join("");
  return "";
}

export const linkClass = "text-accent-text hover:underline";

/** 본문 링크 기본값. 내부 문서는 같은 탭, 바깥은 새 탭. 포트폴리오는 next/link로 바꿔 끼운다. */
function InlineLink({ href = "", children }: { href?: string; children?: ReactNode }) {
  const external = !href.startsWith("/");
  return (
    <a href={href} className={linkClass} {...(external && { target: "_blank", rel: "noreferrer" })}>
      {children}
    </a>
  );
}

/** `:::questions` 기본 표시(어드민 미리보기). 포트폴리오는 누르면 대화를 여는 버튼으로 바꿔 끼운다. */
function QuestionsPreview({ questions }: { questions: string[] }) {
  if (!questions.length) return null;
  return (
    <div className="my-7">
      <p className="mb-2.5 font-mono text-2xs text-text-3">이 내용에 대해 물어보기</p>
      <div className="flex flex-wrap gap-2">
        {questions.map((q) => (
          <span key={q} className="rounded-md border border-border px-3 py-1.5 text-sm text-text-2">
            {q}
          </span>
        ))}
      </div>
    </div>
  );
}

export type MarkdownSlots = {
  Link?: (props: { href?: string; children?: ReactNode }) => ReactNode;
  Questions?: (props: { questions: string[] }) => ReactNode;
};

/*
 * sonic 위키 본문 스타일(wiki-prose)을 react-markdown 요소에 입힌다.
 * 본문 전체가 Pretendard 16px/1.75, 데이터·코드만 mono다.
 */
function components({ Link = InlineLink, Questions = QuestionsPreview }: MarkdownSlots): Components {
  return {
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
    a: ({ href, children }) => <Link href={href}>{children}</Link>,
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
      typeof src === "string" ? <img src={src} alt={alt ?? ""} className="my-6 rounded-md border border-border" /> : null,
    "suggested-questions": ({ questions }: { questions?: string }) => (
      <Questions questions={questions ? (JSON.parse(questions) as string[]) : []} />
    ),
  } as Components;
}

const defaults = components({});

/** 포트폴리오 본문과 어드민 미리보기가 함께 쓰는 마크다운 렌더러. */
export function Markdown({ children, className = "", slots }: { children: string; className?: string; slots?: MarkdownSlots }) {
  return (
    <div className={`font-body text-base leading-[1.75] text-text-1 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkCjkFriendly, remarkDirective, remarkQuestions]}
        components={slots ? components(slots) : defaults}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
