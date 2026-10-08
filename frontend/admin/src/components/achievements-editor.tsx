import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { Field } from '@/components/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useProjects } from '@/features/content-queries'
import { emptyAchievement, type ProfileForm } from '@/features/content-schemas'

/** 경력 하나의 "주요 성과" 목록(ADR-0019): 프로젝트별 기간·직무·직책·상세와 포트폴리오 프로젝트 연결. */
export function AchievementsEditor({ careerIndex }: { careerIndex: number }) {
  const { control, register, formState } = useFormContext<ProfileForm>()
  const items = useFieldArray({ control, name: `careers.${careerIndex}.achievements` })
  const projects = useProjects()
  const errors = formState.errors.careers?.[careerIndex]?.achievements

  return (
    <div className="space-y-3 border-t pt-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">주요 성과 {items.fields.length > 0 && `(${items.fields.length})`}</p>
        <Button type="button" size="sm" variant="ghost" onClick={() => items.append(emptyAchievement())}>
          <Plus />
          주요 성과 추가
        </Button>
      </div>
      {items.fields.map((field, j) => {
        const ae = errors?.[j]
        const id = (name: string) => `careers.${careerIndex}.achievements.${j}.${name}`
        return (
          <details key={field.id} open={!field.title} className="rounded-md border bg-background p-3">
            <summary className="cursor-pointer text-sm font-medium">{field.title || '새 성과'}</summary>
            <div className="mt-3 space-y-3">
              <div className="flex items-end gap-2">
                <Field label="성과명 (프로젝트)" htmlFor={id('title')} error={ae?.title} className="flex-1">
                  <Input id={id('title')} {...register(`careers.${careerIndex}.achievements.${j}.title`)} />
                </Field>
                <Button type="button" size="icon" variant="ghost" disabled={j === 0} onClick={() => items.move(j, j - 1)} aria-label="성과 위로">
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={j === items.fields.length - 1}
                  onClick={() => items.move(j, j + 1)}
                  aria-label="성과 아래로"
                >
                  <ArrowDown />
                </Button>
                <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => items.remove(j)} aria-label="성과 삭제">
                  <Trash2 />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="시작일" htmlFor={id('periodStart')} error={ae?.periodStart}>
                  <Input id={id('periodStart')} type="date" {...register(`careers.${careerIndex}.achievements.${j}.periodStart`)} />
                </Field>
                <Field label="종료일 (비우면 진행 중)" htmlFor={id('periodEnd')} error={ae?.periodEnd}>
                  <Input id={id('periodEnd')} type="date" {...register(`careers.${careerIndex}.achievements.${j}.periodEnd`)} />
                </Field>
                <Field label="직무" htmlFor={id('job')} error={ae?.job}>
                  <Input id={id('job')} {...register(`careers.${careerIndex}.achievements.${j}.job`)} />
                </Field>
                <Field label="직책" htmlFor={id('position')} error={ae?.position}>
                  <Input id={id('position')} {...register(`careers.${careerIndex}.achievements.${j}.position`)} />
                </Field>
              </div>
              <Field label="포트폴리오 프로젝트 연결 (선택)" htmlFor={id('projectId')}>
                <select
                  id={id('projectId')}
                  className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
                  {...register(`careers.${careerIndex}.achievements.${j}.projectId`)}
                >
                  <option value="">연결 안 함</option>
                  {projects.data?.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="상세 내용 (마크다운)" htmlFor={id('bodyMarkdown')} error={ae?.bodyMarkdown}>
                <Textarea id={id('bodyMarkdown')} rows={10} {...register(`careers.${careerIndex}.achievements.${j}.bodyMarkdown`)} />
              </Field>
            </div>
          </details>
        )
      })}
    </div>
  )
}
