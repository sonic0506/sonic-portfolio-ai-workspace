import { Plus, Trash2 } from 'lucide-react'
import { useFieldArray, useFormContext, type FieldErrors } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type WithHighlights = { highlights: { value: string }[] }

/** 프로젝트 하이라이트(대표 목록 카드에 보이는 성과 문장). */
export function HighlightsEditor() {
  const { control, register, formState } = useFormContext<WithHighlights>()
  const { fields, append, remove } = useFieldArray({ control, name: 'highlights' })
  const errors = (formState.errors as FieldErrors<WithHighlights>).highlights
  return (
    <div className="space-y-2">
      {fields.map((field, i) => (
        <div key={field.id} className="space-y-1">
          <div className="flex gap-2">
            <Input aria-label={`하이라이트 ${i + 1}`} aria-invalid={!!errors?.[i]?.value} {...register(`highlights.${i}.value`)} />
            <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => remove(i)} aria-label="삭제">
              <Trash2 />
            </Button>
          </div>
          {errors?.[i]?.value?.message && <p className="text-sm text-destructive">{errors[i]?.value?.message}</p>}
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={() => append({ value: '' })}>
        <Plus />
        하이라이트 추가
      </Button>
    </div>
  )
}
