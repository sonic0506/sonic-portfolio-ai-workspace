'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import { DocToc, DocTocCollapsible } from '@/components/molecules/doc-toc';
import type { DocHeading } from '@/lib/headings';

/** 뷰포트 상단에서 이만큼 지난 마지막 헤딩을 활성으로 본다. */
const SPY_OFFSET = 120;
/** 목차를 눌러 이동할 때 헤딩 위에 남길 여백. */
const JUMP_OFFSET = 32;

/**
 * 프로젝트·블로그 상세가 함께 쓰는 틀. 본문(서버 렌더)은 children으로 받고,
 * 이 컴포넌트는 스크롤 컨테이너·스크롤스파이 목차·우측 aside만 맡는다.
 */
export function DocLayout({
  headings,
  header,
  aside,
  children,
}: {
  headings: DocHeading[];
  /** 본문 위(뒤로 가기·제목·메타). 목차 접이식은 이 아래에 끼운다. */
  header: ReactNode;
  /** 목차 아래 카드. 1024px 미만에서는 그리지 않는다. */
  aside?: ReactNode;
  children: ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // 문서가 바뀌면 page의 key로 다시 마운트되어 이전 문서의 활성 항목이 남지 않는다.
  const [activeId, setActiveId] = useState(headings[0]?.id ?? '');

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || headings.length === 0) return;

    const onScroll = () => {
      // 맨 아래에 닿으면 마지막 헤딩이 짧아도 활성으로 본다.
      if (element.scrollHeight - element.scrollTop - element.clientHeight < 4) {
        setActiveId(headings[headings.length - 1].id);
        return;
      }
      let current = headings[0].id;
      for (const heading of headings) {
        const node = document.getElementById(heading.id);
        if (node && element.scrollTop >= node.offsetTop - SPY_OFFSET) current = heading.id;
      }
      setActiveId(current);
    };

    element.addEventListener('scroll', onScroll, { passive: true });
    return () => element.removeEventListener('scroll', onScroll);
  }, [headings]);

  const jumpTo = useCallback((id: string) => {
    const element = scrollRef.current;
    const node = document.getElementById(id);
    if (!element || !node) return;
    setActiveId(id);
    // 움직임을 줄이도록 설정했다면 애니메이션 없이 곧바로 옮긴다.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    element.scrollTo({ top: node.offsetTop - JUMP_OFFSET, behavior: reduced ? 'auto' : 'smooth' });
  }, []);

  const hasToc = headings.length > 0;

  return (
    // 스크롤스파이 기준이자 offsetTop의 기준점이라 이 컨테이너가 relative다.
    <div ref={scrollRef} className="relative h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[1068px] items-start gap-12 px-6 pt-10 pb-20 sm:px-10">
        <article className="max-w-[720px] min-w-0 flex-1">
          {header}

          <div className="mt-6 h-px bg-border" />

          {/* aside가 사라지는 폭에서는 목차가 본문 위 접이식으로 내려온다. */}
          {hasToc && (
            <DocTocCollapsible headings={headings} activeId={activeId} onSelect={jumpTo} className="mt-6 lg:hidden" />
          )}

          {children}
        </article>

        {(hasToc || aside) && (
          <aside className="sticky top-0 hidden w-aside shrink-0 flex-col lg:flex">
            {hasToc && (
              <>
                <DocToc headings={headings} activeId={activeId} onSelect={jumpTo} />
                {aside && <div className="my-5 h-px bg-border" />}
              </>
            )}
            {aside}
          </aside>
        )}
      </div>
    </div>
  );
}
