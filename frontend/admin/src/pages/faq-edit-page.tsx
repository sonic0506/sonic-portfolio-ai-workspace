import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { ErrorText, PageTitle } from '@/components/layout'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { faqSchema, type FaqFormValues } from '@/features/faq-schema'
import { api } from '@/lib/api'
import type { Faq, FaqRequest } from '@/lib/types'
import { faqsKey, useFaqs } from '@/features/faq-queries'

export function FaqEditPage() {
  const { id } = useParams()
  const faqs = useFaqs()
  if (!id) return <FaqForm />
  if (faqs.isPending) return <p className="text-sm text-muted-foreground">불러오는 중…</p>
  const faq = faqs.data?.find((f) => f.id === Number(id))
  if (!faq) return <p className="text-sm text-muted-foreground">FAQ를 찾을 수 없습니다.</p>
  return <FaqForm faq={faq} />
}

function FaqForm({ faq }: { faq?: Faq }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [params] = useSearchParams()
  const location = useLocation()
  const fromId = !faq && params.get('from') ? Number(params.get('from')) : undefined
  const fromQuestion = (location.state as { question?: string } | null)?.question

  const form = useForm<FaqFormValues>({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      question: faq?.question ?? fromQuestion ?? '',
      answer: faq?.answer ?? '',
      published: faq?.published ?? true,
      displayOrder: faq?.displayOrder ?? 0,
    },
  })
  const { errors } = form.formState

  const save = useMutation({
    mutationFn: (values: FaqFormValues) => {
      const body: FaqRequest = { ...values, fromUnansweredId: fromId }
      return faq
        ? api<Faq>(`/api/admin/faqs/${faq.id}`, { method: 'PUT', body })
        : api<Faq>('/api/admin/faqs', { method: 'POST', body })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: faqsKey })
      if (fromId) await queryClient.invalidateQueries({ queryKey: ['unanswered'] })
      navigate(fromId ? '/unanswered' : '/faqs')
    },
  })

  return (
    <>
      <PageTitle>{faq ? `FAQ #${faq.id} 수정` : '새 FAQ'}</PageTitle>
      {fromId && (
        <p className="mb-4 text-sm text-muted-foreground">
          저장하면 답하지 못한 질문 #{fromId}이(가) 해결로 바뀝니다.
        </p>
      )}
      <form className="max-w-2xl space-y-5" onSubmit={form.handleSubmit((values) => save.mutate(values))} noValidate>
        <Field label="질문" htmlFor="question" error={errors.question?.message}>
          <Input id="question" aria-invalid={!!errors.question} {...form.register('question')} />
        </Field>
        <Field label="답변" htmlFor="answer" error={errors.answer?.message}>
          <Textarea id="answer" rows={6} aria-invalid={!!errors.answer} {...form.register('answer')} />
        </Field>
        <div className="flex flex-wrap items-end gap-6">
          <Field label="표시 순서" htmlFor="displayOrder" error={errors.displayOrder?.message}>
            <Input
              id="displayOrder"
              type="number"
              min={0}
              className="w-28"
              aria-invalid={!!errors.displayOrder}
              {...form.register('displayOrder', { valueAsNumber: true })}
            />
          </Field>
          <label className="flex h-9 items-center gap-2 text-sm">
            <input type="checkbox" className="size-4" {...form.register('published')} />
            공개 (채팅 답변에 사용)
          </label>
        </div>
        <ErrorText error={save.error} />
        <div className="flex gap-2">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? '저장 중…' : '저장'}
          </Button>
          <Link to={fromId ? '/unanswered' : '/faqs'} className={buttonVariants({ variant: 'outline' })}>
            취소
          </Link>
        </div>
      </form>
    </>
  )
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
