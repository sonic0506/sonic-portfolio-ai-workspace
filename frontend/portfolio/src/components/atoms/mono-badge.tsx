import { cn } from '@/lib/utils';

/**
 * 상태·NDA처럼 카드 끝에 붙는 짧은 데이터 라벨. 전부 mono 11px에 보더 하나로만
 * 산다. 진행 상태나 계약 조건을 색으로 나누지 않는다.
 */
export function MonoBadge({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-xs border border-border-hi px-2 py-[3px] font-mono text-2xs text-text-2',
        className,
      )}
    >
      {children}
    </span>
  );
}
