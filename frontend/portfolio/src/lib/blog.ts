import type { BlogPostSummary, Section } from "./types";

export const blogPath = (slug: string) => `/blog/${slug}`;

export type PostsParams = { page?: number; size?: number; category?: string; tag?: string };

/** 공개 글 목록 API 경로. 서버 조회(api.ts)와 브라우저 목록(queries.ts)이 함께 쓴다. */
export function postsPath(params: PostsParams): string {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.size) q.set("size", String(params.size));
  if (params.category) q.set("category", params.category);
  if (params.tag) q.set("tag", params.tag);
  const qs = q.toString();
  return `/api/blog/posts${qs ? `?${qs}` : ""}`;
}

/** /blog 주소의 쿼리 → 목록 조건. 잘못된 page는 0이다. */
export function postsParamsFrom(search: URLSearchParams): PostsParams & { page: number } {
  return {
    page: Math.max(0, Math.floor(Number(search.get("page"))) || 0),
    category: search.get("category") || undefined,
    tag: search.get("tag") || undefined,
  };
}

/** 목록 조건 → /blog 주소. 첫 페이지는 page를 빼서 주소를 하나로 맞춘다. */
export function blogListPath({ page, category, tag }: PostsParams): string {
  const q = new URLSearchParams();
  if (category) q.set("category", category);
  if (tag) q.set("tag", tag);
  if (page) q.set("page", String(page));
  const qs = q.toString();
  return `/blog${qs ? `?${qs}` : ""}`;
}

export const categoryPath = (code: string) => `/blog?category=${encodeURIComponent(code)}`;

/** "2025-03-05T00:00:00Z" → "2025.03.05" */
export function formatDate(iso: string | null): string {
  return iso ? iso.slice(0, 10).replaceAll("-", ".") : "";
}

/** 한국어 본문 기준 분당 500자로 어림한다. 최소 1분. */
export function readMinutes(sections: Section[]): number {
  const chars = sections.reduce((sum, s) => sum + s.title.length + s.bodyMarkdown.replace(/\s+/g, "").length, 0);
  return Math.max(1, Math.round(chars / 500));
}

/** 목록 한 줄의 메타. 날짜·태그는 데이터라 mono로 그린다. */
export function postMeta(post: BlogPostSummary): string {
  return [formatDate(post.publishedAt), post.tags.map((t) => t.name).join(", ")].filter(Boolean).join(" · ");
}
