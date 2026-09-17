import { X } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Option = { id: number; code: string; name: string }

/**
 * 여러 항목 선택. 선택한 순서가 표시 순서이며 칩의 ✕로 뺀다.
 * disabledIds: 다른 곳에서 이미 쓰여 고를 수 없는 항목(프로필 스킬 그룹).
 */
export function IdPicker({
  options,
  value,
  onChange,
  disabledIds = [],
  placeholder = '검색',
}: {
  options: Option[]
  value: number[]
  onChange: (ids: number[]) => void
  disabledIds?: number[]
  placeholder?: string
}) {
  const [query, setQuery] = useState('')
  const byId = new Map(options.map((o) => [o.id, o]))
  const q = query.trim().toLowerCase()
  const available = options.filter(
    (o) => !value.includes(o.id) && (!q || o.name.toLowerCase().includes(q) || o.code.includes(q)),
  )

  return (
    <div className="space-y-2">
      <div className="flex min-h-9 flex-wrap gap-1.5">
        {value.length === 0 && <span className="text-sm text-muted-foreground">선택 없음</span>}
        {value.map((id) => (
          <Badge key={id} variant="secondary" className="gap-1 pr-1">
            {byId.get(id)?.name ?? `#${id}`}
            <button
              type="button"
              className="rounded-sm p-0.5 hover:bg-background"
              aria-label={`${byId.get(id)?.name ?? id} 빼기`}
              onClick={() => onChange(value.filter((v) => v !== id))}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input value={query} placeholder={placeholder} onChange={(e) => setQuery(e.target.value)} className="h-8" />
      <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
        {available.map((o) => {
          const disabled = disabledIds.includes(o.id)
          return (
            <button
              key={o.id}
              type="button"
              disabled={disabled}
              title={disabled ? '다른 그룹에서 사용 중' : undefined}
              onClick={() => {
                onChange([...value, o.id])
                setQuery('')
              }}
              className={cn(
                'rounded-md border px-2 py-0.5 text-xs hover:bg-accent',
                disabled && 'cursor-not-allowed opacity-40 hover:bg-transparent',
              )}
            >
              + {o.name}
            </button>
          )
        })}
        {available.length === 0 && <span className="text-xs text-muted-foreground">추가할 항목이 없습니다.</span>}
      </div>
    </div>
  )
}
