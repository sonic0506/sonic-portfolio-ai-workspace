import { z } from 'zod'
import type {
  AdminBlogPostDetail,
  AdminProfile,
  AdminProjectDetail,
  BlogPostRequest,
  ProfileRequest,
  ProjectRequest,
  SkillGroup,
} from '@/lib/types'

// 폼 값은 입력 그대로(문자열) 두고, 저장할 때 API 요청 모양으로 바꾼다.
// 규칙은 백엔드 요청 record의 검증과 맞춘다(backend/.../*AdminRequest.java).

const CODE = /^[a-z0-9]+(-[a-z0-9]+)*$/
const DATE = /^\d{4}-\d{2}-\d{2}$/
const URL = /^https?:\/\/\S+$/

const required = (max: number, label: string) =>
  z.string().trim().min(1, `${label}을(를) 입력하세요.`).max(max, `${max}자 이하로 입력하세요.`)
const optional = (max: number) => z.string().trim().max(max, `${max}자 이하로 입력하세요.`)
const optionalUrl = z
  .string()
  .trim()
  .max(500, '500자 이하로 입력하세요.')
  .refine((v) => v === '' || URL.test(v), 'http:// 또는 https://로 시작하는 주소를 입력하세요.')
const slug = z
  .string()
  .trim()
  .min(1, 'slug를 입력하세요.')
  .max(100, '100자 이하로 입력하세요.')
  .regex(CODE, '소문자·숫자와 하이픈만 쓸 수 있습니다(예: my-project).')
export const codeField = z
  .string()
  .trim()
  .min(1, '코드를 입력하세요.')
  .max(60, '60자 이하로 입력하세요.')
  .regex(CODE, '소문자·숫자와 하이픈만 쓸 수 있습니다(예: spring-boot).')
const requiredDate = z.string().regex(DATE, '날짜를 입력하세요.')
const optionalDate = z.string().refine((v) => v === '' || DATE.test(v), '날짜 형식이 올바르지 않습니다.')
const intString = (min: number, max: number, message: string) =>
  z.string().trim().refine((v) => v === '' || (/^\d+$/.test(v) && Number(v) >= min && Number(v) <= max), message)

export const referencesSchema = z.array(z.object({ type: z.enum(['PROJECT', 'BLOG']), id: z.number() }))
const toReferences = (refs: { type: 'PROJECT' | 'BLOG'; id: number }[]) => refs.map(({ type, id }) => ({ type, id }))

export const sectionSchema = z.object({
  title: required(200, '섹션 제목'),
  bodyMarkdown: z.string().max(100_000, '본문이 너무 깁니다.'),
})

/** 기간 역전은 종료일 칸에 표시한다. */
const periodCheck = <T extends { periodStart: string; periodEnd: string }>(v: T, ctx: z.RefinementCtx) => {
  if (v.periodEnd && v.periodStart && v.periodEnd < v.periodStart) {
    ctx.addIssue({ code: 'custom', path: ['periodEnd'], message: '종료일이 시작일보다 빠릅니다.' })
  }
}

export const projectSchema = z
  .object({
    slug,
    title: required(200, '제목'),
    summary: required(500, '요약'),
    organization: optional(100),
    position: optional(100),
    contribution: intString(0, 100, '0~100 사이 숫자를 입력하세요.'),
    contributionNote: optional(200),
    periodStart: requiredDate,
    periodEnd: optionalDate,
    thumbnailUrl: optionalUrl,
    githubUrl: optionalUrl,
    serviceUrl: optionalUrl,
    featured: z.boolean(),
    published: z.boolean(),
    displayOrder: intString(0, 100_000, '0 이상의 정수를 입력하세요.'),
    adminNote: optional(5000),
    highlights: z.array(z.object({ value: required(500, '하이라이트') })),
    skillIds: z.array(z.number()),
    sections: z.array(sectionSchema),
    references: referencesSchema,
  })
  .superRefine(periodCheck)

