import type { MetadataRoute } from "next";
import { getPosts, getProjects } from "@/lib/api";
import { SITE_URL } from "@/lib/site";

// 레이아웃과 같은 주기로 다시 만든다(ADR-0021). 실패하면 던져서 이전 sitemap을 계속 내보낸다.
export const revalidate = 300;

/** 공개 글 API는 한 번에 50건까지 준다. */
const PAGE_SIZE = 50;

async function allPosts() {
  const first = await getPosts({ size: PAGE_SIZE });
  const pages = Math.ceil(first.totalElements / PAGE_SIZE);
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) => getPosts({ page: i + 1, size: PAGE_SIZE })));
  return [first, ...rest].flatMap((p) => p.items);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts] = await Promise.all([getProjects(), allPosts()]);
  const fixed = ["", "/profile", "/projects", "/blog", "/graph"].map((path) => ({ url: `${SITE_URL}${path}` }));
  return [
    ...fixed,
    ...[...projects.featured, ...projects.others].map((p) => ({ url: `${SITE_URL}/projects/${p.slug}` })),
    ...posts.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: p.updatedAt ?? p.publishedAt ?? undefined })),
  ];
}
