import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Faq } from '@/lib/types'

export const faqsKey = ['faqs'] as const

export function useFaqs() {
  return useQuery({ queryKey: faqsKey, queryFn: () => api<Faq[]>('/api/admin/faqs') })
}
