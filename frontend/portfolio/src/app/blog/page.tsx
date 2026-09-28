import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPosts } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "블로그" };

export default async function BlogPage({ searchParams }: PageProps<"/blog">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const page = Math.max(0, Number(one(sp.page)) || 0);
  const category = one(sp.category);
  const tag = one(sp.tag);
  const result = await getPosts({ page, category, tag });
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
    <div className="space-y-8">
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="text-2xl font-bold">블로그</h1>
        {(category || tag) && (
          <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">
            필터 해제 ({[category, tag].filter(Boolean).join(", ")})
          </Link>
        )}
      </div>

      {result.items.length === 0 && <p className="text-muted-foreground">공개된 글이 없습니다.</p>}
      <ul className="divide-y">
        {result.items.map((post) => (
          <li key={post.slug} className="space-y-2 py-5">
            <Link href={`/blog/${post.slug}`} className="block space-y-1">
              <h2 className="text-lg font-semibold hover:underline">{post.title}</h2>
              <p className="text-sm text-muted-foreground">{post.summary}</p>
            </Link>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {post.publishedAt && <span className="mr-1">{post.publishedAt.slice(0, 10)}</span>}
              {[post.category].filter((c) => c !== null).map((c) => (
                <Link key={c.code} href={`/blog?category=${encodeURIComponent(c.code)}`}>
                  <Badge variant="secondary">{c.name}</Badge>
                </Link>
              ))}
              {post.tags.map((t) => (
                <Link key={t.code} href={`/blog?tag=${encodeURIComponent(t.code)}`}>
                  <Badge variant="outline">#{t.name}</Badge>
                </Link>
              ))}
            </div>
          </li>
        ))}
      </ul>

      {lastPage > 0 && (
        <nav className="flex items-center justify-center gap-3 text-sm">
          {page > 0 ? (
            <Link href={pageHref(page - 1)}>
              <Button variant="outline" size="sm">이전</Button>
            </Link>
          ) : null}
          <span>
            {page + 1} / {lastPage + 1}
          </span>
          {page < lastPage ? (
            <Link href={pageHref(page + 1)}>
              <Button variant="outline" size="sm">다음</Button>
            </Link>
          ) : null}
        </nav>
      )}
    </div>
  );
}
