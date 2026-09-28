import type { Metadata } from "next";
import Link from "next/link";
import { X } from "lucide-react";
import { CategoryDot } from "@/components/atoms/category-dot";
import { MiniChatPrompt } from "@/components/molecules/mini-chat-prompt";
import { PostRow } from "@/components/molecules/post-row";
import { BlogSearchButton } from "@/components/organisms/blog-search-dialog";
import { getCategoriesOrEmpty, getPosts } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "블로그" };

const pagerStyle =
  "rounded-md border border-border px-3 py-[5px] text-sm text-text-2 transition-colors hover:border-border-hi hover:bg-surface-hi hover:text-foreground";

export default async function BlogPage({ searchParams }: PageProps<"/blog">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const page = Math.max(0, Number(one(sp.page)) || 0);
  const category = one(sp.category);
  const tag = one(sp.tag);
  const [result, categories] = await Promise.all([getPosts({ page, category, tag }), getCategoriesOrEmpty()]);
  const current = categories.find((c) => c.code === category);
  const tagName = tag && result.items.flatMap((p) => p.tags).find((t) => t.code === tag)?.name;
  const lastPage = Math.max(0, Math.ceil(result.totalElements / result.size) - 1);

  const pageHref = (p: number) => {
    const q = new URLSearchParams();
    if (category) q.set("category", category);
    if (tag) q.set("tag", tag);
    if (p > 0) q.set("page", String(p));
    const qs = q.toString();
    return `/blog${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="mx-auto w-full max-w-content px-6 pt-10 pb-20 sm:px-10">
      <header>
        <div className="flex items-baseline gap-2.5">
          {/* 카테고리 색은 이 점에서만 쓴다. */}
          {category && <CategoryDot color={current?.color} className="translate-y-px" />}
          <h1 className="min-w-0 flex-1 truncate text-xl">{current?.name ?? (category ? category : "Blog")}</h1>
          {/* 글 수는 데이터라 mono. */}
          <span className="shrink-0 font-mono text-2xs text-text-3">{result.totalElements}</span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <BlogSearchButton />
          {tag && (
            <Link
              href={category ? `/blog?category=${encodeURIComponent(category)}` : "/blog"}
              className="inline-flex items-center gap-1.5 rounded-xs border border-border px-2 py-[3px] font-mono text-2xs text-text-2 transition-colors hover:border-border-hi"
              aria-label={`태그 필터 해제: ${tagName ?? tag}`}
            >
              #{tagName ?? tag}
              <X className="size-3" strokeWidth={1.5} />
            </Link>
          )}
        </div>
      </header>

      {result.items.length > 0 ? (
        <ul className="mt-7 flex flex-col border-b border-border">
          {result.items.map((post) => (
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
            <Link href={pageHref(page - 1)} className={pagerStyle}>
              이전
            </Link>
          )}
          <span className="font-mono text-2xs text-text-3">
            {page + 1} / {lastPage + 1}
          </span>
          {page < lastPage && (
            <Link href={pageHref(page + 1)} className={pagerStyle}>
              다음
            </Link>
          )}
        </nav>
      )}

      <MiniChatPrompt
        label="찾는 내용이 없다면 직접 물어보세요"
        placeholder="예: 모바일 웹에서 뒤로 가기를 어떻게 처리했나요?"
        caption="프로젝트와 블로그 글에서 답을 찾습니다"
        className="mt-16"
      />
    </div>
  );
}
