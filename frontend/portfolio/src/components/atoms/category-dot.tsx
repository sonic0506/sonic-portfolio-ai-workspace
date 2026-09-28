import { categoryDotClass } from '@/lib/categories';
import { cn } from '@/lib/utils';

/**
 * 카테고리 색을 쓰는 유일한 자리. 8px 원이라 radius 4px면 원이 되므로
 * rounded-full을 쓰지 않는다.
 */
export function CategoryDot({
  code,
  className,
}: {
  code: string | null | undefined;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn('size-2 shrink-0 rounded-[4px]', categoryDotClass(code), className)}
    />
  );
}
