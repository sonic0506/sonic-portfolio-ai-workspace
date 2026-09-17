import { describe, expect, it } from 'vitest'
import { filterCandidates } from './reference-picker'

const candidates = [
  { type: 'PROJECT' as const, id: 1, title: '싱크마스터', slug: 'syncmaster', published: true },
  { type: 'BLOG' as const, id: 1, title: 'Web Serial 정리', slug: 'web-serial-usb', published: true },
  { type: 'BLOG' as const, id: 2, title: '오프라인 우선', slug: 'offline-first', published: false },
]

describe('filterCandidates', () => {
  it('자기 자신과 이미 고른 문서를 빼고, 같은 id라도 type이 다르면 구분한다', () => {
    const result = filterCandidates(candidates, [{ type: 'BLOG', id: 2 }], '', { type: 'PROJECT', id: 1 })
    expect(result.map((c) => `${c.type}-${c.id}`)).toEqual(['BLOG-1'])
  })

  it('제목과 slug로 찾는다', () => {
    expect(filterCandidates(candidates, [], 'web').map((c) => c.slug)).toEqual(['web-serial-usb'])
    expect(filterCandidates(candidates, [], '싱크').map((c) => c.slug)).toEqual(['syncmaster'])
  })
})
