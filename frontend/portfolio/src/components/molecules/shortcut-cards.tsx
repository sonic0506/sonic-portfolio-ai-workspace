import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { Book, Folder, User } from 'lucide-react';

import { cn } from '@/lib/utils';

type Shortcut = { icon: LucideIcon; count?: number; title: string; description: string; href: string };

/** 컴포저 아래 3열 숏컷. 대화 말고 둘러보기로 들어가는 입구다. */
export function ShortcutCards({
  projectCount,
  postCount,
  className,
}: {
  projectCount: number;
  postCount: number;
  className?: string;
}) {
  const shortcuts: Shortcut[] = [
    { icon: Folder, count: projectCount, title: '프로젝트', description: '역할과 기술로 정리한 작업 기록', href: '/projects' },
    { icon: Book, count: postCount, title: '블로그', description: '작업하며 내린 판단과 문제 해결 기록', href: '/blog' },
    { icon: User, title: '소개', description: '경력과 기술 스택', href: '/profile' },
  ];

  return (
    <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-3', className)}>
      {shortcuts.map((shortcut) => (
        <Link
          key={shortcut.href}
          href={shortcut.href}
          className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-hi hover:bg-surface-hi focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <div className="flex items-center justify-between gap-2">
            <shortcut.icon className="size-4 shrink-0 text-text-2" strokeWidth={1.5} />
            {/* 카운트는 데이터라 mono. */}
            {shortcut.count !== undefined && <span className="font-mono text-2xs text-text-3">{shortcut.count}</span>}
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-display text-sm font-medium text-text-1">{shortcut.title}</span>
            <span className="text-xs leading-[1.5] break-keep text-text-2">{shortcut.description}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
