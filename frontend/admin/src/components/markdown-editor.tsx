import { Markdown } from '@portfolio/markdown'
import {
  Bold,
  Code,
  FileText,
  Heading3,
  Heading4,
  Image,
  Italic,
  Link,
  List,
  MessageCircleQuestionMark,
  Quote,
  Strikethrough,
  Table,
  type LucideIcon,
} from 'lucide-react'
import { useDeferredValue, useRef, useState, type ClipboardEvent, type DragEvent, type KeyboardEvent } from 'react'
import { Spinner } from '@/components/loading'
import { Input } from '@/components/ui/input'
import { usePosts, useProjects } from '@/features/content-queries'
import { insert, link, prefixLines, QUESTIONS, TABLE, wrap, type Edit } from '@/lib/markdown-edit'
import { acceptedTypes, uploadImage } from '@/lib/upload'
import { cn } from '@/lib/utils'

type Action = (value: string, start: number, end: number) => Edit

const code: Action = (v, s, e) => {
  const body = v.slice(s, e)
  return insert(v, s, e, `\`\`\`\n${body}\n\`\`\``, true, [4, 4 + body.length])
}

const TOOLS: (readonly [LucideIcon, string, Action] | null)[] = [
  [Heading3, '제목 3', (v, s, e) => prefixLines(v, s, e, '### ')],
  [Heading4, '제목 4', (v, s, e) => prefixLines(v, s, e, '#### ')],
  null,
  [Bold, '굵게 (⌘B)', (v, s, e) => wrap(v, s, e, '**')],
  [Italic, '기울임 (⌘I)', (v, s, e) => wrap(v, s, e, '*')],
  [Strikethrough, '취소선', (v, s, e) => wrap(v, s, e, '~~')],
  null,
  [Quote, '인용', (v, s, e) => prefixLines(v, s, e, '> ')],
  [Link, '링크 (⌘K)', link],
]

const TOOLS_AFTER_IMAGE: (readonly [LucideIcon, string, Action] | null)[] = [
  [Code, '코드 블록', code],
  null,
  [Table, '표', (v, s, e) => insert(v, s, e, TABLE, true, [2, 4])],
  [List, '목록', (v, s, e) => prefixLines(v, s, e, '- ')],
  null,
  [MessageCircleQuestionMark, '추천 질문 블록', (v, s, e) => insert(v, s, e, QUESTIONS, true, [15, 17])],
]

const SHORTCUTS: Record<string, Action> = {
  b: (v, s, e) => wrap(v, s, e, '**'),
  i: (v, s, e) => wrap(v, s, e, '*'),
  k: link,
}

function ToolButton({ icon: Icon, label, onClick, active }: { icon: LucideIcon; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn('rounded-sm p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground', active && 'bg-accent text-foreground')}
    >
      <Icon className="size-4" />
    </button>
  )
}

/** 문서 링크: 프로젝트·블로그를 찾아 `[제목](/blog/slug)`로 넣는다. */
function DocLinkPicker({ onPick }: { onPick: (title: string, path: string) => void }) {
  const [query, setQuery] = useState('')
  const projects = useProjects()
  const posts = usePosts()
  const q = query.trim().toLowerCase()
  const found = [
    ...(projects.data ?? []).map((p) => ({ ...p, kind: '프로젝트', path: `/projects/${p.slug}` })),
    ...(posts.data ?? []).map((p) => ({ ...p, kind: '블로그', path: `/blog/${p.slug}` })),
  ]
    .filter((c) => !q || c.title.toLowerCase().includes(q) || c.slug.includes(q))
    .slice(0, 30)
  return (
    <div className="space-y-2 border-b p-2">
      <Input autoFocus value={query} placeholder="프로젝트·블로그 검색" onChange={(e) => setQuery(e.target.value)} className="h-8" />
      <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
        {found.map((c) => (
          <button
            key={c.path}
            type="button"
            onClick={() => onPick(c.title, c.path)}
            className="flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs hover:bg-accent"
          >
            <span className="text-muted-foreground">{c.kind}</span>
            {c.title}
            {!c.published && <span className="text-muted-foreground">(비공개)</span>}
          </button>
        ))}
        {found.length === 0 && <span className="text-xs text-muted-foreground">찾은 문서가 없습니다.</span>}
      </div>
    </div>
  )
}

/**
 * 마크다운 입력창 + 툴바 + 미리보기(포트폴리오와 같은 렌더러). 넓은 화면은 좌우, 좁은 화면은 탭으로 바꾼다.
 * 이미지는 버튼·붙여넣기·끌어놓기로 올려 `![](주소)`를 넣는다.
 */
