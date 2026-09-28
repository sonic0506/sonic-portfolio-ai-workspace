import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // 높이 32~36px, 13px Wanted Sans 500, radius 6px. 그림자·스케일 효과 없음.
  "group/button inline-flex shrink-0 items-center justify-center gap-2.5 rounded-md border border-transparent font-display text-sm font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // 악센트 채움은 화면 면적 5% 예산 안에서 primary 액션에만 쓴다.
        default: 'bg-primary text-primary-foreground hover:bg-accent-hover',
        outline:
          'border-border bg-transparent text-foreground hover:border-border-hi hover:bg-surface-hi aria-expanded:bg-surface-hi',
        secondary:
          'bg-surface text-foreground hover:bg-surface-hi aria-expanded:bg-surface-hi',
        ghost:
          'bg-transparent text-text-2 hover:bg-surface-hi hover:text-foreground aria-expanded:bg-surface-hi aria-expanded:text-foreground',
        destructive:
          'bg-transparent text-destructive hover:bg-destructive/12 focus-visible:ring-destructive',
        link: 'text-accent-text underline-offset-4 hover:underline',
      },
      size: {
        default:
          'h-9 px-3 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5',
        xs: "h-6 gap-1.5 rounded-xs px-2 text-2xs in-data-[slot=button-group]:rounded-xs [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-8 px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        lg: 'h-9 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3',
        icon: 'size-9 gap-0',
        'icon-xs':
          "size-6 gap-0 rounded-xs in-data-[slot=button-group]:rounded-xs [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8 gap-0 in-data-[slot=button-group]:rounded-md',
        'icon-lg': 'size-9 gap-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
