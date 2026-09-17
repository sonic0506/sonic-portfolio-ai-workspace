import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import { ErrorText, PageTitle } from '@/components/layout'
import { Loading } from '@/components/loading'
import { IndexStatusBadge } from '@/components/status-badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import { faqsKey, useFaqs } from '@/features/faq-queries'

export function FaqListPage() {
  const faqs = useFaqs()
  const queryClient = useQueryClient()
  const remove = useMutation({
    mutationFn: (id: number) => api<void>(`/api/admin/faqs/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: faqsKey }),
  })

  return (
    <>
      <PageTitle
        actions={
          <Link to="/faqs/new" className={buttonVariants()}>
            새 FAQ
          </Link>
        }
      >
        FAQ
      </PageTitle>
      <p className="mb-4 text-sm text-muted-foreground">
        채팅에서 같은 뜻의 질문이 오면 등록한 답변을 그대로 씁니다. 저장하면 색인이 다시 만들어집니다.
      </p>
      <ErrorText error={faqs.error ?? remove.error} />
      {faqs.isPending && <Loading />}
      <div className={faqs.isPending ? 'hidden' : 'overflow-x-auto rounded-lg border'}>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-3 py-2">순서</th>
              <th className="px-3 py-2">질문 / 답변</th>
              <th className="px-3 py-2">공개</th>
              <th className="px-3 py-2">색인</th>
              <th className="px-3 py-2">수정</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {faqs.data?.map((faq) => (
              <tr key={faq.id} className="border-t align-top">
                <td className="px-3 py-2">{faq.displayOrder}</td>
                <td className="px-3 py-2">
                  <Link to={`/faqs/${faq.id}`} className="font-medium hover:underline">
                    {faq.question}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-muted-foreground">{faq.answer}</p>
                </td>
                <td className="px-3 py-2">{faq.published ? '공개' : '비공개'}</td>
                <td className="px-3 py-2">
                  <IndexStatusBadge status={faq.indexStatus} />
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{formatDateTime(faq.updatedAt)}</td>
                <td className="px-3 py-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    disabled={remove.isPending}
                    onClick={() => window.confirm('이 FAQ를 삭제할까요?') && remove.mutate(faq.id)}
                  >
                    삭제
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {faqs.data?.length === 0 && <p className="p-4 text-sm text-muted-foreground">등록된 FAQ가 없습니다.</p>}
      </div>
    </>
  )
}
