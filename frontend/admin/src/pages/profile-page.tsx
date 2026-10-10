import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Controller, FormProvider, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { AchievementsEditor } from '@/components/achievements-editor'
import { Field, FormSection } from '@/components/form'
import { IdPicker } from '@/components/id-picker'
import { ImageField } from '@/components/image-field'
import { ErrorText, PageTitle } from '@/components/layout'
import { Loading } from '@/components/loading'
import { SaveBar } from '@/components/save-bar'
import { SectionsEditor } from '@/components/sections-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { keys, useSkills } from '@/features/content-queries'
import {
  duplicateSkillIds,
  emptyCareer,
  emptyProfile,
  profileSchema,
  profileToForm,
  profileToRequest,
  SKILL_GROUPS,
  type ProfileForm,
} from '@/features/content-schemas'
import { api, ApiError } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import type { AdminProfile } from '@/lib/types'

const PATH = '/api/admin/profile'

export function ProfilePage() {
  // 프로필이 아직 없으면(404) 빈 폼으로 시작한다. 첫 저장이 프로필을 만든다.
  const profile = useQuery({
    queryKey: keys.profile,
    queryFn: async () => {
      try {
        return await api<AdminProfile>(PATH)
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null
        throw e
      }
    },
  })
  if (profile.isPending) return <Loading />
  if (profile.isError) return <ErrorText error={profile.error} />
  // 첫 저장 뒤에도 같은 폼을 유지한다(다시 마운트하면 저장 완료 표시가 사라진다).
  return <ProfileEditor profile={profile.data} />
}

