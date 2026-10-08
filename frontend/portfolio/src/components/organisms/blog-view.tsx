'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';

import { CategoryDot } from '@/components/atoms/category-dot';
import { GraphLink } from '@/components/molecules/graph-link';
import { PostRow } from '@/components/molecules/post-row';
import { BlogSearchButton } from '@/components/organisms/blog-search-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { blogListPath, postsParamsFrom } from '@/lib/blog';
import { usePosts } from '@/lib/queries';
import type { CategoryCount } from '@/lib/types';

const pagerStyle =
  'rounded-md border border-border px-3 py-[5px] text-sm text-text-2 transition-colors hover:border-border-hi hover:bg-surface-hi hover:text-foreground';

/**
 * 블로그 목록. 조건은 주소 쿼리(category, tag, page)에서 읽고 목록은 브라우저에서 받는다.
 * 같은 조건으로 다시 오면 React Query 캐시를 그대로 그린다(ADR-0021).
 * useSearchParams를 쓰므로 페이지에서 Suspense로 감싼다(대체 화면은 BlogSkeleton).
 */
export function BlogView({ categories }: { categories: CategoryCount[] }) {
  const { page, category, tag } = postsParamsFrom(useSearchParams());
  const { data, isError } = usePosts({ page, category, tag });
  const current = categories.find((c) => c.code === category);
  const tagName = tag && data?.items.flatMap((p) => p.tags).find((t) => t.code === tag)?.name;
  const lastPage = data ? Math.max(0, Math.ceil(data.totalElements / data.size) - 1) : 0;

  return (
    <>
      <header>
        <div className="flex items-baseline gap-2.5">
          {/* 카테고리 색은 이 점에서만 쓴다. */}
          {category && <CategoryDot color={current?.color} className="translate-y-px" />}
          <h1 className="min-w-0 flex-1 truncate text-xl">{current?.name ?? (category ? category : 'Blog')}</h1>
          {/* 글 수는 데이터라 mono. */}
          {data ? (
            <span className="shrink-0 font-mono text-2xs text-text-3">{data.totalElements}</span>
          ) : (
            !isError && <Skeleton className="h-3 w-5" />
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <BlogSearchButton />
          {current && current.postCount > 0 && (
            <GraphLink nodeId={`category:${current.code}`} label="그래프에서 보기" className="h-auto px-2.5 py-[5px]" />
          )}
          {tag && (
            <Link
              href={blogListPath({ category })}
              className="inline-flex items-center gap-1.5 rounded-xs border border-border px-2 py-[3px] font-mono text-2xs text-text-2 transition-colors hover:border-border-hi"
              aria-label={`태그 필터 해제: ${tagName ?? tag}`}
            >
              #{tagName ?? tag}
              <X className="size-3" strokeWidth={1.5} />
            </Link>
          )}
        </div>
      </header>

      {isError ? (
        <p className="mt-7 font-body text-md text-text-2">글 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      ) : !data ? (
        <PostListSkeleton />
      ) : data.items.length > 0 ? (
        <ul className="mt-7 flex flex-col border-b border-border">
          {data.items.map((post) => (
            <PostRow key={post.slug} post={post} showCategory={!category} />
          ))}
        </ul>
      ) : (
        // 빈 상태: 사실과 다음 행동만.
        <p className="mt-7 font-body text-md text-text-2">조건에 맞는 글이 없습니다.</p>
      )}

      {lastPage > 0 && (
        <nav aria-label="페이지" className="mt-8 flex items-center justify-center gap-3">
          {page > 0 && (
            <Link href={blogListPath({ category, tag, page: page - 1 })} className={pagerStyle}>
              이전
            </Link>
          )}
          <span className="font-mono text-2xs text-text-3">
            {page + 1} / {lastPage + 1}
          </span>
          {page < lastPage && (
            <Link href={blogListPath({ category, tag, page: page + 1 })} className={pagerStyle}>
              다음
            </Link>
          )}
        </nav>
      )}
    </>
  );
}

/** 주소 쿼리를 읽기 전(정적 HTML) 화면. 제목·검색 버튼은 바로 보이고 목록 자리만 비워 둔다. */
export function BlogSkeleton() {
  return (
    <>
      <header>
        <h1 className="text-xl">Blog</h1>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <BlogSearchButton />
        </div>
      </header>
      <PostListSkeleton />
    </>
  );
}

function PostListSkeleton() {
  return (
    <ul role="status" aria-label="글 목록 불러오는 중" className="mt-7 flex flex-col border-b border-border">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <li key={i} className="flex flex-col gap-2.5 border-t border-border py-5 first:border-t-0">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/3" />
        </li>
      ))}
    </ul>
  );
}
