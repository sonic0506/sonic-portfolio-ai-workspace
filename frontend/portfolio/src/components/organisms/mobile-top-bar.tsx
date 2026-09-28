'use client';

import { PanelLeft } from 'lucide-react';

import { useSidebar } from '@/components/ui/sidebar';
import { SITE_NAME } from '@/lib/site';

/**
 * 768px 미만에서는 사이드바가 드로어로 빠지므로, 이 막대가 유일한 진입점이다.
 * 터치 타깃은 44px을 지킨다.
 */
export function MobileTopBar() {
  const { toggleSidebar } = useSidebar();

  return (
    <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-3 md:hidden">
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label="메뉴 열기"
        className="flex size-11 shrink-0 items-center justify-center rounded-md text-text-2 transition-colors hover:bg-surface-hi hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <PanelLeft className="size-4" strokeWidth={1.5} />
      </button>
      <span className="font-display text-md font-semibold tracking-[-0.02em]">{SITE_NAME}</span>
    </div>
  );
}
