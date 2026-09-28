import { StackTag } from '@/components/atoms/stack-tag';
import { cn } from '@/lib/utils';

export interface StackTagsProps {
  stack: string[];
  /** 넘치는 스택은 개수로 접는다. 줄이 늘어나면 카드 리듬이 무너진다. */
  max?: number;
  className?: string;
}

export function StackTags({ stack, max = 5, className }: StackTagsProps) {
  // 스택 확인 전인 항목은 빈 줄을 남기지 않는다.
  if (stack.length === 0) return null;

  const visible = stack.slice(0, max);
  const rest = stack.length - visible.length;

  return (
    <ul className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {visible.map((item) => (
        <StackTag key={item}>{item}</StackTag>
      ))}
      {rest > 0 && (
        <StackTag className="border-transparent text-text-3">{`+${rest}`}</StackTag>
      )}
    </ul>
  );
}
