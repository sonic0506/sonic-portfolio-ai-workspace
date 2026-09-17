import { z } from 'zod'
import { codeField } from './content-schemas'

// Skill: {code, name, iconKey}, Category: {code, name, displayOrder}, Tag: {code, name}
export const taxonomySchema = z.object({
  code: codeField,
  name: z.string().trim().min(1, '이름을 입력하세요.').max(100, '100자 이하로 입력하세요.'),
  extra: z.string().trim().max(100, '100자 이하로 입력하세요.'),
})

export type TaxonomyForm = z.infer<typeof taxonomySchema>

export type TaxonomyKind = 'skill' | 'category' | 'tag'

export const categoryOrderSchema = z
  .string()
  .trim()
  .refine((v) => v === '' || /^\d+$/.test(v), '0 이상의 정수를 입력하세요.')

export function toTaxonomyRequest(kind: TaxonomyKind, f: TaxonomyForm) {
  const base = { code: f.code.trim(), name: f.name.trim() }
  if (kind === 'skill') return { ...base, iconKey: f.extra.trim() === '' ? null : f.extra.trim() }
  if (kind === 'category') return { ...base, displayOrder: f.extra.trim() === '' ? 0 : Number(f.extra) }
  return base
}
