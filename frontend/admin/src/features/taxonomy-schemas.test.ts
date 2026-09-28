import { describe, expect, it } from 'vitest'
import { categoryOrderSchema, taxonomySchema, toTaxonomyRequest } from './taxonomy-schemas'

describe('taxonomy', () => {
  it('코드 형식을 검사한다', () => {
    const color = '#8B8B94'
    expect(taxonomySchema.safeParse({ code: 'Spring Boot', name: 'Spring', extra: '', color }).success).toBe(false)
    expect(taxonomySchema.safeParse({ code: 'spring-boot', name: 'Spring Boot', extra: '', color }).success).toBe(true)
    expect(taxonomySchema.safeParse({ code: 'fe', name: 'FE', extra: '', color: 'red' }).success).toBe(false)
    expect(categoryOrderSchema.safeParse('-1').success).toBe(false)
  })

  it('종류별 요청 모양을 만든다', () => {
    const f = { code: ' java ', name: ' Java ', extra: ' ', color: '#c7772a' }
    expect(toTaxonomyRequest('skill', f)).toEqual({ code: 'java', name: 'Java', iconKey: null })
    expect(toTaxonomyRequest('category', { ...f, extra: '3' })).toEqual({ code: 'java', name: 'Java', displayOrder: 3, color: '#C7772A' })
    expect(toTaxonomyRequest('tag', f)).toEqual({ code: 'java', name: 'Java' })
  })
})
