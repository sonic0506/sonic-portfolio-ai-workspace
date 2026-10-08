import { describe, expect, it } from "vitest";
import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { remarkQuestions } from "@portfolio/markdown";

const render = (md: string) =>
  String(
    unified()
      .use(remarkParse)
      .use(remarkDirective)
      .use(remarkQuestions)
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(md),
  );

describe("remarkQuestions", () => {
  it(":::questions 목록을 질문 배열로 바꾼다", () => {
    const html = render(":::questions\n- 첫 질문?\n- **둘째** 질문?\n:::\n");
    expect(html).toContain("<suggested-questions");
    expect(html).toContain("첫 질문?");
    expect(html).toContain("둘째 질문?");
    expect(html).not.toContain("<li>");
  });

  it("다른 지시문 문법은 원문을 살린다", () => {
    expect(render("회의는 오전:meeting 에 했다")).toContain("오전:meeting 에 했다");
    expect(render(":::note\n본문\n:::\n")).toContain("<p>본문</p>");
  });
});
