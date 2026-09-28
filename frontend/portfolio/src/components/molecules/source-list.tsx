import Link from 'next/link';

import { Thread, ThreadItem, ThreadLink } from '@/components/molecules/thread';
import type { ChatSource } from '@/lib/types';

const TYPE_LABEL: Record<string, string> = { PROJECT: '프로젝트', BLOG: '블로그', PROFILE: '소개', FAQ: 'FAQ' };

/** 답변이 끝난 뒤, 근거가 있을 때만 그린다. FAQ처럼 주소가 없는 출처는 링크 없이 둔다. */
export function SourceList({ sources }: { sources: ChatSource[] }) {
  if (sources.length === 0) return null;

  return (
    <section className="mt-4 flex flex-col gap-2">
      <h3 className="font-mono text-2xs text-text-3">근거 문서 {sources.length}건</h3>
      {/* 시그니처 스레드: accent-line 세로 스템 + ㄴ자 분기 */}
      <Thread>
        {sources.map((source) => (
          <ThreadItem key={`${source.type}:${source.slug}`} className="min-h-7 justify-between gap-3">
            {source.url ? (
              <ThreadLink asChild className="min-w-0 text-xs">
                <Link href={source.url}>
                  <span className="truncate">{source.title}</span>
                </Link>
              </ThreadLink>
            ) : (
              <span className="min-w-0 truncate py-1 text-xs text-text-2">{source.title}</span>
            )}
            <span className="shrink-0 font-mono text-2xs text-text-3">{TYPE_LABEL[source.type] ?? source.type}</span>
          </ThreadItem>
        ))}
      </Thread>
    </section>
  );
}
