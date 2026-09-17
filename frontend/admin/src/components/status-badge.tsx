import { Badge } from '@/components/ui/badge'
import type { IndexStatus } from '@/lib/types'

const LABEL: Record<IndexStatus, string> = {
  PENDING: '대기',
  INDEXING: '색인 중',
  READY: '완료',
  FAILED: '실패',
}

export function IndexStatusBadge({ status }: { status: IndexStatus | null }) {
  if (!status) return <Badge variant="outline">-</Badge>
  return (
    <Badge variant={status === 'READY' ? 'secondary' : 'outline'} className={status === 'FAILED' ? 'text-destructive' : ''}>
      {LABEL[status]}
    </Badge>
  )
}
