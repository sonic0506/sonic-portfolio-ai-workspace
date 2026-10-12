import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * 세로 목록 드래그 정렬. 행 안에 입력창이 있으므로 손잡이(⠿)로만 끈다(키보드는 손잡이에서 Space 후 ↑↓).
 * ids는 useFieldArray의 field.id, onMove는 useFieldArray의 move를 그대로 넘긴다.
 */
export function SortableList({
  ids,
  onMove,
  children,
}: {
  ids: string[]
  onMove: (from: number, to: number) => void
  children: ReactNode
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (over && active.id !== over.id) onMove(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)))
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  )
}

export function SortableRow({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('relative flex items-start gap-1 rounded-md', isDragging && 'z-10 bg-background shadow-lg ring-2 ring-primary')}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        className="mt-1.5 cursor-grab touch-none rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-foreground active:cursor-grabbing"
        aria-label={`${label} 끌어서 순서 변경`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
