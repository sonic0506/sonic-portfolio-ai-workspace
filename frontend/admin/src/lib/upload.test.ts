import { afterEach, describe, expect, it, vi } from 'vitest'
import { checkImage, MAX_IMAGE_BYTES, uploadImage } from './upload'

const png = (size = 10) => new File([new Uint8Array(size)], 'logo.png', { type: 'image/png' })
const svg = new File(['<svg/>'], 'icon.svg', { type: 'image/svg+xml' })

describe('upload (ADR-0020)', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('서버와 같은 규칙으로 형식과 크기를 먼저 거른다', () => {
    expect(checkImage(png(), 'THUMBNAIL')).toBeNull()
    expect(checkImage(svg, 'THUMBNAIL')).toMatch(/올릴 수 없습니다/)
    expect(checkImage(svg, 'SKILL_ICON')).toBeNull()
    expect(checkImage(png(MAX_IMAGE_BYTES + 1), 'CONTENT')).toMatch(/10MB/)
  })

  it('허가서를 받아 S3에 PUT하고 공개 주소를 돌려준다', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 1, uploadUrl: 'https://s3.example/put?sig', headers: { 'Content-Type': 'image/png' }, publicUrl: 'https://images.example.com/a.png' }), { status: 201 }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetch)

    await expect(uploadImage(png(42), 'PROFILE')).resolves.toBe('https://images.example.com/a.png')
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ fileName: 'logo.png', contentType: 'image/png', sizeBytes: 42, purpose: 'PROFILE' })
    expect(fetch.mock.calls[1][0]).toBe('https://s3.example/put?sig')
    expect(fetch.mock.calls[1][1]).toMatchObject({ method: 'PUT', headers: { 'Content-Type': 'image/png' } })
  })

  it('S3가 거부하면 실패로 알린다', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({ id: 1, uploadUrl: 'u', headers: {}, publicUrl: 'p' }), { status: 201 }))
        .mockResolvedValueOnce(new Response(null, { status: 403 })),
    )
    await expect(uploadImage(png(), 'CONTENT')).rejects.toThrow('업로드 실패 (403)')
  })
})
