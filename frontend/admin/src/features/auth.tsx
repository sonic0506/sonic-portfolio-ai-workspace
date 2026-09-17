import { LOGIN_URL } from '@/lib/api'
import { Button, buttonVariants } from '@/components/ui/button'
import { useMe } from './auth-queries'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const me = useMe()
  if (me.isPending) return <Centered>확인 중…</Centered>
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
  return (
    <Centered>
      <h1 className="text-xl font-semibold">포트폴리오 관리</h1>
      <p className="text-sm text-muted-foreground">허용된 GitHub 계정으로만 로그인할 수 있습니다.</p>
      <a href={LOGIN_URL} className={buttonVariants()}>
        GitHub로 로그인
      </a>
    </Centered>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">{children}</div>
}
