import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError, readCookie } from './api'

afterEach(() => vi.unstubAllGlobals())

describe('readCookie', () => {
  it('이름이 정확히 같은 쿠키만 읽는다', () => {
    expect(readCookie('XSRF-TOKEN', 'OLD-XSRF-TOKEN=x; XSRF-TOKEN=a%2Bb')).toBe('a+b')
    expect(readCookie('XSRF-TOKEN', 'JSESSIONID=1')).toBeUndefined()
  })
})

describe('api', () => {
  it('변경 요청에 CSRF 헤더를 붙인다', async () => {
    document.cookie = 'XSRF-TOKEN=token-1'
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    await api('/api/admin/logout', { method: 'POST' })
    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect((init.headers as Record<string, string>)['X-XSRF-TOKEN']).toBe('token-1')
    expect(init.credentials).toBe('include')
  })

  it('Problem Detail을 ApiError로 바꾼다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ detail: '없는 질문' }), { status: 400 })),
    )
    await expect(api('/api/admin/faqs', { method: 'POST', body: {} })).rejects.toEqual(new ApiError(400, '없는 질문'))
  })
})
