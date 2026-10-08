import Link from 'next/link';
import { Markdown } from '@/components/markdown/markdown';
import type { Achievement, Career } from '@/lib/types';
import { formatMonth, formatTenure } from '@/lib/utils';

/** 값이 있는 항목만 "a | b | c"로 잇는다(원티드식 메타 줄). 날짜·직무는 데이터라 mono. */
function MetaLine({ items }: { items: (string | null)[] }) {
  const values = items.filter((v): v is string => !!v && v.trim() !== '');
  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-2 font-mono text-2xs text-text-2">
      {values.map((v, i) => (
        <span key={`${v}-${i}`} className="flex items-center gap-x-2">
          {i > 0 && <span aria-hidden="true" className="text-border-hi">|</span>}
          {v}
        </span>
      ))}
    </p>
  );
}

function AchievementItem({ item }: { item: Achievement }) {
  const period = `${formatMonth(item.periodStart)} - ${item.periodEnd ? formatMonth(item.periodEnd) : '진행 중'}`;
  return (
    <li>
      <h4 className="text-base leading-[1.4] font-medium tracking-[-0.02em]">
        {item.project ? (
          <Link href={item.project.url} className="hover:text-accent">
            {item.title} <span aria-hidden="true" className="text-text-3">→</span>
          </Link>
        ) : (
          item.title
        )}
      </h4>
      <MetaLine items={[period, item.job, item.position]} />
      {item.bodyMarkdown && <Markdown className="mt-2 text-md text-text-2">{item.bodyMarkdown}</Markdown>}
    </li>
  );
}

/**
 * 원티드식 경력 한 항목(ADR-0019): 로고 · 회사 · 재직 기간 | 고용형태 | 직무 | 직책, 그 아래 주요 성과.
 * 로고는 이미지 업로드 기능 전까지 회사명 첫 글자 자리 표시다.
 */
export function CareerEntry({ career }: { career: Career }) {
  return (
    <li className="flex gap-4">
      <div
        aria-hidden="true"
        className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-border bg-surface font-display text-lg text-text-3"
      >
        {career.company.trim().charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-lg leading-[1.4] font-medium tracking-[-0.02em]">{career.company}</h3>
        <MetaLine
          items={[
            career.periodStart ? formatTenure(career.periodStart, career.periodEnd) : null,
            career.employmentType,
            career.role,
            career.position,
          ]}
        />
        {career.description && (
          <p className="mt-3 font-body text-md break-keep whitespace-pre-line text-text-2">{career.description}</p>
        )}
        {career.achievements.length > 0 && (
          <ul className="mt-8 flex flex-col gap-10">
            {career.achievements.map((a) => (
              <AchievementItem key={`${a.title}-${a.periodStart}`} item={a} />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}