export type ProjectForm = z.infer<typeof projectSchema>

export const blogPostSchema = z.object({
  slug,
  title: required(200, '제목'),
  summary: optional(500),
  thumbnailUrl: optionalUrl,
  published: z.boolean(),
  adminNote: optional(5000),
  categoryIds: z.array(z.number()),
  tagIds: z.array(z.number()),
  skillIds: z.array(z.number()),
  sections: z.array(sectionSchema),
  references: referencesSchema,
})

export type BlogPostForm = z.infer<typeof blogPostSchema>

export const SKILL_GROUPS: { value: SkillGroup; label: string }[] = [
  { value: 'PRIMARY', label: '주력 기술' },
  { value: 'PROJECT_EXPERIENCE', label: '프로젝트 경험' },
  { value: 'LEARNING', label: '학습 중' },
  { value: 'COLLABORATION', label: '협업 도구' },
]

export const careerSchema = z
  .object({
    company: required(200, '회사'),
    role: optional(200),
    periodStart: requiredDate,
    periodEnd: optionalDate,
    description: optional(5000),
  })
  .superRefine(periodCheck)

export const profileSchema = z.object({
  headline: required(200, '한 줄 소개'),
  shortBio: required(1000, '짧은 소개'),
  imageUrl: optionalUrl,
  githubUrl: optionalUrl,
  email: z
    .string()
    .trim()
    .max(200, '200자 이하로 입력하세요.')
    .refine((v) => v === '' || z.email().safeParse(v).success, '이메일 형식이 올바르지 않습니다.'),
  careers: z.array(careerSchema),
  // 그룹별로 선택 순서가 표시 순서다.
  skillGroups: z.object({
    PRIMARY: z.array(z.number()),
    PROJECT_EXPERIENCE: z.array(z.number()),
    LEARNING: z.array(z.number()),
    COLLABORATION: z.array(z.number()),
  }),
  sections: z.array(sectionSchema),
})

export type ProfileForm = z.infer<typeof profileSchema>

const orNull = (v: string) => (v.trim() === '' ? null : v.trim())
const orEmpty = (v: string | null | undefined) => v ?? ''

// ---- Project ----

export function emptyProject(): ProjectForm {
  return {
    slug: '', title: '', summary: '', organization: '', position: '', contribution: '', contributionNote: '',
    periodStart: '', periodEnd: '', thumbnailUrl: '', githubUrl: '', serviceUrl: '',
    featured: false, published: false, displayOrder: '0', adminNote: '',
    highlights: [], skillIds: [], sections: [], references: [],
  }
}

export function projectToForm(p: AdminProjectDetail): ProjectForm {
  return {
    slug: p.slug, title: p.title, summary: p.summary,
    organization: orEmpty(p.organization), position: orEmpty(p.position),
    contribution: p.contribution === null ? '' : String(p.contribution),
    contributionNote: orEmpty(p.contributionNote),
    periodStart: p.periodStart, periodEnd: orEmpty(p.periodEnd),
    thumbnailUrl: orEmpty(p.thumbnailUrl), githubUrl: orEmpty(p.githubUrl), serviceUrl: orEmpty(p.serviceUrl),
    featured: p.featured, published: p.published, displayOrder: String(p.displayOrder),
    adminNote: orEmpty(p.adminNote),
    highlights: p.highlights.map((value) => ({ value })),
    skillIds: p.skillIds, sections: p.sections,
    references: toReferences(p.references),
  }
}

export function projectToRequest(f: ProjectForm): ProjectRequest {
  return {
    slug: f.slug.trim(), title: f.title.trim(), summary: f.summary.trim(),
    organization: orNull(f.organization), position: orNull(f.position),
    contribution: f.contribution.trim() === '' ? null : Number(f.contribution),
    contributionNote: orNull(f.contributionNote),
    periodStart: f.periodStart, periodEnd: orNull(f.periodEnd),
    thumbnailUrl: orNull(f.thumbnailUrl), githubUrl: orNull(f.githubUrl), serviceUrl: orNull(f.serviceUrl),
    featured: f.featured, published: f.published,
    displayOrder: f.displayOrder.trim() === '' ? 0 : Number(f.displayOrder),
    adminNote: orNull(f.adminNote),
    highlights: f.highlights.map((h) => h.value.trim()),
    skillIds: f.skillIds,
    sections: f.sections.map((s) => ({ title: s.title.trim(), bodyMarkdown: s.bodyMarkdown })),
    references: toReferences(f.references),
  }
}

