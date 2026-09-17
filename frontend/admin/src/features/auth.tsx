import { useEffect, useState } from 'react'
import { LOGIN_URL } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { Loading, Spinner } from '@/components/loading'
import { useMe } from './auth-queries'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const me = useMe()
  if (me.isPending) return <Loading label="로그인 확인 중…" className="min-h-dvh" />
  if (me.isError) {
    return (
      <Centered>
        <p>관리 서버에 연결하지 못했습니다.</p>
        <Button variant="outline" onClick={() => me.refetch()}>
          다시 시도
        </Button>
      </Centered>
    )
  }
  if (!me.data) return <LoginPage />
  return <>{children}</>
}

function LoginPage() {
  // GitHub로 넘어가는 동안 버튼을 잠그고 진행 중임을 보여준다.
  const [redirecting, setRedirecting] = useState(false)
  useEffect(() => {
    // 뒤로 가기로 돌아왔을 때(bfcache) 잠금을 푼다.
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setRedirecting(false)
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])
  return (
    <Centered>
      <h1 className="text-xl font-semibold">포트폴리오 관리</h1>
      <p className="text-sm text-muted-foreground">허용된 GitHub 계정으로만 로그인할 수 있습니다.</p>
      <a
        href={LOGIN_URL}
        aria-disabled={redirecting}
        onClick={(e) => {
          if (redirecting) e.preventDefault()
          else setRedirecting(true)
        }}
        className={cn(buttonVariants(), redirecting && 'pointer-events-none opacity-60')}
      >
        {redirecting && <Spinner />}
        {redirecting ? 'GitHub로 이동 중…' : 'GitHub로 로그인'}
      </a>
    </Centered>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">{children}</div>
}
