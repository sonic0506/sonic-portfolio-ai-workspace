import { describe, expect, it } from 'vitest'
import { categoryOrderSchema, taxonomySchema, toTaxonomyRequest } from './taxonomy-schemas'

describe('taxonomy', () => {
  it('코드 형식을 검사한다', () => {
    expect(taxonomySchema.safeParse({ code: 'Spring Boot', name: 'Spring', extra: '' }).success).toBe(false)
    expect(taxonomySchema.safeParse({ code: 'spring-boot', name: 'Spring Boot', extra: '' }).success).toBe(true)
    expect(categoryOrderSchema.safeParse('-1').success).toBe(false)
  })

  it('종류별 요청 모양을 만든다', () => {
    const f = { code: ' java ', name: ' Java ', extra: ' ' }
    expect(toTaxonomyRequest('skill', f)).toEqual({ code: 'java', name: 'Java', iconKey: null })
    expect(toTaxonomyRequest('category', { ...f, extra: '3' })).toEqual({ code: 'java', name: 'Java', displayOrder: 3 })
    expect(toTaxonomyRequest('tag', f)).toEqual({ code: 'java', name: 'Java' })
  })
})
