import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SkillBadges } from "@/components/site/project-card";
import { References } from "@/components/site/references";
import { Sections } from "@/components/site/sections";
import { getPost } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  return { title: post.title, description: post.summary };
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getPost(slug);
  return (
    <article className="space-y-6">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">{post.title}</h1>
        <p className="text-muted-foreground">{post.summary}</p>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {post.publishedAt && <span className="mr-1">{post.publishedAt.slice(0, 10)}</span>}
          {post.categories.map((c) => (
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
        <SkillBadges skills={post.skills} />
      </header>
      <Sections sections={post.sections} />
      <References references={post.references} referencedBy={post.referencedBy} />
    </article>
  );
}
