'use client';

import { ChevronDown } from 'lucide-react';
import { useEffect, useRef } from 'react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { DocHeading } from '@/lib/headings';

export interface DocTocProps {
  /** h2·h3만 온다. 순서가 곧 본문 순서다. */
  headings: DocHeading[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
}

/** 활성 표시는 좌측 2px 악센트 바와 글자색뿐이다. 배경을 칠하지 않는다. */
function TocList({ headings, activeId, onSelect }: DocTocProps) {
  return (
    <ul className="flex flex-col">
      {headings.map((heading) => {
        const active = heading.id === activeId;

        return (
          <li key={heading.id}>
            <button
              type="button"
              onClick={() => onSelect(heading.id)}
              aria-current={active ? 'true' : undefined}
              className={cn(
                'flex w-full cursor-pointer border-l-2 py-[5px] text-left text-sm leading-[1.5] transition-colors',
                heading.level === 3 ? 'pl-6' : 'pl-3',
                active
                  ? 'border-accent text-accent-text'
                  : 'border-transparent text-text-3 hover:text-text-1',
              )}
            >
              {heading.text}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** 우측 aside의 목차. 1024px 이상에서만 그린다. */
export function DocToc({ className, ...props }: DocTocProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // 목차가 aside 높이를 넘어 안에서 스크롤될 때, 본문을 따라 바뀐 활성 항목이 목차 밖으로 숨지 않게 한다.
  // scrollIntoView는 본문 스크롤 컨테이너까지 움직이므로 목차 상자만 직접 옮긴다.
  useEffect(() => {
    const list = listRef.current;
    const item = list?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!list || !item) return;
    const top = item.offsetTop - list.offsetTop;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (top + item.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = top + item.offsetHeight - list.clientHeight;
    }
  }, [props.activeId]);

  return (
    <nav className={cn('flex min-h-0 flex-col', className)}>
      <span className="mb-2.5 shrink-0 pl-3 font-mono text-2xs text-text-3">목차</span>
      <div ref={listRef} className="min-h-0 overflow-y-auto">
        <TocList {...props} />
      </div>
    </nav>
  );
}

/** aside가 사라지는 폭에서는 본문 위 접이식으로 내려온다. */
export function DocTocCollapsible({
  className,
  ...props
}: DocTocProps) {
  return (
    <Collapsible
      className={cn('rounded-md border border-border bg-surface', className)}
    >
      <CollapsibleTrigger className="group flex w-full cursor-pointer items-center justify-between px-3.5 py-2.5 text-sm text-text-2 transition-colors hover:text-text-1">
        목차
        <ChevronDown
          className="size-4 shrink-0 text-text-3 transition-transform group-data-[state=open]:rotate-180"
          strokeWidth={1.5}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3.5 pb-3">
        <TocList {...props} />
      </CollapsibleContent>
    </Collapsible>
  );
}
