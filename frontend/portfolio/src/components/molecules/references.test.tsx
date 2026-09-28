import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { References } from "./references";

const blog = {
  type: "BLOG" as const,
  slug: "web-serial-usb",
  title: "Web Serial 정리",
  url: "/blog/web-serial-usb",
  category: { code: "frontend", name: "프론트엔드", color: "#C7772A" },
};
const project = { type: "PROJECT" as const, slug: "syncmaster", title: "싱크마스터", url: "/projects/syncmaster", category: null };

describe("References", () => {
  // vitest globals가 꺼져 있어 Testing Library 자동 정리가 동작하지 않는다.
  afterEach(cleanup);

  it("두 목록을 나눠 보여주고 링크를 건다", () => {
    render(<References references={[blog]} referencedBy={[project]} />);
    expect(screen.getByRole("region", { name: "참고 문서" }).textContent).toContain("Web Serial 정리");
    expect(screen.getByRole("region", { name: "이 문서를 참고한 문서" }).textContent).toContain("싱크마스터");
    expect(screen.getByRole("link", { name: /싱크마스터/ }).getAttribute("href")).toBe("/projects/syncmaster");
  });

  it("블로그는 카테고리 칩(서버 색 점 + 이름), 프로젝트는 종류 라벨을 붙인다", () => {
    render(<References references={[blog]} referencedBy={[project]} />);
    const blogLink = screen.getByRole("link", { name: /Web Serial 정리/ });
    expect(blogLink.textContent).toContain("프론트엔드");
    const dots = [...blogLink.querySelectorAll<HTMLElement>("[aria-hidden=true]")];
    expect(dots.some((d) => d.style.backgroundColor === "rgb(199, 119, 42)")).toBe(true);
    expect(screen.getByRole("link", { name: /싱크마스터/ }).textContent).toContain("프로젝트");
  });

  it("빈 목록은 숨기고 둘 다 비면 아무것도 그리지 않는다", () => {
    const { container, rerender } = render(<References references={[]} referencedBy={[project]} />);
    expect(screen.queryByRole("region", { name: "참고 문서" })).toBeNull();
    rerender(<References references={[]} referencedBy={[]} />);
    expect(container.innerHTML).toBe("");
  });
});
