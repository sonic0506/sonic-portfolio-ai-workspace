'use client';

import { CornerDownRight } from 'lucide-react';

import { CategoryDot } from '@/components/atoms/category-dot';
import { useAskChat } from '@/hooks/use-ask-chat';
import type { Category } from '@/lib/types';

/** 우측 aside의 글 정보. 수치는 전부 글과 참고 관계에서 세어 온 값이다. */
export function PostInfoCard({
  title,
  category,
  facts,
}: {
  title: string;
  category: Category | null;
  facts: string[];
}) {
  const askChat = useAskChat();

  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      {category && (
        <h2 className="mb-3 flex items-center gap-2">
          {/* 카테고리 색은 이 점에서만 쓴다. */}
          <CategoryDot color={category.color} />
          <span className="min-w-0 truncate text-sm font-medium">{category.name}</span>
        </h2>
      )}

      {/* 날짜·시간·개수는 전부 데이터라 mono. */}
      <ul className="flex flex-col gap-1.5 font-mono text-2xs text-text-2">
        {facts.map((fact) => (
          <li key={fact}>{fact}</li>
        ))}
      </ul>

      <div className="my-3.5 h-px bg-border" />

      <button
        type="button"
        onClick={() => askChat(`"${title}" 글을 요약해줘`)}
        className="-mx-2 flex w-[calc(100%+16px)] cursor-pointer items-center gap-2 rounded-md px-2 py-[7px] text-left text-sm text-text-2 transition-colors hover:bg-surface-hi hover:text-text-1"
      >
        <CornerDownRight className="size-3.5 shrink-0 text-text-3" strokeWidth={1.5} />이 글 요약해줘
      </button>
    </section>
  );
}
