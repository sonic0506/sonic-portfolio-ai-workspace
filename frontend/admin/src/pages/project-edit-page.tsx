import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { useParams } from 'react-router'
import { Checkbox, Field, FormSection } from '@/components/form'
import { ImageField } from '@/components/image-field'
import { IdPicker } from '@/components/id-picker'
import { ReferencedByList, ReferencePicker } from '@/components/reference-picker'
import { ErrorText, PageTitle } from '@/components/layout'
import { Loading } from '@/components/loading'
import { SaveBar } from '@/components/save-bar'
import { SectionsEditor } from '@/components/sections-editor'
import { HighlightsEditor } from '@/components/string-list-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { keys, useSkills } from '@/features/content-queries'
import {
  emptyProject,
  projectSchema,
  projectToForm,
  projectToRequest,
  type ProjectForm,
} from '@/features/content-schemas'
import { useContentDelete, useContentSave } from '@/features/use-content-save'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import type { AdminProjectDetail, ProjectRequest } from '@/lib/types'

const BASE = '/api/admin/projects'

export function ProjectEditPage() {
  const { id } = useParams()
  const numericId = id ? Number(id) : undefined
  const detail = useQuery({
    queryKey: keys.project(numericId ?? 0),
    queryFn: () => api<AdminProjectDetail>(`${BASE}/${numericId}`),
    enabled: numericId !== undefined,
  })
  if (numericId === undefined) return <ProjectEditor />
  if (detail.isPending) return <Loading />
  if (detail.isError) return <ErrorText error={detail.error} />
  return <ProjectEditor key={numericId} project={detail.data} />
}

function ProjectEditor({ project }: { project?: AdminProjectDetail }) {
  const skills = useSkills()
  const form = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: project ? projectToForm(project) : emptyProject(),
  })
  const { register, formState } = form
  const e = formState.errors
  const save = useContentSave<ProjectRequest, AdminProjectDetail>({
    basePath: BASE,
    routePrefix: '/projects',
    id: project?.id,
    listKey: keys.projects,
    detailKey: keys.project,
  })
  const remove = useContentDelete({ basePath: BASE, id: project?.id, listKey: keys.projects, after: '/projects' })

  return (
    <FormProvider {...form}>
      <PageTitle
        actions={
          project && (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive"
              disabled={remove.isPending}
              onClick={() => window.confirm(`"${project.title}" 프로젝트를 삭제할까요? 되돌릴 수 없습니다.`) && remove.mutate()}
            >
              삭제
            </Button>
          )
        }
      >
        {project ? project.title : '새 프로젝트'}
      </PageTitle>
      {project && (
        <p className="-mt-4 mb-6 text-xs text-muted-foreground">
          발행 {formatDateTime(project.publishedAt)} · 수정 {formatDateTime(project.updatedAt)}
        </p>
      )}
      <ErrorText error={remove.error} />
      <form
        noValidate
        className="space-y-6"
        onSubmit={form.handleSubmit((values) => save.mutate(projectToRequest(values)))}
      >
        <FormSection title="기본 정보">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="제목" htmlFor="title" error={e.title}>
              <Input id="title" aria-invalid={!!e.title} {...register('title')} />
            </Field>
            <Field label="slug (주소)" htmlFor="slug" error={e.slug} hint="/projects/{slug}에 쓰입니다.">
              <Input id="slug" aria-invalid={!!e.slug} {...register('slug')} />
            </Field>
          </div>
          <Field label="요약" htmlFor="summary" error={e.summary}>
            <Textarea id="summary" rows={2} aria-invalid={!!e.summary} {...register('summary')} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="소속" htmlFor="organization" error={e.organization}>
              <Input id="organization" {...register('organization')} />
            </Field>
            <Field label="역할" htmlFor="position" error={e.position}>
              <Input id="position" {...register('position')} />
            </Field>
            <Field label="시작일" htmlFor="periodStart" error={e.periodStart}>
              <Input id="periodStart" type="date" aria-invalid={!!e.periodStart} {...register('periodStart')} />
            </Field>
            <Field label="종료일" htmlFor="periodEnd" error={e.periodEnd} hint="비우면 진행 중으로 표시됩니다.">
              <Input id="periodEnd" type="date" aria-invalid={!!e.periodEnd} {...register('periodEnd')} />
            </Field>
            <Field label="기여도 (%)" htmlFor="contribution" error={e.contribution}>
              <Input id="contribution" inputMode="numeric" aria-invalid={!!e.contribution} {...register('contribution')} />
            </Field>
            <Field label="기여도 설명" htmlFor="contributionNote" error={e.contributionNote}>
              <Input id="contributionNote" {...register('contributionNote')} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="공개·링크">
          <div className="flex flex-wrap items-end gap-6">
            <Checkbox label="공개" {...register('published')} />
            <Checkbox label="대표 프로젝트" {...register('featured')} />
            <Field label="표시 순서" htmlFor="displayOrder" error={e.displayOrder}>
              <Input id="displayOrder" inputMode="numeric" className="w-24" {...register('displayOrder')} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="GitHub" htmlFor="githubUrl" error={e.githubUrl}>
              <Input id="githubUrl" placeholder="https://" {...register('githubUrl')} />
            </Field>
            <Field label="서비스 주소" htmlFor="serviceUrl" error={e.serviceUrl}>
              <Input id="serviceUrl" placeholder="https://" {...register('serviceUrl')} />
            </Field>
            <Field label="썸네일 이미지" htmlFor="thumbnailUrl" error={e.thumbnailUrl}>
              <Controller
                control={form.control}
                name="thumbnailUrl"
                render={({ field }) => (
                  <ImageField id="thumbnailUrl" purpose="THUMBNAIL" value={field.value} onChange={field.onChange} invalid={!!e.thumbnailUrl} />
                )}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection title="하이라이트 (대표 목록 카드)">
          <HighlightsEditor />
        </FormSection>

        <FormSection title="사용 기술">
          <ErrorText error={skills.error} />
          <Controller
            control={form.control}
            name="skillIds"
            render={({ field }) => (
              <IdPicker options={skills.data ?? []} value={field.value} onChange={field.onChange} placeholder="기술 검색" sortable />
            )}
          />
        </FormSection>

        <SectionsEditor />

        <FormSection title="참고 문서">
          <p className="-mt-2 text-xs text-muted-foreground">
            이 문서가 참고한 프로젝트·블로그를 고릅니다. 상세 페이지의 &quot;참고 문서&quot;에 공개 문서만 표시됩니다.
          </p>
          <Controller
            control={form.control}
            name="references"
            render={({ field }) => (
              <ReferencePicker
                value={field.value}
                onChange={field.onChange}
                self={project ? { type: 'PROJECT', id: project.id } : undefined}
                known={project?.references}
              />
            )}
          />
          {project && (
            <div className="space-y-2 border-t pt-4">
              <p className="text-sm font-medium">이 문서를 참고한 문서</p>
              <ReferencedByList items={project.referencedBy} />
            </div>
          )}
        </FormSection>

        <FormSection title="관리자 메모 (방문자·챗봇에 노출되지 않음)">
          <Textarea aria-label="관리자 메모" rows={3} {...register('adminNote')} />
          {e.adminNote?.message && <p className="text-sm text-destructive">{e.adminNote.message}</p>}
        </FormSection>

        <SaveBar
          pending={save.isPending}
          error={save.error}
          hasErrors={Object.keys(e).length > 0}
          cancelTo="/projects"
          saved={save.saved}
        />
      </form>
    </FormProvider>
  )
}
