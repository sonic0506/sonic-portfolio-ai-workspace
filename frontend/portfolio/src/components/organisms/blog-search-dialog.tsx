'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Search } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { blogPath } from '@/lib/blog';
import type { BlogPostPage, BlogPostSummary } from '@/lib/types';

// ponytail: 공개 글을 한 번에 최대 50건 받아 브라우저에서 거른다. 글이 더 늘면 서버 검색 API로 바꾼다.
const SEARCH_URL = '/api/blog/posts?size=50';

function matches(post: BlogPostSummary, needle: string) {
  if (!needle) return true;
  return [post.title, post.summary, ...post.tags.map((t) => t.name)].some((v) => v?.toLowerCase().includes(needle));
}

export function BlogSearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        // 화면 위쪽에 붙는 검색 패널. 그림자·블러 없이 보더와 배경 밝기로만 띄운다.
        className="top-[14vh] w-[560px] max-w-[calc(100vw-48px)] translate-y-0 gap-0 border-border-hi bg-surface p-0 sm:max-w-[560px]"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>블로그 검색</DialogTitle>
          <DialogDescription>제목·요약·태그로 블로그 글을 검색합니다.</DialogDescription>
        </DialogHeader>
        {/* 닫히면 Radix가 통째로 언마운트하므로 다시 열 때 빈 검색어로 돌아온다. */}
        <SearchPanel onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPostSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(SEARCH_URL, { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<BlogPostPage>) : Promise.reject(new Error(String(res.status)))))
      .then((page) => setPosts(page.items))
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, []);

  const needle = query.trim().toLowerCase();
  const results = useMemo(() => (posts ?? []).filter((post) => matches(post, needle)), [posts, needle]);
  // 결과가 줄어도 선택이 목록 밖으로 나가지 않도록 렌더 시점에 눌러 둔다.
  const safeIndex = Math.min(activeIndex, Math.max(results.length - 1, 0));

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [safeIndex, results.length]);

  const openPost = (post: BlogPostSummary) => {
    onClose();
    router.push(blogPath(post.slug));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (results.length === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((safeIndex + step + results.length) % results.length);
      return;
    }
    // 한글 조합 중의 Enter는 글자 확정이지 글 열기가 아니다.
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault();
      const post = results[safeIndex];
      if (post) openPost(post);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2.5 border-b border-border px-3 py-2.5">
        <Search className="size-4 shrink-0 text-text-3" strokeWidth={1.5} />
        <input
          autoFocus
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="제목·요약·태그로 검색"
          aria-label="블로그 검색어"
          className="min-w-0 flex-1 border-0 bg-transparent p-0 font-body text-md text-text-1 outline-none placeholder:text-text-3"
        />
        <kbd className="shrink-0 rounded-xs border border-border px-[5px] py-0.5 font-mono text-2xs text-text-3">ESC</kbd>
      </div>

      {failed ? (
        <p className="px-4 py-8 text-center text-sm text-text-2">글 목록을 불러오지 못했습니다. 잠시 후 다시 열어 주세요.</p>
      ) : posts === null ? (
        <p className="px-4 py-8 text-center font-mono text-2xs text-text-3">불러오는 중</p>
      ) : results.length > 0 ? (
        <ul ref={listRef} role="listbox" aria-label="검색 결과" className="max-h-80 overflow-y-auto p-1.5">
          {results.map((post, index) => (
            <li key={post.slug}>
              <button
                type="button"
                role="option"
                aria-selected={index === safeIndex}
                data-active={index === safeIndex}
                onClick={() => openPost(post)}
                onMouseMove={() => setActiveIndex(index)}
                className="flex w-full flex-col gap-1 rounded-md px-2 py-2 text-left transition-colors hover:bg-surface-hi data-[active=true]:bg-surface-hi"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <FileText className="size-3.5 shrink-0 text-text-3" strokeWidth={1.5} />
                  <span className="min-w-0 flex-1 truncate font-display text-sm font-medium text-text-1">{post.title}</span>
                  {post.category && <span className="shrink-0 font-mono text-2xs text-text-3">{post.category.name}</span>}
                </span>
                {post.summary && <span className="truncate pl-[22px] text-xs text-text-2">{post.summary}</span>}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        // 빈 상태: 사과·이모지 없이 사실과 다음 행동만.
        <p className="px-4 py-8 text-center text-sm text-text-2">검색 결과가 없습니다. 다른 키워드로 검색해 보세요.</p>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2">
        <span className="font-mono text-2xs text-text-3">{results.length}건</span>
        <span className="font-mono text-2xs text-text-3">Enter 열기 · Esc 닫기</span>
      </div>
    </>
  );
}

/** 목록 머리의 검색 진입점. */
export function BlogSearchButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md border border-border px-2.5 py-[5px] text-sm text-text-2 transition-colors hover:border-border-hi hover:bg-surface-hi hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Search className="size-3.5" strokeWidth={1.5} />
        검색
      </button>
      <BlogSearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
