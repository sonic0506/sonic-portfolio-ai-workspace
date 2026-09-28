import type { ReactNode } from 'react';

import { AppSidebar } from '@/components/organisms/app-sidebar';
import { MobileTopBar } from '@/components/organisms/mobile-top-bar';
import { SidebarProvider } from '@/components/ui/sidebar';
import type { CategoryCount } from '@/lib/types';

/**
 * 모든 페이지가 공유하는 셸. 사이드바(240px / 64px 레일 / 드로어)와 본문 열의
 * 골격만 담고, 무엇을 그릴지는 children이 정한다.
 */
export function AppShell({ categories, children }: { categories: CategoryCount[]; children: ReactNode }) {
  return (
    <SidebarProvider className="h-full w-full overflow-hidden">
      <AppSidebar categories={categories} />
      {/* 레이어는 배경 밝기 차 + 1px 보더로만 구분한다. */}
      <div className="flex h-full min-w-0 flex-1 flex-col border-border md:border-l">
        <MobileTopBar />
        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </SidebarProvider>
  );
}
