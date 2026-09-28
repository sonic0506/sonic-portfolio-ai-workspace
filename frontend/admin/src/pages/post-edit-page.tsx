import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router'
import { Checkbox, Field, FormSection } from '@/components/form'
import { IdPicker } from '@/components/id-picker'
import { ReferencedByList, ReferencePicker } from '@/components/reference-picker'
import { ErrorText, PageTitle } from '@/components/layout'
import { Loading } from '@/components/loading'
import { SaveBar } from '@/components/save-bar'
import { SectionsEditor } from '@/components/sections-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { keys, useCategories, useSkills, useTags } from '@/features/content-queries'
import {
  blogPostSchema,
  blogPostToForm,
  blogPostToRequest,
  emptyBlogPost,
  type BlogPostForm,
} from '@/features/content-schemas'
import { useContentDelete, useContentSave } from '@/features/use-content-save'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import type { AdminBlogPostDetail, BlogPostRequest } from '@/lib/types'

const BASE = '/api/admin/blog/posts'

export function PostEditPage() {
  const { id } = useParams()
  const numericId = id ? Number(id) : undefined
  const detail = useQuery({
    queryKey: keys.post(numericId ?? 0),
    queryFn: () => api<AdminBlogPostDetail>(`${BASE}/${numericId}`),
    enabled: numericId !== undefined,
  })
  if (numericId === undefined) return <PostEditor />
  if (detail.isPending) return <Loading />
  if (detail.isError) return <ErrorText error={detail.error} />
  return <PostEditor key={numericId} post={detail.data} />
}

function PostEditor({ post }: { post?: AdminBlogPostDetail }) {
  const skills = useSkills()
  const categories = useCategories()
  const tags = useTags()
  const form = useForm<BlogPostForm>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: post ? blogPostToForm(post) : emptyBlogPost(),
  })
  const { register, formState } = form
  const e = formState.errors
  const save = useContentSave<BlogPostRequest, AdminBlogPostDetail>({
    basePath: BASE,
    routePrefix: '/posts',
    id: post?.id,
    listKey: keys.posts,
    detailKey: keys.post,
  })
  const remove = useContentDelete({ basePath: BASE, id: post?.id, listKey: keys.posts, after: '/posts' })

  return (
    <FormProvider {...form}>
      <PageTitle
        actions={
          post && (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive"
              disabled={remove.isPending}
              onClick={() => window.confirm(`"${post.title}" 글을 삭제할까요? 되돌릴 수 없습니다.`) && remove.mutate()}
            >
              삭제
            </Button>
          )
        }
      >
        {post ? post.title : '새 글'}
      </PageTitle>
      {post && (
        <p className="-mt-4 mb-6 text-xs text-muted-foreground">
          발행 {post.publishedAt ? formatDateTime(post.publishedAt) : '없음(초안)'} · 수정 {formatDateTime(post.updatedAt)}
        </p>
      )}
      <ErrorText error={remove.error} />
      <form noValidate className="space-y-6" onSubmit={form.handleSubmit((v) => save.mutate(blogPostToRequest(v)))}>
        <FormSection title="기본 정보">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="제목" htmlFor="title" error={e.title}>
              <Input id="title" aria-invalid={!!e.title} {...register('title')} />
            </Field>
            <Field label="slug (주소)" htmlFor="slug" error={e.slug} hint="/blog/{slug}에 쓰입니다.">
              <Input id="slug" aria-invalid={!!e.slug} {...register('slug')} />
            </Field>
          </div>
          <Field label="요약" htmlFor="summary" error={e.summary}>
            <Textarea id="summary" rows={2} {...register('summary')} />
          </Field>
          <div className="flex flex-wrap items-end gap-6">
            <Checkbox label="공개" {...register('published')} />
            <Field label="썸네일 이미지 주소" htmlFor="thumbnailUrl" error={e.thumbnailUrl} className="min-w-72 flex-1">
              <Input id="thumbnailUrl" placeholder="https://" {...register('thumbnailUrl')} />
            </Field>
          </div>
        </FormSection>

        <FormSection
          title="분류"
          actions={
            <Link to="/taxonomy" className="text-xs text-muted-foreground underline underline-offset-4">
              카테고리·태그·기술 관리
            </Link>
          }
        >
          <ErrorText error={categories.error ?? tags.error ?? skills.error} />
          <div className="grid gap-6 md:grid-cols-3">
            <Field label="카테고리" htmlFor="categoryId" error={e.categoryId}>
              <select
                id="categoryId"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                {...register('categoryId')}
              >
                <option value="">선택</option>
                {categories.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="태그">
              <Controller
                control={form.control}
                name="tagIds"
                render={({ field }) => <IdPicker options={tags.data ?? []} value={field.value} onChange={field.onChange} />}
              />
            </Field>
            <Field label="기술">
              <Controller
                control={form.control}
                name="skillIds"
                render={({ field }) => (
                  <IdPicker options={skills.data ?? []} value={field.value} onChange={field.onChange} />
                )}
              />
            </Field>
          </div>
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
                self={post ? { type: 'BLOG', id: post.id } : undefined}
                known={post?.references}
              />
            )}
          />
          {post && (
            <div className="space-y-2 border-t pt-4">
              <p className="text-sm font-medium">이 문서를 참고한 문서</p>
              <ReferencedByList items={post.referencedBy} />
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
          cancelTo="/posts"
          saved={save.saved}
        />
      </form>
    </FormProvider>
  )
}
