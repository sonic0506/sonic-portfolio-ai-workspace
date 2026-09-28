import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * 프로즈 안의 수치. 본문 흐름을 깨지 않도록 상대 크기(0.85em)로 두고,
 * tracking은 globals.css의 .font-mono 규칙이 붙인다.
 */
export function Mono({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn('font-mono text-[0.85em]', className)}>{children}</span>
  );
}
