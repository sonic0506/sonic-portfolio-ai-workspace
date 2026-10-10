import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Option = { id: number; code: string; name: string }

/**
 * 여러 항목 선택. 선택한 순서가 표시 순서이며 칩의 ✕로 뺀다.
 * disabledIds: 다른 곳에서 이미 쓰여 고를 수 없는 항목(프로필 스킬 그룹).
 * sortable: 칩을 끌어(키보드는 Space 후 방향키) 순서를 바꾼다. 순서를 저장하는 곳(프로필·프로젝트 스킬)에서만 켠다.
 */
export function IdPicker({
  options,
  value,
  onChange,
  disabledIds = [],
  placeholder = '검색',
  sortable = false,
}: {
  options: Option[]
  value: number[]
  onChange: (ids: number[]) => void
  disabledIds?: number[]
  placeholder?: string
  sortable?: boolean
}) {
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState<number | null>(null)
  // 4px 이상 움직여야 드래그로 본다. 칩 안의 ✕ 클릭이 드래그로 먹히지 않게.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const byId = new Map(options.map((o) => [o.id, o]))
  const label = (id: number) => byId.get(id)?.name ?? `#${id}`
  const q = query.trim().toLowerCase()
  const available = options.filter(
    (o) => !value.includes(o.id) && (!q || o.name.toLowerCase().includes(q) || o.code.includes(q)),
  )
  const remove = (id: number) => onChange(value.filter((v) => v !== id))

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (over && active.id !== over.id) {
      onChange(arrayMove(value, value.indexOf(Number(active.id)), value.indexOf(Number(over.id))))
    }
  }

  const chips = (
    <div className="flex min-h-9 flex-wrap gap-1.5">
      {value.length === 0 && <span className="text-sm text-muted-foreground">선택 없음</span>}
      {value.map((id) =>
        sortable ? (
          <SortableChip key={id} id={id} label={label(id)} onRemove={() => remove(id)} />
        ) : (
          <Chip key={id} label={label(id)} onRemove={() => remove(id)} />
        ),
      )}
    </div>
  )

  return (
    <div className="space-y-2">
      {sortable ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={({ active }) => setActiveId(Number(active.id))}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <SortableContext items={value} strategy={rectSortingStrategy}>
            {chips}
          </SortableContext>
          <DragOverlay>
            {activeId !== null && (
              <Badge variant="secondary" className="cursor-grabbing gap-1 pl-1 shadow-lg ring-2 ring-primary">
                <GripVertical className="size-3 text-muted-foreground" />
                {label(activeId)}
              </Badge>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        chips
      )}
      {sortable && value.length > 1 && (
        <p className="text-xs text-muted-foreground">칩을 끌어서 순서를 바꿀 수 있습니다. 앞에 있을수록 먼저 보입니다.</p>
      )}
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

function RemoveButton({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      className="rounded-sm p-0.5 hover:bg-background"
      aria-label={`${label} 빼기`}
      onClick={onRemove}
      onKeyDown={(e) => e.stopPropagation()} // 칩의 키보드 드래그(Space·Enter)로 넘어가지 않게
    >
      <X className="size-3" />
    </button>
  )
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Badge variant="secondary" className="gap-1 pr-1">
      {label}
      <RemoveButton label={label} onRemove={onRemove} />
    </Badge>
  )
}

function SortableChip({ id, label, onRemove }: { id: number; label: string; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <Badge
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      variant="secondary"
      className={cn(
        'cursor-grab touch-none gap-1 pr-1 pl-1 hover:bg-secondary/70',
        // 끌고 있는 칩의 원래 자리: 놓일 위치를 점선 자리표시로 보여 준다
        isDragging && 'border border-dashed border-primary bg-primary/10 [&>*]:invisible',
      )}
      aria-label={`${label}, 끌어서 순서 변경`}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-3 text-muted-foreground" />
      <span>{label}</span>
      <RemoveButton label={label} onRemove={onRemove} />
    </Badge>
  )
}
