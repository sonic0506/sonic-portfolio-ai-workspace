import { cn } from '@/lib/utils';

/**
 * 스택 이름은 데이터 문자열이라 mono. 브랜드 색도 아이콘도 붙이지 않고
 * 보더 하나로만 구분한다.
 */
export function StackTag({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <li
      className={cn(
        'inline-flex items-center rounded-xs border border-border px-2 py-[3px] font-mono text-2xs text-text-2',
        className,
      )}
    >
      {children}
    </li>
  );
}
