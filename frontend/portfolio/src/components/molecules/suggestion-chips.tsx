'use client';

import { CornerDownRight } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  className?: string;
}

/** 컴포저 바로 위에 놓이는 질문 제안. 누르면 입력창에 문구가 들어간다. */
export function SuggestionChips({
  suggestions,
  onSelect,
  className,
}: SuggestionChipsProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onSelect(suggestion)}
          className="inline-flex items-center gap-2.5 rounded-md border border-border bg-transparent px-3 py-[7px] font-display text-sm text-text-2 transition-colors hover:border-border-hi hover:bg-surface-hi hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <CornerDownRight
            className="size-3.5 shrink-0 text-text-3"
            strokeWidth={1.5}
          />
          <span className="truncate">{suggestion}</span>
        </button>
      ))}
    </div>
  );
}
