import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { References } from "./references";

const blog = { type: "BLOG" as const, slug: "web-serial-usb", title: "Web Serial 정리", url: "/blog/web-serial-usb" };
const project = { type: "PROJECT" as const, slug: "syncmaster", title: "싱크마스터", url: "/projects/syncmaster" };

describe("References", () => {
  // vitest globals가 꺼져 있어 Testing Library 자동 정리가 동작하지 않는다.
  afterEach(cleanup);

  it("두 목록을 나눠 보여주고 링크를 건다", () => {
    render(<References references={[blog]} referencedBy={[project]} />);
    expect(screen.getByRole("region", { name: "참고 문서" }).textContent).toContain("Web Serial 정리");
    expect(screen.getByRole("region", { name: "이 문서를 참고한 문서" }).textContent).toContain("싱크마스터");
    expect(screen.getByRole("link", { name: /싱크마스터/ }).getAttribute("href")).toBe("/projects/syncmaster");
  });

  it("빈 목록은 숨기고 둘 다 비면 아무것도 그리지 않는다", () => {
    const { container, rerender } = render(<References references={[]} referencedBy={[project]} />);
    expect(screen.queryByRole("region", { name: "참고 문서" })).toBeNull();
    rerender(<References references={[]} referencedBy={[]} />);
    expect(container.innerHTML).toBe("");
  });
});
