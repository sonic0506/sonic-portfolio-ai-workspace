import { describe, expect, it } from "vitest";
import { groupProjectsByYear, projectMeta } from "./projects";
import type { ProjectSummary } from "./types";

const base: ProjectSummary = {
  slug: "a",
  title: "A",
  summary: "",
  periodStart: "2024-11-01",
  periodEnd: null,
  position: "프론트엔드",
  contribution: 80,
  contributionNote: null,
  skills: [],
};

describe("projects", () => {
  it("메타는 빈 칸을 빼고 잇는다", () => {
    expect(projectMeta(base)).toBe("2024.11 – 진행 중 · 프론트엔드 · 80%");
    expect(projectMeta({ ...base, position: null, contribution: null }, { contributionLabel: true })).toBe(
      "2024.11 – 진행 중",
    );
  });

  it("연도 내림차순으로 묶고 기간 없는 항목은 맨 뒤다", () => {
    const groups = groupProjectsByYear([
      { ...base, slug: "old", periodStart: "2022-01-01" },
      { ...base, slug: "none", periodStart: null },
      { ...base, slug: "new", periodStart: "2024-03-01" },
    ]);
    expect(groups.map((g) => g.year)).toEqual(["2024", "2022", "기타"]);
  });
});
