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
