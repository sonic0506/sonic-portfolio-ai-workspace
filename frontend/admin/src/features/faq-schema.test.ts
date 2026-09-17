import { describe, expect, it } from 'vitest'
import { faqSchema } from './faq-schema'

describe('faqSchema', () => {
  it('앞뒤 공백을 지우고 통과시킨다', () => {
    const parsed = faqSchema.parse({ question: ' 어디 사세요? ', answer: '관악구', published: true, displayOrder: 0 })
    expect(parsed.question).toBe('어디 사세요?')
  })

  it('빈 질문, 긴 답변, 숫자가 아닌 순서를 거부한다', () => {
    const result = faqSchema.safeParse({ question: '  ', answer: 'a'.repeat(3001), published: true, displayOrder: Number.NaN })
    expect(result.success).toBe(false)
    const paths = result.error?.issues.map((i) => i.path[0])
    expect(paths).toEqual(expect.arrayContaining(['question', 'answer', 'displayOrder']))
  })
})
