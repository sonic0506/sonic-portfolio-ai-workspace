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

  it("목록 주소 쿼리를 조건으로 읽는다. 주소의 page는 1부터, 조건의 page는 0부터이고 잘못된 page는 첫 페이지다", () => {
    expect(postsParamsFrom(new URLSearchParams("category=ai&tag=rag&page=2"))).toEqual({ page: 1, category: "ai", tag: "rag" });
    expect(postsParamsFrom(new URLSearchParams("page=1")).page).toBe(0);
    expect(postsParamsFrom(new URLSearchParams("page=0")).page).toBe(0);
    expect(postsParamsFrom(new URLSearchParams("page=-3"))).toEqual({ page: 0, category: undefined, tag: undefined });
    expect(postsParamsFrom(new URLSearchParams("page=abc")).page).toBe(0);
  });

  it("조건 → API 경로와 화면 주소. 첫 페이지는 page를 뺀다", () => {
    expect(postsPath({ page: 1, category: "ai", tag: "a b" })).toBe("/api/blog/posts?page=1&category=ai&tag=a+b");
    expect(postsPath({})).toBe("/api/blog/posts");
    expect(blogListPath({ category: "ai", page: 0 })).toBe("/blog?category=ai");
    expect(blogListPath({ page: 1 })).toBe("/blog?page=2");
    expect(blogListPath({})).toBe("/blog");
  });
});
