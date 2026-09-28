// 관리 API 응답 타입 — docs/02-design/API_DESIGN.md

export type Me = { login: string; name: string | null; avatarUrl: string | null }

export type IndexStatus = 'PENDING' | 'INDEXING' | 'READY' | 'FAILED'

export type RagDocument = {
  id: number
  type: string
  sourceId: number
  title: string
  visible: boolean
  indexStatus: IndexStatus
  indexError: string | null
  indexedAt: string | null
  chunkCount: number
}

export type ReindexResult = {
  embeddingEnabled: boolean
  indexed: number
  failed: number
  skipped: number
  documents: RagDocument[]
}

export type UnansweredStatus = 'OPEN' | 'RESOLVED' | 'IGNORED'

export type Unanswered = {
  id: number
  question: string
  answer: string
  reason: 'NO_EVIDENCE' | 'NO_CITATION'
  retrieved: { type: string; slug: string; title: string; distance: number }[]
  status: UnansweredStatus
  adminNote: string | null
  inActiveSession: boolean
  createdAt: string
  handledAt: string | null
}

export type Page<T> = { items: T[]; page: number; size: number; totalElements: number }

export type Faq = {
  id: number
  question: string
  answer: string
  published: boolean
  displayOrder: number
  indexStatus: IndexStatus | null
  createdAt: string
  updatedAt: string
}

export type FaqRequest = {
  question: string
  answer: string
  published: boolean
  displayOrder: number
  fromUnansweredId?: number
}

// 콘텐츠 관리 (API_DESIGN "콘텐츠 관리")

export type Skill = { id: number; code: string; name: string; iconKey: string | null }
export type Category = { id: number; code: string; name: string; displayOrder: number }
export type Tag = { id: number; code: string; name: string }
export type Section = { title: string; bodyMarkdown: string }

/** 참고 문서 (ADR-0005 후속 결정) — 프로젝트·블로그끼리만 연결한다. */
export type RefType = 'PROJECT' | 'BLOG'
export type ReferenceRequest = { type: RefType; id: number }
export type AdminReference = ReferenceRequest & { slug: string; title: string; published: boolean }

export type AdminProjectItem = {
  id: number
  slug: string
  title: string
  featured: boolean
  published: boolean
  displayOrder: number
  periodStart: string
  periodEnd: string | null
  publishedAt: string | null
  updatedAt: string
}

export type ProjectRequest = {
  slug: string
  title: string
  summary: string
  organization: string | null
  position: string | null
  contribution: number | null
  contributionNote: string | null
  periodStart: string
  periodEnd: string | null
  thumbnailUrl: string | null
  githubUrl: string | null
  serviceUrl: string | null
  featured: boolean
  published: boolean
  displayOrder: number
  adminNote: string | null
  highlights: string[]
  skillIds: number[]
  sections: Section[]
  references: ReferenceRequest[]
}

export type AdminProjectDetail = Omit<ProjectRequest, 'references'> & {
  id: number
  references: AdminReference[]
  referencedBy: AdminReference[]
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export type AdminBlogPostItem = {
  id: number
  slug: string
  title: string
  published: boolean
  publishedAt: string | null
  updatedAt: string
}

export type BlogPostRequest = {
  slug: string
  title: string
  summary: string | null
  thumbnailUrl: string | null
  published: boolean
  adminNote: string | null
  categoryId: number
  tagIds: number[]
  skillIds: number[]
  sections: Section[]
  references: ReferenceRequest[]
}

export type AdminBlogPostDetail = Omit<BlogPostRequest, 'references'> & {
  id: number
  references: AdminReference[]
  referencedBy: AdminReference[]
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export type SkillGroup = 'PRIMARY' | 'PROJECT_EXPERIENCE' | 'LEARNING' | 'COLLABORATION'

export type Career = {
  company: string
  role: string | null
  periodStart: string
  periodEnd: string | null
  description: string | null
}

export type ProfileRequest = {
  headline: string
  shortBio: string
  imageUrl: string | null
  githubUrl: string | null
  email: string | null
  careers: Career[]
  skills: { skillId: number; group: SkillGroup }[]
  sections: Section[]
}

export type AdminProfile = ProfileRequest & { id: number; updatedAt: string }
