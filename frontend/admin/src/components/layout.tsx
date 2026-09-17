import { NavLink, Outlet } from 'react-router'
import { Spinner } from '@/components/loading'
import { Button } from '@/components/ui/button'
import { useLogout, useMe } from '@/features/auth-queries'
import { ApiError } from '@/lib/api'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/projects', label: '프로젝트' },
  { to: '/posts', label: '블로그' },
  { to: '/profile', label: '프로필' },
  { to: '/taxonomy', label: '기술·분류' },
  { to: '/unanswered', label: '답하지 못한 질문' },
  { to: '/faqs', label: 'FAQ' },
  { to: '/rag', label: '색인 상태' },
]

export function Layout() {
  const me = useMe()
  const logout = useLogout()
  return (
    <div className="min-h-dvh">
      <header className="border-b">
        <div className="mx-auto flex min-h-14 max-w-6xl items-center gap-6 px-4 py-2">
          <span className="font-semibold">포트폴리오 관리</span>
          <nav className="flex flex-1 flex-wrap gap-x-4 gap-y-1 text-sm">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn('text-muted-foreground hover:text-foreground', isActive && 'font-medium text-foreground')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2 text-sm">
            {me.data?.avatarUrl && <img src={me.data.avatarUrl} alt="" className="size-6 rounded-full" />}
            <span>{me.data?.name ?? me.data?.login}</span>
            <Button variant="ghost" size="sm" onClick={() => logout.mutate()} disabled={logout.isPending}>
              {logout.isPending && <Spinner />}
              로그아웃
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export function PageTitle({ children, actions }: { children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold">{children}</h1>
      <div className="flex gap-2">{actions}</div>
    </div>
  )
}

export function ErrorText({ error }: { error: unknown }) {
  if (!error) return null
  return <p className="text-sm text-destructive">{errorMessage(error)}</p>
}

const STATUS_MESSAGE: Record<number, string> = {
  400: '입력값이 올바르지 않습니다.',
  403: '권한이 없거나 보안 토큰이 만료되었습니다. 새로고침 후 다시 시도해주세요.',
  404: '대상을 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.',
  409: '이미 사용 중인 값(slug·코드)이거나 다른 곳에서 참조 중이라 처리할 수 없습니다.',
}

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const base = STATUS_MESSAGE[error.status] ?? `요청에 실패했습니다 (${error.status}).`
    return error.detail ? `${base} (${error.detail})` : base
  }
  return error instanceof Error ? error.message : '요청에 실패했습니다.'
}
