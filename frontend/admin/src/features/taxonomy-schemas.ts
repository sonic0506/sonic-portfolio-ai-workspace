import { z } from 'zod'
import { codeField } from './content-schemas'

// Skill: {code, name, iconKey}, Category: {code, name, displayOrder, color, ragEnabled}, Tag: {code, name}
export const taxonomySchema = z.object({
  code: codeField,
  name: z.string().trim().min(1, '이름을 입력하세요.').max(100, '100자 이하로 입력하세요.'),
  extra: z.string().trim().max(100, '100자 이하로 입력하세요.'),
  // 카테고리 점 색(#RRGGBB). 다른 종류는 쓰지 않지만 폼 모양을 하나로 둔다.
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, '#RRGGBB 형식으로 입력하세요.'),
  // 카테고리 글을 채팅 근거로 쓸지(ADR-0018). 다른 종류는 쓰지 않는다.
  ragEnabled: z.boolean(),
})

/** 서버 기본값(V5)과 같은 회색. */
export const DEFAULT_CATEGORY_COLOR = '#8B8B94'

export type TaxonomyForm = z.infer<typeof taxonomySchema>

export type TaxonomyKind = 'skill' | 'category' | 'tag'

export const categoryOrderSchema = z
  .string()
  .trim()
  .refine((v) => v === '' || /^\d+$/.test(v), '0 이상의 정수를 입력하세요.')

export function toTaxonomyRequest(kind: TaxonomyKind, f: TaxonomyForm) {
  const base = { code: f.code.trim(), name: f.name.trim() }
  if (kind === 'skill') return { ...base, iconKey: f.extra.trim() === '' ? null : f.extra.trim() }
  if (kind === 'category')
    return {
      ...base,
      displayOrder: f.extra.trim() === '' ? 0 : Number(f.extra),
      color: f.color.toUpperCase(),
      ragEnabled: f.ragEnabled,
    }
  return base
}
