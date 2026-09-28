import type { ProjectDetail, ProjectSummary } from "./types";
import { formatMonth } from "./utils";

export const projectPath = (slug: string) => `/projects/${slug}`;

/**
 * 메타 한 줄. '기간 · 소속 · 역할 · 기여도' 순서다. 값이 없는 칸은 자리를
 * 비워 두는 대신 통째로 빠진다.
 */
export function projectMeta(project: ProjectSummary | ProjectDetail, options?: { contributionLabel?: boolean }) {
  const period = project.periodStart
    ? `${formatMonth(project.periodStart)} – ${project.periodEnd ? formatMonth(project.periodEnd) : "진행 중"}`
    : null;
  const contribution =
    project.contribution === null ? null : `${options?.contributionLabel ? "기여도 " : ""}${project.contribution}%`;
  const organization = "organization" in project ? project.organization : null;
  return [period, organization, project.position, contribution].filter(Boolean).join(" · ");
}

/** 타임라인 연도 그룹. 시작 연도로 묶고, 기간이 없으면 '기타'로 간다. */
export const UNDATED_GROUP = "기타";

export function groupProjectsByYear(projects: ProjectSummary[]) {
  const groups: { year: string; projects: ProjectSummary[] }[] = [];
  for (const project of projects) {
    const year = project.periodStart ? project.periodStart.slice(0, 4) : UNDATED_GROUP;
    const group = groups.find((g) => g.year === year);
    if (group) group.projects.push(project);
    else groups.push({ year, projects: [project] });
  }
  for (const group of groups) {
    group.projects.sort((a, b) => (b.periodStart ?? "").localeCompare(a.periodStart ?? ""));
  }
  return groups.sort((a, b) => {
    if (a.year === UNDATED_GROUP) return 1;
    if (b.year === UNDATED_GROUP) return -1;
    return b.year.localeCompare(a.year);
  });
}
