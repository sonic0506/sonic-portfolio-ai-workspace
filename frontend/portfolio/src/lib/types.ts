// 백엔드 공개 API 응답 타입 — docs/02-design/API_DESIGN.md 기준

export type Section = { title: string; bodyMarkdown: string };

/** 공통 기술 (SkillResponse) */
/** iconUrl은 어드민에서 올린 로고(ADR-0020). */
export type Skill = { id: number; code: string; name: string; iconKey: string | null; iconUrl: string | null };

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

/** 참고 문서 — 공개 문서만 온다 (ADR-0005 후속 결정) */
export type DocumentReference = {
  type: "PROJECT" | "BLOG";
  slug: string;
  title: string;
  url: string;
  /** 블로그만. 프로젝트는 null. */
  category: Category | null;
};

type WithReferences = { references: DocumentReference[]; referencedBy: DocumentReference[] };

export type ProjectDetail = ProjectSummary &
  WithReferences & {
    organization: string | null;
    githubUrl: string | null;
    serviceUrl: string | null;
    sections: Section[];
  };

export type CodeName = { code: string; name: string };

/** 블로그 카테고리. color는 서버가 정한 "#RRGGBB"이며 점(dot)에만 쓴다. */
export type Category = CodeName & { color: string };

export type CategoryCount = Category & { postCount: number };

export type BlogPostSummary = {
  slug: string;
  title: string;
  summary: string;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
  category: Category | null;
  tags: CodeName[];
  skills: Skill[];
};

export type BlogPostPage = { items: BlogPostSummary[]; page: number; size: number; totalElements: number };

export type BlogPostDetail = BlogPostSummary & WithReferences & { sections: Section[] };

/** 경력 아래 프로젝트별 주요 성과(ADR-0019). project는 공개 프로젝트에 연결됐을 때만 온다. */
export type Achievement = {
  title: string;
  periodStart: string;
  periodEnd: string | null;
  job: string | null;
  position: string | null;
  bodyMarkdown: string | null;
  project: { slug: string; title: string; url: string } | null;
};

/** role은 직무, position은 직책. */
export type Career = {
  company: string;
  role: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  description: string | null;
  employmentType: string | null;
  position: string | null;
  achievements: Achievement[];
  logoUrl: string | null;
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