function ProfileEditor({ profile }: { profile: AdminProfile | null }) {
  const queryClient = useQueryClient()
  const skills = useSkills()
  const [saved, setSaved] = useState(false)
  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile ? profileToForm(profile) : emptyProfile(),
  })
  const { register, formState, control } = form
  const e = formState.errors
  const careers = useFieldArray({ control, name: 'careers' })
  const groups = useWatch({ control, name: 'skillGroups' })
  const duplicates = duplicateSkillIds(groups)

  const save = useMutation({
    mutationFn: (values: ProfileForm) => api<AdminProfile>(PATH, { method: 'PUT', body: profileToRequest(values) }),
    onMutate: () => setSaved(false),
    onSuccess: (res) => {
      queryClient.setQueryData(keys.profile, res)
      void queryClient.invalidateQueries({ queryKey: keys.rag })
      setSaved(true)
    },
  })

  return (
    <FormProvider {...form}>
      <PageTitle>프로필</PageTitle>
      <p className="-mt-4 mb-6 text-xs text-muted-foreground">
        {(save.data ?? profile)
          ? `수정 ${formatDateTime((save.data ?? profile)!.updatedAt)}`
          : '아직 프로필이 없습니다. 저장하면 만들어집니다.'}
      </p>
      <form
        noValidate
        className="space-y-6"
        onSubmit={form.handleSubmit((values) => {
          if (duplicateSkillIds(values.skillGroups).length === 0) save.mutate(values)
        })}
      >
        <FormSection title="소개">
          <Field label="한 줄 소개" htmlFor="headline" error={e.headline}>
            <Input id="headline" aria-invalid={!!e.headline} {...register('headline')} />
          </Field>
          <Field label="짧은 소개" htmlFor="shortBio" error={e.shortBio}>
            <Textarea id="shortBio" rows={3} aria-invalid={!!e.shortBio} {...register('shortBio')} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="이메일" htmlFor="email" error={e.email}>
              <Input id="email" type="email" {...register('email')} />
            </Field>
            <Field label="GitHub" htmlFor="githubUrl" error={e.githubUrl}>
              <Input id="githubUrl" placeholder="https://" {...register('githubUrl')} />
            </Field>
            <Field label="프로필 이미지" htmlFor="imageUrl" error={e.imageUrl}>
              <Controller
                control={control}
                name="imageUrl"
                render={({ field }) => (
                  <ImageField id="imageUrl" purpose="PROFILE" value={field.value} onChange={field.onChange} invalid={!!e.imageUrl} />
                )}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection
          title="경력"
          actions={
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => careers.append(emptyCareer())}
            >
              <Plus />
              경력 추가
            </Button>
          }
        >
          {careers.fields.length === 0 && <p className="text-sm text-muted-foreground">경력이 없습니다.</p>}
          {careers.fields.map((field, i) => {
            const ce = e.careers?.[i]
            return (
              <div key={field.id} className="space-y-3 rounded-md border bg-muted/30 p-4">
                <div className="flex items-end gap-2">
                  <div className="grid flex-1 gap-3 sm:grid-cols-2">
                    <Field label="회사" htmlFor={`careers.${i}.company`} error={ce?.company}>
                      <Input id={`careers.${i}.company`} {...register(`careers.${i}.company`)} />
                    </Field>
                    <Field label="직무" htmlFor={`careers.${i}.role`} error={ce?.role}>
                      <Input id={`careers.${i}.role`} {...register(`careers.${i}.role`)} />
                    </Field>
                    <Field label="고용형태" htmlFor={`careers.${i}.employmentType`} error={ce?.employmentType}>
                      <Input id={`careers.${i}.employmentType`} placeholder="정규직" {...register(`careers.${i}.employmentType`)} />
                    </Field>
                    <Field label="직책" htmlFor={`careers.${i}.position`} error={ce?.position}>
                      <Input id={`careers.${i}.position`} {...register(`careers.${i}.position`)} />
                    </Field>
                  </div>
                  <Button type="button" size="icon" variant="ghost" disabled={i === 0} onClick={() => careers.move(i, i - 1)} aria-label="위로">
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={i === careers.fields.length - 1}
                    onClick={() => careers.move(i, i + 1)}
                    aria-label="아래로"
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => careers.remove(i)}
                    aria-label="경력 삭제"
                  >
                    <Trash2 />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="시작일" htmlFor={`careers.${i}.periodStart`} error={ce?.periodStart}>
                    <Input id={`careers.${i}.periodStart`} type="date" {...register(`careers.${i}.periodStart`)} />
                  </Field>
                  <Field label="종료일 (비우면 재직 중)" htmlFor={`careers.${i}.periodEnd`} error={ce?.periodEnd}>
                    <Input id={`careers.${i}.periodEnd`} type="date" {...register(`careers.${i}.periodEnd`)} />
                  </Field>
                </div>
                <Field label="회사 로고" htmlFor={`careers.${i}.logoUrl`} error={ce?.logoUrl}>
                  <Controller
                    control={control}
                    name={`careers.${i}.logoUrl`}
                    render={({ field }) => (
                      <ImageField id={`careers.${i}.logoUrl`} purpose="CAREER_LOGO" value={field.value} onChange={field.onChange} invalid={!!ce?.logoUrl} />
                    )}
                  />
                </Field>
                <Field label="경력 요약" htmlFor={`careers.${i}.description`} error={ce?.description}>
                  <Textarea id={`careers.${i}.description`} rows={3} {...register(`careers.${i}.description`)} />
                </Field>
                <AchievementsEditor careerIndex={i} />
              </div>
            )
          })}
        </FormSection>

        <FormSection title="기술 (그룹별, 선택 순서가 표시 순서)">
          <ErrorText error={skills.error} />
          {duplicates.length > 0 && (
            <p className="text-sm text-destructive">한 기술은 한 그룹에만 넣을 수 있습니다. 중복을 빼주세요.</p>
          )}
          <div className="grid gap-6 md:grid-cols-2">
            {SKILL_GROUPS.map(({ value, label }) => (
              <Field key={value} label={label}>
                <Controller
                  control={control}
                  name={`skillGroups.${value}`}
                  render={({ field }) => (
                    <IdPicker
                      options={skills.data ?? []}
                      value={field.value}
                      onChange={field.onChange}
                      disabledIds={SKILL_GROUPS.filter((g) => g.value !== value).flatMap((g) => groups[g.value])}
                      sortable
                    />
                  )}
                />
              </Field>
            ))}
          </div>
        </FormSection>

        <SectionsEditor />

        <SaveBar
          pending={save.isPending}
          error={save.error}
          hasErrors={Object.keys(e).length > 0 || duplicates.length > 0}
          saved={saved}
        />
      </form>
    </FormProvider>
  )
}
