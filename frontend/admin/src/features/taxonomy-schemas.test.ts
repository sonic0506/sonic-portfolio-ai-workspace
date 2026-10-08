import { describe, expect, it } from 'vitest'
import { categoryOrderSchema, taxonomySchema, toTaxonomyRequest } from './taxonomy-schemas'

describe('taxonomy', () => {
  it('코드 형식을 검사한다', () => {
    const color = '#8B8B94'
    expect(taxonomySchema.safeParse({ code: 'Spring Boot', name: 'Spring', extra: '', color, ragEnabled: true, iconUrl: '' }).success).toBe(false)
    expect(taxonomySchema.safeParse({ code: 'spring-boot', name: 'Spring Boot', extra: '', color, ragEnabled: true, iconUrl: '' }).success).toBe(true)
    expect(taxonomySchema.safeParse({ code: 'fe', name: 'FE', extra: '', color: 'red', ragEnabled: true, iconUrl: '' }).success).toBe(false)
    expect(categoryOrderSchema.safeParse('-1').success).toBe(false)
  })

  it('종류별 요청 모양을 만든다', () => {
    const f = { code: ' java ', name: ' Java ', extra: ' ', color: '#c7772a', ragEnabled: false, iconUrl: '' }
    expect(toTaxonomyRequest('skill', f)).toEqual({ code: 'java', name: 'Java', iconKey: null, iconUrl: null })
    // ADR-0020: 올린 로고 주소는 기술 요청에만 실린다
    expect(toTaxonomyRequest('skill', { ...f, iconUrl: ' https://images.example.com/java.svg ' })).toMatchObject({ iconUrl: 'https://images.example.com/java.svg' })
    expect(toTaxonomyRequest('category', { ...f, extra: '3' })).toEqual({
      code: 'java',
      name: 'Java',
      displayOrder: 3,
      color: '#C7772A',
      ragEnabled: false,
    })
    expect(toTaxonomyRequest('tag', f)).toEqual({ code: 'java', name: 'Java' })
  })
})
