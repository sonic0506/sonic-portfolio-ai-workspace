import { describe, expect, it } from "vitest";
import { formatDate, readMinutes } from "./blog";

describe("blog", () => {
  it("날짜는 점으로 잇고 없으면 빈 문자열이다", () => {
    expect(formatDate("2025-03-05T00:00:00Z")).toBe("2025.03.05");
    expect(formatDate(null)).toBe("");
  });

  it("읽는 시간은 공백을 뺀 글자 수로 어림하고 최소 1분이다", () => {
    expect(readMinutes([{ title: "", bodyMarkdown: "짧다" }])).toBe(1);
    expect(readMinutes([{ title: "", bodyMarkdown: "가".repeat(1500) }])).toBe(3);
  });
});
