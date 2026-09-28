import { cn } from '@/lib/utils';

const KEYFRAMES = 'typing-dot';
const DOTS = [0, 1, 2];

/** 문서를 뒤질 필요가 없는 질문에 쓰는 대기 표시. */
export function TypingDots({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="생각 중"
      className={cn('flex items-center gap-1', className)}
    >
      <style href={KEYFRAMES} precedence="medium">
        {`@keyframes ${KEYFRAMES}{0%,100%{opacity:.25}50%{opacity:1}}`}
      </style>

      {DOTS.map((index) => (
        <span
          key={index}
          className="size-1 rounded-xs bg-text-2"
          style={{
            animation: `${KEYFRAMES} 1.1s ease-in-out infinite`,
            animationDelay: `${index * 0.18}s`,
          }}
        />
      ))}
    </span>
  );
}
