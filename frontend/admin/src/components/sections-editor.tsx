import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Controller, useFieldArray, useFormContext, type FieldErrors } from 'react-hook-form'
import { Field, FormSection } from '@/components/form'
import { MarkdownEditor } from '@/components/markdown-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Section } from '@/lib/types'

type WithSections = { sections: Section[] }

/**
 * 제목 + Markdown 섹션 목록. 순서가 표시 순서다.
 * 본문의 `:::questions` 블록은 방문자 화면에서 추천 질문 버튼이 된다.
 */
export function SectionsEditor() {
  const { control, register, formState } = useFormContext<WithSections>()
  const { fields, append, remove, move } = useFieldArray({ control, name: 'sections' })
  const errors = (formState.errors as FieldErrors<WithSections>).sections

  return (
    <FormSection
      title="본문 섹션"
      actions={
        <Button type="button" size="sm" variant="outline" onClick={() => append({ title: '', bodyMarkdown: '' })}>
          <Plus />
          섹션 추가
        </Button>
      }
    >
      <p className="text-xs text-muted-foreground">
        Markdown으로 작성합니다. 섹션 제목이 <code>##</code>이므로 본문 제목은 <code>###</code>부터 씁니다. 추천 질문 블록(
        <code>:::questions</code>)은 방문자 화면에서 질문 버튼이 됩니다.
      </p>
      {fields.length === 0 && <p className="text-sm text-muted-foreground">섹션이 없습니다.</p>}
      {fields.map((field, i) => (
        <div key={field.id} className="space-y-3 rounded-md border bg-muted/30 p-4">
          <div className="flex items-end gap-2">
            <Field label={`섹션 ${i + 1} 제목`} htmlFor={`sections.${i}.title`} error={errors?.[i]?.title} className="flex-1">
              <Input id={`sections.${i}.title`} aria-invalid={!!errors?.[i]?.title} {...register(`sections.${i}.title`)} />
            </Field>
            <Button type="button" size="icon" variant="ghost" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="위로">
              <ArrowUp />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              disabled={i === fields.length - 1}
              onClick={() => move(i, i + 1)}
              aria-label="아래로"
            >
              <ArrowDown />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="text-destructive"
              onClick={() => remove(i)}
              aria-label="섹션 삭제"
            >
              <Trash2 />
            </Button>
          </div>
          <Field label="본문 (Markdown)" htmlFor={`sections.${i}.bodyMarkdown`} error={errors?.[i]?.bodyMarkdown}>
            <Controller
              control={control}
              name={`sections.${i}.bodyMarkdown`}
              render={({ field }) => (
                <MarkdownEditor
                  id={`sections.${i}.bodyMarkdown`}
                  value={field.value}
                  onChange={field.onChange}
                  invalid={!!errors?.[i]?.bodyMarkdown}
                />
              )}
            />
          </Field>
        </div>
      ))}
    </FormSection>
  )
}
