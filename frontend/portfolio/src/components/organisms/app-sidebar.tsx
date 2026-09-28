'use client';

import { Suspense, type ComponentProps } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Archive, FileText, MessageSquarePlus, PanelLeftOpen, Sparkle, User, Waypoints } from 'lucide-react';

import { CategoryDot } from '@/components/atoms/category-dot';
import { ConversationItem } from '@/components/molecules/conversation-item';
import { ThemeToggle } from '@/components/molecules/theme-toggle';
import { useConversations } from '@/hooks/use-conversation';
import { useIsTablet } from '@/hooks/use-mobile';
import { deleteSession } from '@/lib/chat-api';
import { removeConversation, type StoredConversation } from '@/lib/chat-store';
import { SITE_NAME } from '@/lib/site';
import type { CategoryCount } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

const FEATURES = [
  { name: '소개', href: '/profile', icon: User },
  { name: '프로젝트', href: '/projects', icon: Archive },
  { name: '그래프', href: '/graph', icon: Waypoints },
];

type SidebarProps = ComponentProps<typeof Sidebar> & { categories: CategoryCount[] };

export function AppSidebar({ categories, className, ...props }: SidebarProps) {
  const { state, isMobile, toggleSidebar } = useSidebar();
  const isTablet = useIsTablet();
  const pathname = usePathname();
  const router = useRouter();
  // 대화 목록은 브라우저 저장소에서 온다. 24시간이 지난 대화는 저절로 빠진다.
  const conversations = useConversations();

  const handleDelete = (conversation: StoredConversation) => {
    removeConversation(conversation.id);
    void deleteSession(conversation);
    // 보고 있던 대화가 사라졌으면 새 대화 화면으로 물러난다.
    if (pathname === `/chat/${conversation.id}`) router.push('/');
  };

  // 태블릿 레일과 모바일 드로어는 펼침 상태를 바꿀 수 없다. 다시 펼 수 있을 때만
  // 펴는 아이콘을 두고, 그 밖에는 브랜드 마크를 보여준다.
  const canExpand = state === 'collapsed' && !isTablet && !isMobile;

  return (
    <Sidebar collapsible="icon" className={cn(className)} {...props}>
      {/* 레일에서도 본문 메뉴와 같은 12px 들여쓰기를 유지해야 아이콘 중심이 맞는다. */}
      <SidebarHeader className="gap-3 p-3 group-data-[collapsible=icon]:items-center">
        <div className="flex items-center gap-2.5 overflow-hidden">
          {canExpand ? (
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="사이드바 펼치기"
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border bg-surface text-text-2 transition-colors hover:border-border-hi hover:bg-surface-hi hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <PanelLeftOpen className="size-4" strokeWidth={1.5} />
            </button>
          ) : (
            <Link
              href="/"
              aria-label="홈"
              className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-text-1"
            >
              <Sparkle className="size-4 fill-current" strokeWidth={1.5} />
            </Link>
          )}
          <span className="min-w-0 truncate font-display text-md font-semibold tracking-[-0.02em] group-data-[collapsible=icon]:hidden">
            {SITE_NAME}
          </span>
          <SidebarTrigger className="ml-auto group-data-[collapsible=icon]:hidden" />
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="새 대화" isActive={pathname === '/'}>
              <Link href="/">
                <MessageSquarePlus strokeWidth={1.5} />
                <span>새 대화</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-1">
        <SidebarGroup>
          <SidebarGroupLabel>메뉴</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {FEATURES.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild tooltip={item.name} isActive={pathname.startsWith(item.href)}>
                    <Link href={item.href}>
                      <item.icon strokeWidth={1.5} />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="mx-2" />

        {/* 기록이 없으면 라벨만 남지 않도록 섹션째 접는다. */}
        {conversations.length > 0 && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>대화</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {conversations.map((conversation) => (
                    <ConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      active={pathname === `/chat/${conversation.id}`}
                      onDelete={handleDelete}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator className="mx-2" />
          </>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>블로그</SidebarGroupLabel>
          <SidebarGroupContent>
            {/* 현재 카테고리는 쿼리에서 읽는다. 정적 렌더(404 등)에서는 활성 표시 없이 그린다. */}
            <Suspense fallback={<BlogMenu categories={categories} active={null} />}>
              <ActiveBlogMenu categories={categories} />
            </Suspense>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-1 pb-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <ThemeToggle />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function ActiveBlogMenu({ categories }: { categories: CategoryCount[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // 글 상세(/blog/[slug])는 어느 항목도 활성으로 두지 않는다. 카테고리는 쿼리로 구분한다.
  const active = pathname === '/blog' ? (searchParams.get('category') ?? '') : null;
  return <BlogMenu categories={categories} active={active} />;
}

/** active: '' = 전체, code = 그 카테고리, null = 블로그 목록이 아님 */
function BlogMenu({ categories, active }: { categories: CategoryCount[]; active: string | null }) {
  const total = categories.reduce((sum, c) => sum + c.postCount, 0);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip="전체 글" isActive={active === ''}>
          <Link href="/blog" aria-current={active === '' ? 'page' : undefined}>
            <FileText strokeWidth={1.5} />
            <span>전체</span>
          </Link>
        </SidebarMenuButton>
        {/* 문서 수는 데이터라 mono로 우측에 붙인다. */}
        <SidebarMenuBadge>{total}</SidebarMenuBadge>
      </SidebarMenuItem>
      {/* 글이 없는 카테고리는 눌러도 빈 목록이라 숨긴다. */}
      {categories.filter((c) => c.postCount > 0).map((category) => {
        const isActive = active === category.code;
        return (
          <SidebarMenuItem key={category.code}>
            <SidebarMenuButton asChild tooltip={category.name} isActive={isActive}>
              <Link
                href={`/blog?category=${encodeURIComponent(category.code)}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* 레일에서도 보이도록 아이콘 자리(16px)에 점을 가운데 둔다. */}
                <span className="flex size-4 shrink-0 items-center justify-center">
                  <CategoryDot color={category.color} />
                </span>
                <span>{category.name}</span>
              </Link>
            </SidebarMenuButton>
            <SidebarMenuBadge>{category.postCount}</SidebarMenuBadge>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
