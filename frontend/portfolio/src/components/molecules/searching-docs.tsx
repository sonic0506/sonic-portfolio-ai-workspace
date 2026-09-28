import type { Stage } from '@/hooks/use-conversation';
import type { ChatSource } from '@/lib/types';

/** 백엔드 SSE status 이벤트의 단계 문구. */
const STAGE_LABEL: Record<Stage, string> = {
  SEARCHING: '문서를 찾는 중',
  EXPANDING: '관련 문서를 확인하는 중',
  ANSWERING: '답변을 작성하는 중',
};

/** 문서가 드러나는 간격. 항목마다 이만큼 늦게 자리를 잡는다. */
const DOC_REVEAL_INTERVAL = 300;

export function SearchingDocs({ stage, docs }: { stage: Stage | null; docs: ChatSource[] }) {
  return (
    <div className="flex flex-col gap-2">
      {/* 상태 라벨도 데이터 문자열이라 mono. */}
      <span role="status" className="font-mono text-2xs text-text-3">
        {STAGE_LABEL[stage ?? 'SEARCHING']}
      </span>
      <ul className="flex flex-col gap-1.5">
        {docs.map((doc, index) => (
          <li
            key={`${doc.type}:${doc.slug}`}
            className="flex animate-in items-center gap-2.5 duration-300 ease-sonic fade-in-0 fill-mode-backwards slide-in-from-bottom-1"
            style={{ animationDelay: `${index * DOC_REVEAL_INTERVAL}ms` }}
          >
            <span
              aria-hidden="true"
              className={doc.type === 'PROJECT' ? 'size-1.5 shrink-0 bg-accent' : 'size-1.5 shrink-0 rounded-xs bg-text-3'}
            />
            <span className="truncate text-sm text-text-3">{doc.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
