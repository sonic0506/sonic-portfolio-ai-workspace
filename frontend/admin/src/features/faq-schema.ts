import { z } from 'zod'

// 백엔드 FaqRequest 검증과 맞춘다(ADR-0014).
export const faqSchema = z.object({
  question: z.string().trim().min(1, '질문을 입력하세요.').max(300, '질문은 300자 이하입니다.'),
  answer: z.string().trim().min(1, '답변을 입력하세요.').max(3000, '답변은 3000자 이하입니다.'),
  published: z.boolean(),
  displayOrder: z.number({ error: '숫자를 입력하세요.' }).int('정수를 입력하세요.').min(0, '0 이상이어야 합니다.'),
})

export type FaqFormValues = z.infer<typeof faqSchema>
