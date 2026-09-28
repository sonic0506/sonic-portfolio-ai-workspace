import type { Career } from '@/lib/types';
import { cn, formatPeriod } from '@/lib/utils';

/** 경력 타임라인 한 항목. 재직 중(종료일 없음)만 악센트 도트다. */
export function CareerEntry({ career }: { career: Career }) {
  const current = career.periodEnd === null;
  return (
    <li className="relative pl-6">
      <span
        aria-hidden="true"
        className={cn('absolute top-2 -left-[3.5px] size-1.5 rounded-xs', current ? 'bg-accent' : 'bg-border-hi')}
      />
      <h3 className="text-base leading-[1.4] font-medium tracking-[-0.02em]">{career.company}</h3>
      {/* 역할·기간은 데이터라 mono. */}
      <p className="mt-1 font-mono text-2xs text-text-2">
        {[career.role, formatPeriod(career.periodStart, career.periodEnd)].filter(Boolean).join(' · ')}
      </p>
      {career.description && (
        <p className="mt-2 font-body text-md break-keep whitespace-pre-line text-text-2">{career.description}</p>
      )}
    </li>
  );
}
