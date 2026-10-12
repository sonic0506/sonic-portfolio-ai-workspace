import { cn } from '@/lib/utils';

function Bar({ className }: { className?: string }) {
  return <div className={cn('h-4 animate-pulse rounded-xs bg-surface [animation-duration:1.2s]', className)} />;
}

/**
 * 소개·프로젝트·블로그 상세(DocLayout)를 서버에서 그리는 동안의 자리. 같은 폭·여백을 써서
 * 본문이 들어올 때 레이아웃이 튀지 않게 한다.
 */
export function DocSkeleton() {
  return (
    <div role="status" aria-label="불러오는 중" className="h-full overflow-hidden">
      <div className="mx-auto flex w-full max-w-[1068px] items-start gap-12 px-6 pt-10 pb-20 sm:px-10">
        <div className="flex max-w-[720px] min-w-0 flex-1 flex-col">
          <Bar className="w-20" />
          <Bar className="mt-4 h-7 w-[85%]" />
          <Bar className="mt-2 h-7 w-[55%]" />
          <Bar className="mt-4 w-[70%]" />
          <Bar className="mt-3 h-3 w-40" />
          <div className="mt-6 h-px bg-border" />
          {[0, 1].map((section) => (
            <div key={section} className="mt-10 flex flex-col gap-2.5">
              <Bar className="mb-2 h-6 w-48" />
              <Bar className="w-full" />
              <Bar className="w-[94%]" />
              <Bar className="w-[88%]" />
              <Bar className="w-[60%]" />
            </div>
          ))}
        </div>
        <div className="hidden w-aside shrink-0 flex-col gap-2.5 lg:flex">
          <Bar className="mb-1 h-3 w-10" />
          {['w-32', 'w-40', 'w-28', 'w-36', 'w-24'].map((width) => (
            <Bar key={width} className={width} />
          ))}
        </div>
      </div>
    </div>
  );
}
