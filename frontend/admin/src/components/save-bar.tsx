import { Link } from 'react-router'
import { ErrorText } from '@/components/layout'
import { Spinner } from '@/components/loading'
import { Button, buttonVariants } from '@/components/ui/button'

/** 폼 아래 저장·취소. 검증 오류가 있으면 알린다. */
export function SaveBar({
  pending,
  error,
  hasErrors,
  cancelTo,
  saved,
}: {
  pending: boolean
  error: unknown
  hasErrors: boolean
  cancelTo?: string
  saved?: boolean
}) {
  return (
    <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur">
      <Button type="submit" disabled={pending}>
        {pending && <Spinner />}
        {pending ? '저장 중…' : '저장'}
      </Button>
      {cancelTo && (
        <Link to={cancelTo} className={buttonVariants({ variant: 'outline' })}>
          목록으로
        </Link>
      )}
      {hasErrors && <p className="text-sm text-destructive">입력값을 확인해주세요.</p>}
      {saved && !hasErrors && !error && !pending && <p className="text-sm text-muted-foreground">저장했습니다.</p>}
      <ErrorText error={error} />
    </div>
  )
}
