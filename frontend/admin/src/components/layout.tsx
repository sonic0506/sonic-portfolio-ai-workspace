import { NavLink, Outlet } from 'react-router'
import { Button } from '@/components/ui/button'
import { useLogout, useMe } from '@/features/auth-queries'
import { cn } from '@/lib/utils'

const NAV = [
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
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <span className="font-semibold">포트폴리오 관리</span>
          <nav className="flex flex-1 gap-4 text-sm">
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
  return <p className="text-sm text-destructive">{error instanceof Error ? error.message : '요청에 실패했습니다.'}</p>
}
