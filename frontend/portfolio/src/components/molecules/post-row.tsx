import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { CategoryDot } from '@/components/atoms/category-dot';
import { blogPath, postMeta } from '@/lib/blog';
import type { BlogPostSummary } from '@/lib/types';

/**
 * 글 목록의 한 줄. 행 전체가 링크이고, hover 배경만 좌우로 12px 넘어간다.
 * 요약이 비면 그 블록은 통째로 빠진다.
 */
export function PostRow({ post, showCategory }: { post: BlogPostSummary; showCategory?: boolean }) {
  return (
    <li className="border-t border-border first:border-t-0">
      <Link
        href={blogPath(post.slug)}
        className="group -mx-3 flex gap-4 rounded-md px-3 py-5 transition-colors hover:bg-surface-hi focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 block text-base leading-[1.4] font-medium tracking-[-0.02em] break-keep">
            {post.title}
          </span>
          {post.summary && (
            <span className="mt-1.5 line-clamp-2 block font-body text-md leading-[1.6] text-text-2">{post.summary}</span>
          )}
          {/* 날짜·태그는 전부 데이터라 mono. */}
          <span className="mt-2.5 flex items-center gap-2 font-mono text-2xs text-text-3">
            {showCategory && post.category && (
              <>
                <CategoryDot code={post.category.code} className="size-1.5" />
                <span>{post.category.name}</span>
                <span aria-hidden="true">·</span>
              </>
            )}
            <span className="min-w-0 truncate">{postMeta(post)}</span>
          </span>
        </span>
        <ArrowRight
          className="mt-1 size-4 shrink-0 text-text-3 transition-colors group-hover:text-text-2"
          strokeWidth={1.5}
        />
      </Link>
    </li>
  );
}
