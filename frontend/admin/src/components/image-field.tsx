import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ImageOff, Images, Upload } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { Spinner } from '@/components/loading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { acceptedTypes, uploadImage, type MediaItem, type MediaPurpose } from '@/lib/upload'

const mediaKey = (purpose: MediaPurpose) => ['media', purpose] as const

/**
 * 이미지 칸(ADR-0020): 미리보기 · 주소 직접 입력 · 업로드 · 올린 이미지에서 고르기.
 * value는 주소 문자열이고 비어 있으면 ''다(폼 값과 같은 모양).
 */
export function ImageField({
  id,
  value,
  onChange,
  purpose,
  invalid,
  compact = false,
}: {
  id?: string
  value: string
  onChange: (url: string) => void
  purpose: MediaPurpose
  invalid?: boolean
  compact?: boolean
}) {
  const fallbackId = useId()
  const inputId = id ?? fallbackId
  const file = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)
  const [broken, setBroken] = useState(false)

  async function upload(f: File) {
    setError(null)
    setUploading(true)
    try {
      onChange(await uploadImage(f, purpose))
      setBroken(false)
      await queryClient.invalidateQueries({ queryKey: mediaKey(purpose) })
    } catch (e) {
      setError(e instanceof Error ? e.message : '업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const size = compact ? 'size-8' : 'size-16'
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className={`${size} flex shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted`}>
          {value && !broken ? (
            <img src={value} alt="" className="size-full object-cover" onError={() => setBroken(true)} />
          ) : (
            <ImageOff className="size-4 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
        <Input
          id={inputId}
          placeholder="https:// 또는 업로드"
          aria-invalid={invalid}
          className={compact ? 'h-8' : undefined}
          value={value}
          onChange={(e) => {
            setBroken(false)
            onChange(e.target.value)
          }}
        />
        <input
          ref={file}
          type="file"
          hidden
          accept={acceptedTypes(purpose).join(',')}
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) void upload(f)
          }}
        />
        <Button type="button" size={compact ? 'icon' : 'sm'} variant="outline" disabled={uploading} onClick={() => file.current?.click()} aria-label="이미지 업로드">
          {uploading ? <Spinner /> : <Upload />}
          {!compact && '업로드'}
        </Button>
        <Button type="button" size={compact ? 'icon' : 'sm'} variant="ghost" onClick={() => setPicking((p) => !p)} aria-label="올린 이미지에서 고르기" aria-expanded={picking}>
          <Images />
          {!compact && '고르기'}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {picking && (
        <MediaPicker
          purpose={purpose}
          onPick={(url) => {
            onChange(url)
            setBroken(false)
            setPicking(false)
          }}
        />
      )}
    </div>
  )
}

function MediaPicker({ purpose, onPick }: { purpose: MediaPurpose; onPick: (url: string) => void }) {
  const media = useQuery({
    queryKey: mediaKey(purpose),
    queryFn: () => api<MediaItem[]>(`/api/admin/media?purpose=${purpose}`),
  })
  if (media.isPending) return <p className="text-sm text-muted-foreground">불러오는 중…</p>
  if (media.isError) return <p className="text-sm text-destructive">목록을 불러오지 못했습니다.</p>
  if (media.data.length === 0) return <p className="text-sm text-muted-foreground">이 용도로 올린 이미지가 없습니다.</p>
  return (
    <ul className="grid max-h-56 grid-cols-6 gap-2 overflow-y-auto rounded-md border p-2">
      {media.data.map((m) => (
        <li key={m.id}>
          <button
            type="button"
            title={m.originalName ?? m.url}
            className="block aspect-square w-full overflow-hidden rounded border hover:ring-2 hover:ring-ring"
            onClick={() => onPick(m.url)}
          >
            <img src={m.url} alt={m.originalName ?? ''} loading="lazy" className="size-full object-cover" />
          </button>
        </li>
      ))}
    </ul>
  )
}