export function MarkdownEditor({
  id,
  value,
  onChange,
  invalid,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  invalid?: boolean
}) {
  const area = useRef<HTMLTextAreaElement>(null)
  const preview = useRef<HTMLDivElement>(null)
  const file = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  const [picking, setPicking] = useState(false)
  const [uploading, setUploading] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const shown = useDeferredValue(value)

  // 입력창의 지금 값과 선택 범위로 동작을 적용하고, 새 선택 범위를 되돌린다.
  function apply(action: Action) {
    const ta = area.current
    if (!ta) return
    const edit = action(ta.value, ta.selectionStart, ta.selectionEnd)
    onChange(edit.value)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(edit.start, edit.end)
    })
  }

  async function upload(files: File[]) {
    setError(null)
    for (const f of files) {
      setUploading((n) => n + 1)
      try {
        const url = await uploadImage(f, 'CONTENT')
        const alt = f.name.replace(/\.[^.]+$/, '')
        apply((v, s, e) => insert(v, s, e, `![${alt}](${url})`, true))
      } catch (e) {
        setError(e instanceof Error ? e.message : '이미지를 올리지 못했습니다.')
      } finally {
        setUploading((n) => n - 1)
      }
    }
  }

  const images = (list: FileList | null) => Array.from(list ?? []).filter((f) => f.type.startsWith('image/'))

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    const action = (e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && SHORTCUTS[e.key.toLowerCase()]
    if (!action) return
    e.preventDefault()
    apply(action)
  }

  function onPaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const found = images(e.clipboardData.files)
    if (!found.length) return
    e.preventDefault()
    void upload(found)
  }

  function onDrop(e: DragEvent<HTMLTextAreaElement>) {
    const found = images(e.dataTransfer.files)
    if (!found.length) return
    e.preventDefault()
    void upload(found)
  }

  // 미리보기를 입력창 스크롤 비율에 맞춰 따라가게 한다(줄 단위 대응은 하지 않는다).
  function onScroll() {
    const ta = area.current
    const pv = preview.current
    if (!ta || !pv) return
    const ratio = ta.scrollTop / Math.max(1, ta.scrollHeight - ta.clientHeight)
    pv.scrollTop = ratio * (pv.scrollHeight - pv.clientHeight)
  }

  const tool = (t: (typeof TOOLS)[number], i: number) =>
    t ? <ToolButton key={t[1]} icon={t[0]} label={t[1]} onClick={() => apply(t[2])} /> : <span key={`sep-${i}`} className="mx-1 h-4 w-px bg-border" />

  return (
    <div className={cn('rounded-md border', invalid && 'border-destructive')}>
      <div className="flex flex-wrap items-center gap-0.5 border-b p-1">
        {TOOLS.map(tool)}
        <ToolButton icon={Image} label="이미지 올리기" onClick={() => file.current?.click()} />
        {TOOLS_AFTER_IMAGE.map((t, i) => tool(t, i + TOOLS.length))}
        <ToolButton icon={FileText} label="문서 링크" active={picking} onClick={() => setPicking((p) => !p)} />
        {uploading > 0 && (
          <span className="ml-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Spinner /> 이미지 올리는 중
          </span>
        )}
        <div className="ml-auto flex gap-1 text-xs lg:hidden" role="tablist">
          {(['write', 'preview'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn('rounded-sm px-2 py-1', tab === t ? 'bg-accent text-foreground' : 'text-muted-foreground')}
            >
              {t === 'write' ? '작성' : '미리보기'}
            </button>
          ))}
        </div>
        <input
          ref={file}
          type="file"
          hidden
          multiple
          accept={acceptedTypes('CONTENT').join(',')}
          onChange={(e) => {
            void upload(images(e.target.files))
            e.target.value = ''
          }}
        />
      </div>
      {picking && (
        <DocLinkPicker
          onPick={(title, path) => {
            setPicking(false)
            apply((v, s, e) => insert(v, s, e, `[${v.slice(s, e) || title}](${path})`))
          }}
        />
      )}
      {error && <p className="border-b px-3 py-1.5 text-xs text-destructive">{error}</p>}
      <div className="grid lg:grid-cols-2">
        <textarea
          ref={area}
          id={id}
          value={value}
          aria-invalid={invalid}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onDrop={onDrop}
          onScroll={onScroll}
          spellCheck={false}
          className={cn(
            'h-[28rem] w-full resize-none bg-transparent p-3 font-mono text-xs leading-relaxed outline-none lg:border-r',
            tab !== 'write' && 'hidden lg:block',
          )}
        />
        <div
          ref={preview}
          aria-label="미리보기"
          className={cn('h-[28rem] overflow-y-auto px-5 [&>div>:first-child]:mt-3', tab !== 'preview' && 'hidden lg:block')}
        >
          {shown.trim() ? <Markdown>{shown}</Markdown> : <p className="p-3 text-sm text-muted-foreground">미리보기할 내용이 없습니다.</p>}
        </div>
      </div>
    </div>
  )
}
