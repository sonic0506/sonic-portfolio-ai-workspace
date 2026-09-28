import type { BlogPostSummary, Section } from "./types";

export const blogPath = (slug: string) => `/blog/${slug}`;
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
