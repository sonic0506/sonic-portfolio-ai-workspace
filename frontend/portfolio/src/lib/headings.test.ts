import { describe, expect, it } from "vitest";
import { extractHeadings, headingId } from "./headings";

describe("extractHeadings", () => {
  it("섹션 제목은 h2, 본문의 ###은 h3이고 코드 블록 안은 무시한다", () => {
    const headings = extractHeadings([
      { title: "개요", bodyMarkdown: "본문\n\n### 세부 A\n\n```sh\n### 주석\n```\n### 세부 B" },
      { title: "", bodyMarkdown: "제목 없는 섹션" },
    ]);
    expect(headings.map((h) => [h.level, h.text])).toEqual([
      [2, "개요"],
      [3, "세부 A"],
      [3, "세부 B"],
    ]);
  });

  it("같은 텍스트는 같은 id가 된다", () => {
    expect(headingId(" UX · 화면 흐름 ")).toBe("h-ux-화면-흐름");
  });
});
