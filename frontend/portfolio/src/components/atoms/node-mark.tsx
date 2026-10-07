import type { GraphNodeType } from '@/lib/graph';
import { cn } from '@/lib/utils';

/**
 * 그래프 노드 모양의 작은 표식(6px). 캔버스와 같은 규칙이다:
 * 프로젝트 악센트 사각, 블로그 카테고리 색 원, 카테고리 색 테두리 원, 스킬 중립 마름모.
 */
export function NodeMark({
  type,
  color,
  off = false,
  className,
}: {
  type: GraphNodeType;
  color?: string | null;
  /** 필터에서 꺼진 상태. 색을 빼고 회색으로 둔다. */
  off?: boolean;
  className?: string;
}) {
  const tint = off ? undefined : (color ?? undefined);
  const base = 'size-1.5 shrink-0 transition-colors';

  switch (type) {
    case 'PROJECT':
      return <span aria-hidden="true" className={cn(base, 'rounded-[1px]', off ? 'bg-text-3' : 'bg-accent', className)} />;
    case 'CATEGORY':
      return (
        <span
          aria-hidden="true"
          className={cn(base, 'size-2 rounded-full border-2 border-cat-default', className)}
          style={tint ? { borderColor: tint } : undefined}
        />
      );
    case 'SKILL':
      return <span aria-hidden="true" className={cn(base, 'rotate-45 rounded-[1px]', off ? 'bg-text-3' : 'bg-text-2', className)} />;
    default:
      return (
        <span
          aria-hidden="true"
          className={cn(base, 'rounded-[3px]', 'bg-cat-default', className)}
          style={tint ? { backgroundColor: tint } : undefined}
        />
      );
  }
}
