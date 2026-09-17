// 백엔드 공개 API 응답 타입 — docs/02-design/API_DESIGN.md 기준

export type Section = { title: string; bodyMarkdown: string };

/** 공통 기술 (SkillResponse) */
export type Skill = { id: number; code: string; name: string; iconKey: string | null };

export type ProjectSummary = {
  slug: string;
  title: string;
  summary: string;
  periodStart: string | null;
  periodEnd: string | null;
  position: string | null;
  contribution: number | null;
  contributionNote: string | null;
  skills: Skill[];
  highlights?: string[];
  thumbnailUrl?: string | null;
};

export type ProjectList = { featured: ProjectSummary[]; others: ProjectSummary[] };

export type ProjectDetail = ProjectSummary & {
  organization: string | null;
  githubUrl: string | null;
  serviceUrl: string | null;
  sections: Section[];
};

export type CodeName = { code: string; name: string };

export type BlogPostSummary = {
  slug: string;
  title: string;
  summary: string;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
  categories: CodeName[];
  tags: CodeName[];
  skills: Skill[];
};

export type BlogPostPage = { items: BlogPostSummary[]; page: number; size: number; totalElements: number };

export type BlogPostDetail = BlogPostSummary & { sections: Section[] };

export type Career = {
  company: string;
  role: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  description: string | null;
};

export type SkillGroupCode = "PRIMARY" | "PROJECT_EXPERIENCE" | "LEARNING" | "COLLABORATION";

export type Profile = {
  headline: string;
  shortBio: string | null;
  imageUrl: string | null;
  githubUrl: string | null;
  email: string | null;
  careers: Career[];
  skillGroups: { group: SkillGroupCode; skills: Skill[] }[];
  sections: Section[];
};

// 채팅 (ADR-0008, ADR-0011)
export type ChatSource = { type: string; slug: string; title: string; url: string | null };
