import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ErrorText, PageTitle } from '@/components/layout'
import { IndexStatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import type { RagDocument, ReindexResult } from '@/lib/types'

const key = ['rag', 'documents'] as const

export function RagPage() {
  const queryClient = useQueryClient()
  const documents = useQuery({
    queryKey: key,
    queryFn: () => api<RagDocument[]>('/api/admin/rag/documents'),
    // 색인이 진행 중이면 자동으로 다시 읽는다.
    refetchInterval: (query) =>
      query.state.data?.some((d) => d.indexStatus === 'PENDING' || d.indexStatus === 'INDEXING') ? 3000 : false,
  })
  const reindex = useMutation({
    mutationFn: (rebuild: boolean) =>
      api<ReindexResult>(`/api/admin/rag/reindex${rebuild ? '?rebuild=true' : ''}`, { method: 'POST' }),
    onSuccess: (result) => queryClient.setQueryData(key, result.documents),
  })

  const result = reindex.data
  return (
    <>
      <PageTitle
        actions={
          <>
            <Button variant="outline" disabled={reindex.isPending} onClick={() => reindex.mutate(false)}>
              대기·실패 문서 색인
            </Button>
            <Button
              disabled={reindex.isPending}
              onClick={() => {
                if (window.confirm('모든 문서를 다시 투영하고 전부 다시 색인합니다. 임베딩 비용이 발생합니다. 진행할까요?')) {
                  reindex.mutate(true)
                }
              }}
            >
              전체 재색인
            </Button>
          </>
        }
      >
        색인 상태
      </PageTitle>

      {reindex.isPending && <p className="mb-4 text-sm text-muted-foreground">색인 중…</p>}
      {result && (
        <p className="mb-4 text-sm">
          {result.embeddingEnabled
            ? `색인 ${result.indexed}건, 실패 ${result.failed}건, 건너뜀 ${result.skipped}건`
            : '임베딩이 꺼져 있어 문서 투영만 했습니다.'}
        </p>
      )}
      <ErrorText error={documents.error ?? reindex.error} />

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-3 py-2">유형</th>
              <th className="px-3 py-2">제목</th>
              <th className="px-3 py-2">공개</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2 text-right">청크</th>
              <th className="px-3 py-2">색인 시각</th>
            </tr>
          </thead>
          <tbody>
            {documents.data?.map((d) => (
              <tr key={d.id} className="border-t align-top">
                <td className="px-3 py-2 text-muted-foreground">{d.type}</td>
                <td className="px-3 py-2">
                  {d.title}
                  {d.indexError && <p className="mt-1 text-xs text-destructive">{d.indexError}</p>}
                </td>
                <td className="px-3 py-2">{d.visible ? '공개' : '비공개'}</td>
                <td className="px-3 py-2">
                  <IndexStatusBadge status={d.indexStatus} />
                </td>
                <td className="px-3 py-2 text-right">{d.chunkCount}</td>
                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{formatDateTime(d.indexedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {documents.data?.length === 0 && <p className="p-4 text-sm text-muted-foreground">문서가 없습니다.</p>}
      </div>
    </>
  )
}