// ---- Blog ----

export function emptyBlogPost(): BlogPostForm {
  return {
    slug: '', title: '', summary: '', thumbnailUrl: '', published: false, adminNote: '',
    categoryIds: [], tagIds: [], skillIds: [], sections: [], references: [],
  }
}

export function blogPostToForm(p: AdminBlogPostDetail): BlogPostForm {
  return {
    slug: p.slug, title: p.title, summary: orEmpty(p.summary), thumbnailUrl: orEmpty(p.thumbnailUrl),
    published: p.published, adminNote: orEmpty(p.adminNote),
    categoryIds: p.categoryIds, tagIds: p.tagIds, skillIds: p.skillIds, sections: p.sections,
    references: toReferences(p.references),
  }
}

export function blogPostToRequest(f: BlogPostForm): BlogPostRequest {
  return {
    slug: f.slug.trim(), title: f.title.trim(), summary: orNull(f.summary), thumbnailUrl: orNull(f.thumbnailUrl),
    published: f.published, adminNote: orNull(f.adminNote),
    categoryIds: f.categoryIds, tagIds: f.tagIds, skillIds: f.skillIds,
    sections: f.sections.map((s) => ({ title: s.title.trim(), bodyMarkdown: s.bodyMarkdown })),
    references: toReferences(f.references),
  }
}

// ---- Profile ----

export function emptyProfile(): ProfileForm {
  return {
    headline: '', shortBio: '', imageUrl: '', githubUrl: '', email: '', careers: [],
    skillGroups: { PRIMARY: [], PROJECT_EXPERIENCE: [], LEARNING: [], COLLABORATION: [] },
    sections: [],
  }
}

export function profileToForm(p: AdminProfile): ProfileForm {
  const groups = emptyProfile().skillGroups
  for (const s of p.skills) groups[s.group].push(s.skillId)
  return {
    headline: p.headline, shortBio: p.shortBio,
    imageUrl: orEmpty(p.imageUrl), githubUrl: orEmpty(p.githubUrl), email: orEmpty(p.email),
    careers: p.careers.map((c) => ({
      company: c.company, role: orEmpty(c.role), periodStart: c.periodStart,
      periodEnd: orEmpty(c.periodEnd), description: orEmpty(c.description),
    })),
    skillGroups: groups,
    sections: p.sections,
  }
}

export function profileToRequest(f: ProfileForm): ProfileRequest {
  return {
    headline: f.headline.trim(), shortBio: f.shortBio.trim(),
    imageUrl: orNull(f.imageUrl), githubUrl: orNull(f.githubUrl), email: orNull(f.email),
    careers: f.careers.map((c) => ({
      company: c.company.trim(), role: orNull(c.role), periodStart: c.periodStart,
      periodEnd: orNull(c.periodEnd), description: orNull(c.description),
    })),
    skills: SKILL_GROUPS.flatMap(({ value }) => f.skillGroups[value].map((skillId) => ({ skillId, group: value }))),
    sections: f.sections.map((s) => ({ title: s.title.trim(), bodyMarkdown: s.bodyMarkdown })),
  }
}

/** 한 기술은 프로필에서 한 그룹에만 둘 수 있다(백엔드 400). */
export function duplicateSkillIds(groups: ProfileForm['skillGroups']): number[] {
  const all = SKILL_GROUPS.flatMap(({ value }) => groups[value])
  return [...new Set(all.filter((id, i) => all.indexOf(id) !== i))]
}
