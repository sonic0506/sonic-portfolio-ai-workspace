import { cn } from '@/lib/utils';

/** 밝기만 오르내리는 펄스. reduced-motion에서는 globals가 애니메이션을 끊는다. */
function Bar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-4 animate-pulse rounded-xs bg-surface [animation-duration:1.2s]',
        className,
      )}
    />
  );
}

/** 기존 대화를 불러오는 동안의 자리. 메시지 두 세트 분량만 보여준다. */
export function ConversationSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-7">
      {[0, 1].map((index) => (
        <div key={index} className="flex flex-col gap-7">
          <div className="flex justify-end">
            <Bar className="w-52" />
          </div>
          <div className="flex flex-col gap-2">
            <Bar className="w-full" />
            <Bar className="w-[92%]" />
            <Bar className="w-[76%]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export { Bar as SkeletonBar };
