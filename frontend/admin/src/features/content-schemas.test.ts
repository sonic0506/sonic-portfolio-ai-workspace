import { describe, expect, it } from 'vitest'
import {
  blogPostSchema,
  duplicateSkillIds,
  emptyBlogPost,
  emptyAchievement,
  emptyCareer,
  emptyProfile,
  emptyProject,
  profileSchema,
  profileToForm,
  profileToRequest,
  projectSchema,
  projectToForm,
  projectToRequest,
} from './content-schemas'
import type { AdminProfile, AdminProjectDetail } from '@/lib/types'

const paths = (r: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  r.error?.issues.map((i) => i.path.join('.')) ?? []

describe('projectSchema', () => {
  it('필수값·slug 형식·URL·기여도·기간 역전을 검사한다', () => {
    const r = projectSchema.safeParse({
      ...emptyProject(),
      slug: 'My Project',
      summary: '요약',
      periodStart: '2024-05-01',
      periodEnd: '2024-01-01',
      githubUrl: 'github.com/x',
      contribution: '120',
      highlights: [{ value: ' ' }],
    })
    expect(paths(r)).toEqual(
      expect.arrayContaining(['slug', 'title', 'periodEnd', 'githubUrl', 'contribution', 'highlights.0.value']),
    )
  })

  it('폼 값을 요청으로 바꿀 때 빈 문자열은 null, 숫자는 숫자로 바꾼다', () => {
    const form = projectSchema.parse({
      ...emptyProject(),
      slug: 'viora',
      title: ' 비오라 ',
      summary: '요약',
      periodStart: '2024-01-01',
      contribution: '30',
      displayOrder: '',
      highlights: [{ value: '성과' }],
      skillIds: [3, 1],
      sections: [{ title: ' 개요 ', bodyMarkdown: '본문\n' }],
    })
    const req = projectToRequest(form)
    expect(req).toMatchObject({
      title: '비오라',
      contribution: 30,
      displayOrder: 0,
      organization: null,
      periodEnd: null,
      githubUrl: null,
      highlights: ['성과'],
      skillIds: [3, 1],
      sections: [{ title: '개요', bodyMarkdown: '본문\n' }],
    })
  })

  it('상세 응답 → 폼 → 요청이 같은 값을 유지한다', () => {
    const detail: AdminProjectDetail = {
      id: 1, slug: 'a', title: 't', summary: 's', organization: null, position: '개발',
      contribution: null, contributionNote: null, periodStart: '2024-01-01', periodEnd: null,
      thumbnailUrl: null, githubUrl: 'https://github.com/a', serviceUrl: null,
      featured: true, published: false, displayOrder: 2, adminNote: null,
      highlights: ['h'], skillIds: [1], sections: [], publishedAt: null, createdAt: '', updatedAt: '',
      references: [{ type: 'BLOG', id: 3, slug: 'b', title: '글', published: false }],
      referencedBy: [{ type: 'PROJECT', id: 2, slug: 'p', title: '다른 프로젝트', published: true }],
    }
    const { id, publishedAt, createdAt, updatedAt, referencedBy, ...rest } = detail
    void [id, publishedAt, createdAt, updatedAt, referencedBy]
    // 참고 문서는 {type, id}만 보낸다. 들어오는 연결(referencedBy)은 보내지 않는다.
    expect(projectToRequest(projectToForm(detail))).toEqual({ ...rest, references: [{ type: 'BLOG', id: 3 }] })
  })
})

describe('blogPostSchema', () => {
  it('요약은 비워도 되고 제목은 필수다', () => {
    const r = blogPostSchema.safeParse({ ...emptyBlogPost(), slug: 'post' })
    expect(paths(r)).toEqual(['title', 'categoryId'])
  })
})

describe('profileSchema', () => {
  it('이메일 형식과 경력 기간을 검사한다', () => {
    const r = profileSchema.safeParse({
      ...emptyProfile(),
      headline: 'h',
      shortBio: 'b',
      email: 'not-an-email',
      careers: [{ ...emptyCareer(), company: 'c', periodStart: '2024-02-01', periodEnd: '2023-01-01' }],
    })
    expect(paths(r)).toEqual(['email', 'careers.0.periodEnd'])
  })

  it('경력 아래 주요 성과를 검사하고 요청 모양으로 바꾼다 (ADR-0019)', () => {
    const achievement = { ...emptyAchievement(), title: 'VIORA', periodStart: '2026-07-01', projectId: '7', job: ' 앱 개발 ' }
    const career = { ...emptyCareer(), company: '슬로그업', periodStart: '2021-08-01', employmentType: '정규직', achievements: [achievement] }
    const bad = profileSchema.safeParse({
      ...emptyProfile(), headline: 'h', shortBio: 'b',
      careers: [{ ...career, achievements: [{ ...achievement, title: '', periodEnd: '2026-01-01' }] }],
    })
    expect(paths(bad)).toEqual(['careers.0.achievements.0.title', 'careers.0.achievements.0.periodEnd'])

    const request = profileToRequest({ ...emptyProfile(), headline: 'h', shortBio: 'b', careers: [career] })
    expect(request.careers[0]).toMatchObject({ employmentType: '정규직', position: null })
    expect(request.careers[0].achievements).toEqual([
      { title: 'VIORA', periodStart: '2026-07-01', periodEnd: null, job: '앱 개발', position: null, bodyMarkdown: null, projectId: 7 },
    ])
  })

  it('스킬 그룹을 고정 순서로 펼치고 중복을 찾는다', () => {
    const profile: AdminProfile = {
      id: 1, updatedAt: '', headline: 'h', shortBio: 'b', imageUrl: null, githubUrl: null, email: null,
      careers: [],
      skills: [
        { skillId: 5, group: 'LEARNING' },
        { skillId: 2, group: 'PRIMARY' },
        { skillId: 1, group: 'PRIMARY' },
      ],
      sections: [],
    }
    const form = profileToForm(profile)
    expect(form.skillGroups.PRIMARY).toEqual([2, 1])
    expect(profileToRequest(form).skills).toEqual([
      { skillId: 2, group: 'PRIMARY' },
      { skillId: 1, group: 'PRIMARY' },
      { skillId: 5, group: 'LEARNING' },
    ])
    expect(duplicateSkillIds({ ...form.skillGroups, COLLABORATION: [1] })).toEqual([1])
  })
})
