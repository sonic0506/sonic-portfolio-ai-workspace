import { Plus, Trash2 } from 'lucide-react'
import { useFieldArray, useFormContext, type FieldErrors } from 'react-hook-form'
import { SortableList, SortableRow } from '@/components/sortable-list'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type WithHighlights = { highlights: { value: string }[] }

/** 프로젝트 하이라이트(대표 목록 카드에 보이는 성과 문장). 손잡이를 끌어 순서를 바꾼다. */
export function HighlightsEditor() {
  const { control, register, formState } = useFormContext<WithHighlights>()
  const { fields, append, remove, move } = useFieldArray({ control, name: 'highlights' })
  const errors = (formState.errors as FieldErrors<WithHighlights>).highlights
  return (
    <div className="space-y-2">
      <SortableList ids={fields.map((f) => f.id)} onMove={move}>
        {fields.map((field, i) => (
          <SortableRow key={field.id} id={field.id} label={`하이라이트 ${i + 1}`}>
            <div className="space-y-1">
              <div className="flex gap-2">
                <Input aria-label={`하이라이트 ${i + 1}`} aria-invalid={!!errors?.[i]?.value} {...register(`highlights.${i}.value`)} />
                <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => remove(i)} aria-label="삭제">
                  <Trash2 />
                </Button>
              </div>
              {errors?.[i]?.value?.message && <p className="text-sm text-destructive">{errors[i]?.value?.message}</p>}
            </div>
          </SortableRow>
        ))}
      </SortableList>
      {fields.length > 1 && (
        <p className="text-xs text-muted-foreground">⠿를 끌어서 순서를 바꿀 수 있습니다. 위에 있을수록 먼저 보입니다.</p>
      )}
      <Button type="button" size="sm" variant="outline" onClick={() => append({ value: '' })}>
        <Plus />
        하이라이트 추가
      </Button>
    </div>
  )
}
