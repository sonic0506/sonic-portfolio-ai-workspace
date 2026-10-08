import { describe, expect, it } from "vitest";
import { blogListPath, formatDate, postsParamsFrom, postsPath, readMinutes } from "./blog";

describe("blog", () => {
  it("날짜는 점으로 잇고 없으면 빈 문자열이다", () => {
    expect(formatDate("2025-03-05T00:00:00Z")).toBe("2025.03.05");
    expect(formatDate(null)).toBe("");
  });

  it("읽는 시간은 공백을 뺀 글자 수로 어림하고 최소 1분이다", () => {
    expect(readMinutes([{ title: "", bodyMarkdown: "짧다" }])).toBe(1);
    expect(readMinutes([{ title: "", bodyMarkdown: "가".repeat(1500) }])).toBe(3);
  });

  it("목록 주소 쿼리를 조건으로 읽고, 잘못된 page는 0이다", () => {
    expect(postsParamsFrom(new URLSearchParams("category=ai&tag=rag&page=2"))).toEqual({ page: 2, category: "ai", tag: "rag" });
    expect(postsParamsFrom(new URLSearchParams("page=-3"))).toEqual({ page: 0, category: undefined, tag: undefined });
    expect(postsParamsFrom(new URLSearchParams("page=abc")).page).toBe(0);
  });

  it("조건 → API 경로와 화면 주소. 첫 페이지는 page를 뺀다", () => {
    expect(postsPath({ page: 1, category: "ai", tag: "a b" })).toBe("/api/blog/posts?page=1&category=ai&tag=a+b");
    expect(postsPath({})).toBe("/api/blog/posts");
    expect(blogListPath({ category: "ai", page: 0 })).toBe("/blog?category=ai");
    expect(blogListPath({})).toBe("/blog");
  });
});
