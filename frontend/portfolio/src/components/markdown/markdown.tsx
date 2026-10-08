import type { ReactNode } from "react";
import Link from "next/link";
import { Markdown as SharedMarkdown, linkClass } from "@portfolio/markdown";
import { SuggestedQuestions } from "@/components/chat/suggested-questions";

/** 본문 링크. 내부 문서는 클라이언트 이동, 바깥은 새 탭. */
function InlineLink({ href = "", children }: { href?: string; children?: ReactNode }) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={linkClass}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noreferrer" className={linkClass}>
      {children}
    </a>
  );
}

const slots = { Link: InlineLink, Questions: SuggestedQuestions };

/** 렌더러는 어드민 미리보기와 공유한다(`frontend/markdown`). 여기서는 사이트 전용 링크·추천 질문만 끼운다. */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <SharedMarkdown className={className} slots={slots}>
      {children}
    </SharedMarkdown>
  );
}
