import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router'
import { ErrorText, PageTitle } from '@/components/layout'
import { Loading, Spinner } from '@/components/loading'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import type { Page, Unanswered, UnansweredStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const STATUS_LABEL: Record<UnansweredStatus, string> = { OPEN: '미처리', RESOLVED: '해결', IGNORED: '무시' }
const REASON_LABEL = { NO_EVIDENCE: '근거 없음', NO_CITATION: '인용 없음' } as const
const SIZE = 20

export function UnansweredPage() {
  const [params, setParams] = useSearchParams()
  const status = (params.get('status') as UnansweredStatus | null) ?? 'OPEN'
  const page = Number(params.get('page') ?? 0)
  const list = useQuery({
    queryKey: ['unanswered', status, page],
    queryFn: () => api<Page<Unanswered>>(`/api/admin/chat/unanswered?status=${status}&page=${page}&size=${SIZE}`),
    placeholderData: keepPreviousData,
  })
  const lastPage = list.data ? Math.max(0, Math.ceil(list.data.totalElements / SIZE) - 1) : 0

  return (
    <>
      <PageTitle actions={list.isFetching && !list.isPending ? <Spinner className="text-muted-foreground" /> : null}>
        답하지 못한 질문
      </PageTitle>
      <div className="mb-4 flex gap-2">
        {(Object.keys(STATUS_LABEL) as UnansweredStatus[]).map((s) => (
          <Button key={s} size="sm" variant={s === status ? 'default' : 'outline'} onClick={() => setParams({ status: s })}>
            {STATUS_LABEL[s]}
          </Button>
        ))}
      </div>
      <ErrorText error={list.error} />
      {list.isPending && <Loading />}
      {list.data?.items.length === 0 && <p className="text-sm text-muted-foreground">해당하는 질문이 없습니다.</p>}
      <div className="space-y-4">
        {list.data?.items.map((item) => (
          <UnansweredCard key={item.id} item={item} />
        ))}
      </div>
      {lastPage > 0 && (
        <div className="mt-6 flex items-center justify-center gap-3 text-sm">
          <Button size="sm" variant="outline" disabled={page <= 0} onClick={() => setParams({ status, page: String(page - 1) })}>
            이전
          </Button>
          <span>
            {page + 1} / {lastPage + 1}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= lastPage}
            onClick={() => setParams({ status, page: String(page + 1) })}
          >
            다음
          </Button>
        </div>
      )}
    </>
  )
}

function UnansweredCard({ item }: { item: Unanswered }) {
  const queryClient = useQueryClient()
  const [note, setNote] = useState(item.adminNote ?? '')
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['unanswered'] })
  const update = useMutation({
    mutationFn: (status: UnansweredStatus) =>
      api<Unanswered>(`/api/admin/chat/unanswered/${item.id}`, {
        method: 'PUT',
        body: { status, adminNote: note.trim() || null },
      }),
    onSuccess: refresh,
  })
  const remove = useMutation({
    mutationFn: () => api<void>(`/api/admin/chat/unanswered/${item.id}`, { method: 'DELETE' }),
    onSuccess: refresh,
  })
  const busy = update.isPending || remove.isPending

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>#{item.id}</span>
          <span>{formatDateTime(item.createdAt)}</span>
          <Badge variant="outline">{REASON_LABEL[item.reason]}</Badge>
          {item.inActiveSession && <Badge variant="secondary">대화 진행 중</Badge>}
          {item.handledAt && <span>처리 {formatDateTime(item.handledAt)}</span>}
        </div>
        <p className="text-base font-medium">{item.question}</p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <details>
          <summary className="cursor-pointer text-muted-foreground">당시 답변 보기</summary>
          <p className="mt-2 rounded-md bg-muted p-3 whitespace-pre-wrap">{item.answer}</p>
        </details>
        {item.retrieved.length > 0 && (
          <div>
            <p className="mb-1 text-xs text-muted-foreground">검색된 문서 (코사인 거리, 작을수록 가까움)</p>
            <ul className="flex flex-wrap gap-1.5">
              {item.retrieved.map((r) => (
                <li key={`${r.type}:${r.slug}`}>
                  <Badge variant="outline">
                    {r.title} · {r.distance.toFixed(3)}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Textarea value={note} maxLength={2000} rows={2} placeholder="메모" onChange={(e) => setNote(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/faqs/new?from=${item.id}`}
            state={{ question: item.question }}
            className={cn(buttonVariants({ size: 'sm' }))}
          >
            FAQ로 등록
          </Link>
          {item.status !== 'RESOLVED' && (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => update.mutate('RESOLVED')}>
              해결로 표시
            </Button>
          )}
          {item.status !== 'IGNORED' && (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => update.mutate('IGNORED')}>
              무시
            </Button>
          )}
          {item.status !== 'OPEN' && (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => update.mutate('OPEN')}>
              다시 열기
            </Button>
          )}
          {item.status === 'OPEN' && item.adminNote !== (note.trim() || null) && (
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => update.mutate('OPEN')}>
              메모 저장
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            disabled={busy}
            onClick={() => window.confirm('이 질문 기록을 삭제할까요?') && remove.mutate()}
          >
            삭제
          </Button>
        </div>
        <ErrorText error={update.error ?? remove.error} />
      </CardContent>
    </Card>
  )
}
