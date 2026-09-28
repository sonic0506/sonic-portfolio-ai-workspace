import * as React from 'react';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

/**
 * 시그니처 스레드. 관련 문서·백링크 목록을 accent-line 세로 스템과 ㄴ자 분기로
 * 잇는다. 스템과 분기 획은 globals.css의 [data-slot='thread'] 규칙이 그린다.
 */
function Thread({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="thread"
      className={cn('flex flex-col', className)}
      {...props}
    />
  );
}

function ThreadItem({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      data-slot="thread-item"
      className={cn('flex min-h-8 items-center', className)}
      {...props}
    />
  );
}

/** 스레드 항목 안의 링크. 링크 색은 accent-text 하나로 통일한다. */
function ThreadLink({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<'a'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'a';

  return (
    <Comp
      data-slot="thread-link"
      className={cn(
        'inline-flex items-center gap-2.5 rounded-md py-1 text-sm text-accent-text transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
      {...props}
    />
  );
}

export { Thread, ThreadItem, ThreadLink };
