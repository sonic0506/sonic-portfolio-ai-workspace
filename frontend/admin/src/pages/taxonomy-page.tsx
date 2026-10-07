import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ErrorText, PageTitle } from '@/components/layout'
import { Loading, Spinner } from '@/components/loading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { keys, useCategories, useSkills, useTags } from '@/features/content-queries'
import {
  categoryOrderSchema,
  taxonomySchema,
  toTaxonomyRequest,
  type TaxonomyForm,
  type TaxonomyKind,
  DEFAULT_CATEGORY_COLOR,
} from '@/features/taxonomy-schemas'
import { api } from '@/lib/api'

type Row = {
  id: number
  code: string
  name: string
  iconKey?: string | null
  displayOrder?: number
  color?: string
  ragEnabled?: boolean
}

const CONFIG: Record<
  TaxonomyKind,
  { title: string; description: string; base: string; key: readonly unknown[]; extraLabel?: string }
> = {
  skill: {
    title: '기술',
    description: '프로젝트·블로그·프로필에서 고르는 공통 기술 목록. 사용 중인 기술은 삭제할 수 없습니다.',
    base: '/api/admin/skills',
    key: keys.skills,
    extraLabel: '아이콘 키',
  },
  category: {
    title: '카테고리',
    description: '블로그 분류. 글이 사용 중인 카테고리는 삭제할 수 없습니다. "채팅 반영"을 끄면 그 카테고리 글은 채팅 근거에서 빠집니다(재색인 불필요).',
    base: '/api/admin/categories',
    key: keys.categories,
    extraLabel: '순서',
  },
  tag: {
    title: '태그',
    description: '블로그 태그. 삭제하면 글과의 연결도 지워집니다.',
    base: '/api/admin/tags',
    key: keys.tags,
  },
}

export function TaxonomyPage() {
  const skills = useSkills()
  const categories = useCategories()
  const tags = useTags()
  return (
    <>
      <PageTitle>기술·분류</PageTitle>
      <div className="grid gap-8 lg:grid-cols-3">
        <TaxonomyTable kind="skill" query={skills} />
        <TaxonomyTable kind="category" query={categories} />
        <TaxonomyTable kind="tag" query={tags} />
      </div>
    </>
  )
}

function extraOf(kind: TaxonomyKind, row: Row): string {
  if (kind === 'skill') return row.iconKey ?? ''
  if (kind === 'category') return String(row.displayOrder ?? 0)
  return ''
}

function TaxonomyTable({ kind, query }: { kind: TaxonomyKind; query: UseQueryResult<Row[]> }) {
  const config = CONFIG[kind]
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<number | null>(null)
  const remove = useMutation({
    mutationFn: (id: number) => api<void>(`${config.base}/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: config.key }),
  })

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">{config.title}</h2>
        <p className="text-xs text-muted-foreground">{config.description}</p>
      </div>
      <RowForm kind={kind} />
      <ErrorText error={query.error ?? remove.error} />
      {query.isPending && <Loading className="py-6" />}
      <ul className="divide-y rounded-lg border">
        {query.data?.map((row) =>
          editing === row.id ? (
            <li key={row.id} className="p-2">
              <RowForm kind={kind} row={row} onDone={() => setEditing(null)} />
            </li>
          ) : (
            <li key={row.id} className="flex items-center gap-2 px-3 py-2 text-sm">
              {row.color && (
                <span aria-hidden="true" className="size-3 shrink-0 rounded-full border" style={{ backgroundColor: row.color }} />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{row.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.code}
                  {config.extraLabel && extraOf(kind, row) ? ` · ${config.extraLabel} ${extraOf(kind, row)}` : ''}
                  {row.color ? ` · ${row.color}` : ''}
                  {row.ragEnabled === false ? ' · 채팅 제외' : ''}
                </p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setEditing(row.id)} aria-label={`${row.name} 수정`}>
                <Pencil />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive"
                disabled={remove.isPending}
                aria-label={`${row.name} 삭제`}
                onClick={() => window.confirm(`${config.title} "${row.name}"을(를) 삭제할까요?`) && remove.mutate(row.id)}
              >
                <Trash2 />
              </Button>
            </li>
          ),
        )}
        {query.data?.length === 0 && <li className="p-3 text-sm text-muted-foreground">항목이 없습니다.</li>}
      </ul>
    </section>
  )
}

/** row가 없으면 추가 폼, 있으면 그 항목의 수정 폼. */
function RowForm({ kind, row, onDone }: { kind: TaxonomyKind; row?: Row; onDone?: () => void }) {
  const config = CONFIG[kind]
  const queryClient = useQueryClient()
  const empty = { code: '', name: '', extra: kind === 'category' ? '0' : '', color: DEFAULT_CATEGORY_COLOR, ragEnabled: true }
  const form = useForm<TaxonomyForm>({
    resolver: zodResolver(
      kind === 'category' ? taxonomySchema.extend({ extra: categoryOrderSchema }) : taxonomySchema,
    ),
    defaultValues: row
      ? {
          code: row.code,
          name: row.name,
          extra: extraOf(kind, row),
          color: row.color ?? DEFAULT_CATEGORY_COLOR,
          ragEnabled: row.ragEnabled ?? true,
        }
      : empty,
  })
  const e = form.formState.errors
  const save = useMutation({
    mutationFn: (values: TaxonomyForm) =>
      row
        ? api<Row>(`${config.base}/${row.id}`, { method: 'PUT', body: toTaxonomyRequest(kind, values) })
        : api<Row>(config.base, { method: 'POST', body: toTaxonomyRequest(kind, values) }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: config.key })
      if (row) onDone?.()
      else form.reset(empty)
    },
  })
  const message = e.code?.message ?? e.name?.message ?? e.extra?.message ?? e.color?.message

  return (
    <form noValidate className="space-y-1" onSubmit={form.handleSubmit((v) => save.mutate(v))}>
      <div className="flex gap-1.5">
        <Input placeholder="이름" aria-label="이름" aria-invalid={!!e.name} className="h-8" {...form.register('name')} />
        <Input placeholder="code" aria-label="코드" aria-invalid={!!e.code} className="h-8" {...form.register('code')} />
        {config.extraLabel && (
          <Input
            placeholder={config.extraLabel}
            aria-label={config.extraLabel}
            aria-invalid={!!e.extra}
            className="h-8 w-20 shrink-0"
            {...form.register('extra')}
          />
        )}
        {kind === 'category' && (
          // 포트폴리오에서 카테고리 점(dot)에만 쓰는 색. 글자는 중립색이라 대비를 따로 맞출 필요는 없다.
          <input
            type="color"
            aria-label="카테고리 색"
            title="카테고리 색"
            className="h-8 w-10 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
            {...form.register('color')}
          />
        )}
      </div>
      {kind === 'category' && (
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <input type="checkbox" className="size-3.5" {...form.register('ragEnabled')} />
          채팅 반영
        </label>
      )}
      <div className="flex items-center gap-1.5">
        <Button type="submit" size="sm" disabled={save.isPending}>
          {save.isPending && <Spinner />}
          {row ? '저장' : '추가'}
        </Button>
        {row && (
          <Button type="button" size="sm" variant="ghost" onClick={onDone}>
            취소
          </Button>
        )}
        {message && <p className="text-xs text-destructive">{message}</p>}
      </div>
      <ErrorText error={save.error} />
    </form>
  )
}
