import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  // 태그는 radius 4px + JetBrains Mono 11px. 데이터이므로 mono를 쓴다.
  'group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-xs border border-transparent px-1.5 font-mono text-2xs font-medium tracking-[0.02em] whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&>svg]:pointer-events-none [&>svg]:size-3!',
  {
    variants: {
      variant: {
        default: 'bg-surface-hi text-text-2 [a]:hover:text-foreground',
        secondary: 'bg-surface text-text-2 [a]:hover:text-foreground',
        destructive: 'bg-danger/12 text-danger',
        outline: 'border-border text-text-2 [a]:hover:border-border-hi',
        ghost: 'text-text-3 [a]:hover:text-text-2',
        // 카테고리 색은 글자에 쓰지 않는다(라이트 대비 부족). CategoryDot으로만 표시한다.
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
