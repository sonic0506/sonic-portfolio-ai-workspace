// 이미지 업로드(ADR-0020): 백엔드에서 업로드 허가서(presigned PUT)를 받아 브라우저가 S3로 직접 보낸다.
import { api } from '@/lib/api'

export type MediaPurpose = 'PROFILE' | 'THUMBNAIL' | 'CAREER_LOGO' | 'SKILL_ICON' | 'CONTENT'

export type MediaItem = {
  id: number
  url: string
  originalName: string | null
  contentType: string
  sizeBytes: number
  purpose: MediaPurpose
  createdAt: string
}

type UploadTicket = { id: number; uploadUrl: string; headers: Record<string, string>; publicUrl: string }

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const RASTER = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/** 서버와 같은 규칙: svg는 스크립트를 담을 수 있어 기술 로고에만. */
export function acceptedTypes(purpose: MediaPurpose): string[] {
  return purpose === 'SKILL_ICON' ? [...RASTER, 'image/svg+xml'] : RASTER
}

/** 올리기 전에 거를 수 있는 문제를 알려 준다. 문제가 없으면 null. */
export function checkImage(file: File, purpose: MediaPurpose): string | null {
  if (!acceptedTypes(purpose).includes(file.type)) return `${file.type || '알 수 없는 형식'}은(는) 올릴 수 없습니다.`
  if (file.size > MAX_IMAGE_BYTES) return '10MB 이하 이미지만 올릴 수 있습니다.'
  return null
}

/** 허가서를 받아 S3에 올리고, 화면에 쓸 공개 주소를 돌려준다. */
export async function uploadImage(file: File, purpose: MediaPurpose): Promise<string> {
  const problem = checkImage(file, purpose)
  if (problem) throw new Error(problem)
  const ticket = await api<UploadTicket>('/api/admin/media/uploads', {
    method: 'POST',
    body: { fileName: file.name, contentType: file.type, sizeBytes: file.size, purpose },
  })
  // Content-Type과 크기는 서명에 들어 있으므로 그대로 보낸다(크기는 브라우저가 본문으로 채운다).
  const res = await fetch(ticket.uploadUrl, { method: 'PUT', headers: ticket.headers, body: file })
  if (!res.ok) throw new Error(`이미지 저장소 업로드 실패 (${res.status})`)
  return ticket.publicUrl
}
