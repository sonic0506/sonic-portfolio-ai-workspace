import { X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { ErrorText } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { usePosts, useProjects } from '@/features/content-queries'
import type { AdminReference, ReferenceRequest, RefType } from '@/lib/types'

export const REF_TYPE_LABEL: Record<RefType, string> = { PROJECT: '프로젝트', BLOG: '블로그' }

type Candidate = ReferenceRequest & { title: string; slug: string; published: boolean }

const same = (a: ReferenceRequest, b: ReferenceRequest) => a.type === b.type && a.id === b.id
const editPath = (r: ReferenceRequest) => (r.type === 'PROJECT' ? `/projects/${r.id}` : `/posts/${r.id}`)

/** 프로젝트·블로그 후보를 합친다. */
function useCandidates() {
  const projects = useProjects()
  const posts = usePosts()
  const candidates: Candidate[] = [
    ...(projects.data ?? []).map((p) => ({ type: 'PROJECT' as const, id: p.id, title: p.title, slug: p.slug, published: p.published })),
    ...(posts.data ?? []).map((p) => ({ type: 'BLOG' as const, id: p.id, title: p.title, slug: p.slug, published: p.published })),
  ]
  return { candidates, error: projects.error ?? posts.error }
}

/** 후보 검색: 제목·slug, 이미 고른 항목과 자기 자신은 뺀다. */
export function filterCandidates(candidates: Candidate[], value: ReferenceRequest[], query: string, self?: ReferenceRequest) {
  const q = query.trim().toLowerCase()
  return candidates.filter(
    (c) =>
      !value.some((v) => same(v, c)) &&
      !(self && same(self, c)) &&
      (!q || c.title.toLowerCase().includes(q) || c.slug.includes(q)),
  )
}

function RefLabel({ item }: { item: { type: RefType; title: string; published: boolean } }) {
  return (
    <>
      <span className="text-muted-foreground">{REF_TYPE_LABEL[item.type]}</span>
      <span>{item.title}</span>
      {!item.published && <span className="text-muted-foreground">(비공개)</span>}
    </>
  )
}

/**
 * 이 문서가 참고하는 문서(나가는 연결) 선택. 선택 순서가 표시 순서다.
 * known: 저장된 상세의 참고 문서 — 목록을 아직 못 읽었을 때 이름 표시에 쓴다.
 */
export function ReferencePicker({
  value,
  onChange,
  self,
  known = [],
}: {
  value: ReferenceRequest[]
  onChange: (refs: ReferenceRequest[]) => void
  self?: ReferenceRequest
  known?: AdminReference[]
}) {
  const [query, setQuery] = useState('')
  const { candidates, error } = useCandidates()
  const find = (r: ReferenceRequest) => candidates.find((c) => same(c, r)) ?? known.find((k) => same(k, r))
  const available = filterCandidates(candidates, value, query, self)

  return (
    <div className="space-y-2">
      <ErrorText error={error} />
      <div className="flex min-h-9 flex-wrap gap-1.5">
        {value.length === 0 && <span className="text-sm text-muted-foreground">선택 없음</span>}
        {value.map((r) => {
          const item = find(r)
          return (
            <Badge key={`${r.type}-${r.id}`} variant="secondary" className="gap-1 pr-1">
              {item ? <RefLabel item={item} /> : `${REF_TYPE_LABEL[r.type]} #${r.id}`}
              <button
                type="button"
                className="rounded-sm p-0.5 hover:bg-background"
                aria-label={`${item?.title ?? r.id} 빼기`}
                onClick={() => onChange(value.filter((v) => !same(v, r)))}
              >
                <X className="size-3" />
              </button>
            </Badge>
          )
        })}
      </div>
      <Input value={query} placeholder="프로젝트·블로그 검색" onChange={(e) => setQuery(e.target.value)} className="h-8" />
      <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
        {available.map((c) => (
          <button
            key={`${c.type}-${c.id}`}
            type="button"
            onClick={() => {
              onChange([...value, { type: c.type, id: c.id }])
              setQuery('')
            }}
            className="flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs hover:bg-accent"
          >
            + <RefLabel item={c} />
          </button>
        ))}
        {available.length === 0 && <span className="text-xs text-muted-foreground">추가할 문서가 없습니다.</span>}
      </div>
    </div>
  )
}

/** 이 문서를 참고한 문서(들어오는 연결). 읽기 전용이며 상대 문서에서 편집한다. */
export function ReferencedByList({ items }: { items: AdminReference[] }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">아직 없습니다.</p>
  return (
    <ul className="space-y-1 text-sm">
      {items.map((r) => (
        <li key={`${r.type}-${r.id}`} className="flex gap-1.5">
          <Link to={editPath(r)} className="flex gap-1.5 underline-offset-4 hover:underline">
            <RefLabel item={r} />
          </Link>
        </li>
      ))}
    </ul>
  )
}
