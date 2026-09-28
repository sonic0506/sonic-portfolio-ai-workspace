import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CategoryDot } from "@/components/atoms/category-dot";
import { DocPager, neighbors } from "@/components/molecules/doc-pager";
import { PostInfoCard } from "@/components/molecules/post-info-card";
import { References } from "@/components/molecules/references";
import { DocLayout } from "@/components/organisms/doc-layout";
import { Sections } from "@/components/site/sections";
import { getPost, getPosts } from "@/lib/api";
import { blogPath, categoryPath, formatDate, readMinutes } from "@/lib/blog";
import { extractHeadings } from "@/lib/headings";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  return { title: post.title, description: post.summary };
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getPost(slug);
  // 같은 카테고리 안에서 최신순으로 이전·다음을 잇는다.
  const siblings = await getPosts({ category: post.category?.code, size: 50 });
  const { previous, next } = neighbors(siblings.items, slug);
  const toPager = (p?: { slug: string; title: string }) => p && { href: blogPath(p.slug), title: p.title };

  const minutes = readMinutes(post.sections);
  const updated = post.updatedAt && post.updatedAt.slice(0, 10) !== post.publishedAt?.slice(0, 10);
  const facts = [
    post.publishedAt && `게시 ${formatDate(post.publishedAt)}`,
    updated && `수정 ${formatDate(post.updatedAt)}`,
    `읽는 데 ${minutes}분`,
    `연결 ${post.references.length + post.referencedBy.length}개`,
  ].filter(Boolean) as string[];

  const header = (
    <header>
      <Link
        href={post.category ? categoryPath(post.category.code) : "/blog"}
        className="-ml-2 inline-flex items-center gap-2 rounded-md px-2 py-[5px] text-sm text-text-2 transition-colors hover:bg-surface-hi hover:text-text-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="size-3.5 shrink-0" strokeWidth={1.5} />
        {post.category ? (
          <>
            <CategoryDot color={post.category.color} className="size-1.5" />
            {post.category.name}
          </>
        ) : (
          "Blog"
        )}
      </Link>

      <h1 className="mt-4 text-xl leading-[1.4] font-medium break-keep">{post.title}</h1>

      {/* 날짜·읽는 시간은 전부 데이터라 mono 한 줄로 묶는다. */}
      <p className="mt-3 font-mono text-2xs text-text-2">
        {[formatDate(post.publishedAt), `${minutes}분`].filter(Boolean).join(" · ")}
      </p>

      {(post.tags.length > 0 || post.skills.length > 0) && (
        <ul className="mt-3.5 flex flex-wrap gap-1.5">
          {post.tags.map((t) => (
            <li key={t.code}>
              <Link
                href={`/blog?tag=${encodeURIComponent(t.code)}`}
                className="block rounded-xs border border-border px-2 py-[3px] font-mono text-2xs text-text-2 transition-colors hover:border-border-hi hover:text-foreground"
              >
                #{t.name}
              </Link>
            </li>
          ))}
          {post.skills.map((s) => (
            <li key={s.code} className="rounded-xs border border-border px-2 py-[3px] font-mono text-2xs text-text-3">
              {s.name}
            </li>
          ))}
        </ul>
      )}
    </header>
  );

  return (
    <DocLayout
      key={slug}
      headings={extractHeadings(post.sections)}
      header={header}
      aside={<PostInfoCard title={post.title} category={post.category} facts={facts} />}
    >
      <Sections sections={post.sections} />
      <References references={post.references} referencedBy={post.referencedBy} className="mt-14 border-t border-border pt-14" />
      <DocPager previous={toPager(previous)} next={toPager(next)} />
    </DocLayout>
  );
}
