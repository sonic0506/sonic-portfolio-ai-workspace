import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { AdminBlogPostItem, AdminProjectItem, Category, Skill, Tag } from '@/lib/types'

export const keys = {
  skills: ['skills'] as const,
  categories: ['categories'] as const,
  tags: ['tags'] as const,
  projects: ['projects'] as const,
  project: (id: number) => ['projects', id] as const,
  posts: ['posts'] as const,
  post: (id: number) => ['posts', id] as const,
  profile: ['profile'] as const,
  rag: ['rag', 'documents'] as const,
}

// 기술 목록은 공개 API를 그대로 쓴다(API_DESIGN Skill 관리).
export const useSkills = () => useQuery({ queryKey: keys.skills, queryFn: () => api<Skill[]>('/api/skills') })
export const useCategories = () =>
  useQuery({ queryKey: keys.categories, queryFn: () => api<Category[]>('/api/admin/categories') })
export const useTags = () => useQuery({ queryKey: keys.tags, queryFn: () => api<Tag[]>('/api/admin/tags') })

// 목록 화면과 같은 키를 써서 캐시를 함께 쓴다(참고 문서 선택 후보).
export const useProjects = () =>
  useQuery({ queryKey: keys.projects, queryFn: () => api<AdminProjectItem[]>('/api/admin/projects') })
export const usePosts = () =>
  useQuery({ queryKey: keys.posts, queryFn: () => api<AdminBlogPostItem[]>('/api/admin/blog/posts') })
