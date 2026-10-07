'use client';

import { NodeMark } from '@/components/atoms/node-mark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { GraphNodeType } from '@/lib/graph';
import { GRAPH_TYPES, GRAPH_TYPE_LABEL } from '@/lib/graph';
import { cn } from '@/lib/utils';

/**
 * 캔버스 좌상단에 얹는 필터. 검색은 노드를 지우지 않고 디밍만 하고, 토글은
 * 종류째 그래프에서 뺀다.
 */
export function GraphFilterCard({
  query,
  onQueryChange,
  hidden,
  counts,
  onToggle,
  onReset,
  className,
}: {
  query: string;
  onQueryChange: (query: string) => void;
  hidden: Set<GraphNodeType>;
  counts: Record<GraphNodeType, number>;
  onToggle: (type: GraphNodeType) => void;
  onReset: () => void;
  className?: string;
}) {
  return (
    <div className={cn('w-50 rounded-lg border border-border bg-surface p-3', className)}>
      {/* 포커스는 ring이 아니라 보더 색으로 알린다. */}
      <Input
        type="text"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="노드 검색"
        aria-label="노드 검색"
        className="h-8 bg-bg focus-visible:border-border-hi focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      <div className="mt-3 h-px bg-border" />
      <ul className="mt-2 flex flex-col">
        {GRAPH_TYPES.map((type) => {
          const off = hidden.has(type);
          return (
            <li key={type}>
              <button
                type="button"
                onClick={() => onToggle(type)}
                aria-pressed={!off}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-surface-hi focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span className="flex size-2 items-center justify-center">
                  {/* 블로그·카테고리는 색이 여럿이라 모양만 보이고 색은 기본 회색이다. */}
                  <NodeMark type={type} off={off} />
                </span>
                <span className={cn('min-w-0 flex-1 truncate text-sm transition-colors', off ? 'text-text-3' : 'text-text-1')}>
                  {GRAPH_TYPE_LABEL[type]}
                </span>
                {/* 카운트는 데이터라 mono. */}
                <span className="shrink-0 font-mono text-2xs text-text-3">{counts[type]}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <Button variant="ghost" size="sm" onClick={onReset} className="mt-1 h-8 w-full justify-start px-2">
        전체 보기
      </Button>
    </div>
  );
}
