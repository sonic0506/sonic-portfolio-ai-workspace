import { ArrowRight, ChevronDown } from 'lucide-react';
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
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-base leading-[1.4] font-medium tracking-[-0.02em]">{item.title}</h4>
        {item.project && (
          <Link
            href={item.project.url}
            aria-label={`${item.title} 프로젝트 상세 보기`}
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2.5 py-1 text-sm text-text-2 hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-accent"
          >
            상세 보기
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </Link>
        )}
      </div>
      <MetaLine items={[period, item.job, item.position]} />
      {item.bodyMarkdown && <Markdown className="mt-2 text-md text-text-2">{item.bodyMarkdown}</Markdown>}
    </li>
  );
}

/** 성과가 이 수보다 많으면 앞의 VISIBLE_ACHIEVEMENTS개만 펼쳐 두고 나머지는 더보기로 접는다. */
const VISIBLE_ACHIEVEMENTS = 3;

/**
 * 원티드식 경력 한 항목(ADR-0019): 로고 · 회사 · 재직 기간 | 고용형태 | 직무 | 직책, 그 아래 주요 성과.
 * 로고는 어드민에서 올린 이미지(ADR-0020), 없으면 회사명 첫 글자다.
 */
export function CareerEntry({ career }: { career: Career }) {
  const rest = career.achievements.slice(VISIBLE_ACHIEVEMENTS);
  return (
    <li className="flex gap-4">
      <div
        aria-hidden="true"
        className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface font-display text-lg text-text-3"
      >
        {career.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={career.logoUrl} alt="" className="size-full object-cover" />
        ) : (
          career.company.trim().charAt(0)
        )}
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
            {career.achievements.slice(0, VISIBLE_ACHIEVEMENTS).map((a) => (
              <AchievementItem key={`${a.title}-${a.periodStart}`} item={a} />
            ))}
          </ul>
        )}
        {rest.length > 0 && (
          // 서버 컴포넌트라 JS 없이 <details>로 접는다. 접힌 성과도 HTML에 남아 검색·찾기에 걸린다.
          <details className="group mt-10">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-text-2 hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
              <span className="group-open:hidden">주요 성과 {rest.length}개 더보기</span>
              <span className="hidden group-open:inline">접기</span>
              <ChevronDown aria-hidden="true" className="size-4 transition-transform group-open:rotate-180" />
            </summary>
            <ul className="mt-10 flex flex-col gap-10">
              {rest.map((a) => (
                <AchievementItem key={`${a.title}-${a.periodStart}`} item={a} />
              ))}
            </ul>
          </details>
        )}
      </div>
    </li>
  );
}
