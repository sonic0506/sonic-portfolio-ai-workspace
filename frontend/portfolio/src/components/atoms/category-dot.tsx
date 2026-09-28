import { cn } from '@/lib/utils';

/**
 * 카테고리 색을 쓰는 유일한 자리. 색은 서버(category.color)가 정한다.
 * 글자에 쓰지 않으므로 라이트·다크 대비를 따로 맞추지 않는다.
 * 8px 원이라 radius 4px면 원이 되므로 rounded-full을 쓰지 않는다.
 */
export function CategoryDot({ color, className }: { color: string | null | undefined; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('size-2 shrink-0 rounded-[4px] bg-cat-default', className)}
      style={color ? { backgroundColor: color } : undefined}
    />
  );
}
