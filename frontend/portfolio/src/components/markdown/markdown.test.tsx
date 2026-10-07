import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Markdown } from "./markdown";

describe("Markdown", () => {
  // vitest globals가 꺼져 있어 Testing Library 자동 정리가 동작하지 않는다.
  afterEach(cleanup);

  it("괄호로 끝나는 굵은 글씨 뒤에 한글 조사가 붙어도 굵게 표시한다", () => {
    // CommonMark만으로는 `**청킹(Chunking)**은`의 닫는 **를 인정하지 않는다(remark-cjk-friendly).
    const { container } = render(<Markdown>{"**청킹(Chunking)**은 문서를 나눈다."}</Markdown>);
    expect(container.querySelector("strong")?.textContent).toBe("청킹(Chunking)");
    expect(container.textContent).not.toContain("**");
  });

  it("사이트 안 링크는 같은 탭 링크로 표시한다", () => {
    const { container } = render(<Markdown>{"[RAG](/blog/rag)의 인덱싱"}</Markdown>);
    const link = container.querySelector("a");
    expect(link?.getAttribute("href")).toBe("/blog/rag");
    expect(link?.getAttribute("target")).toBeNull();
  });
});
