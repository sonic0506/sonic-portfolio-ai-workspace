import { describe, expect, it } from "vitest";
import { stripCitations } from "./citations";

describe("stripCitations", () => {
  it("근거 번호와 앞 공백을 지운다", () => {
    expect(stripCitations("저의 고향은 안산입니다[1]. 경험이 있습니다 [3][4].")).toBe("저의 고향은 안산입니다. 경험이 있습니다.");
  });

  it("줄바꿈과 Markdown 링크는 그대로 둔다", () => {
    expect(stripCitations("목록\n* 항목 [2]\n[문서](/blog/a)")).toBe("목록\n* 항목\n[문서](/blog/a)");
  });
});
