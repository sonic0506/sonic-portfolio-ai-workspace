'use client';

import { SuggestionChips } from '@/components/molecules/suggestion-chips';
import { useAskChat } from '@/hooks/use-ask-chat';

/** 우측 aside의 프로필 카드. 메타는 전부 데이터 문자열이라 mono다. */
export function ProfileCard({ headline, meta }: { headline: string; meta: string[] }) {
  const askChat = useAskChat();
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      <p className="text-sm break-keep text-text-2">{headline}</p>
      {meta.length > 0 && (
        <>
          <div className="h-px bg-border" />
          <ul className="flex flex-col gap-1.5 font-mono text-2xs text-text-2">
            {meta.map((item) => (
              <li key={item} className="break-all">
                {item}
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="h-px bg-border" />
      <SuggestionChips
        suggestions={['어떤 개발자인지 짧게 소개해줘']}
        onSelect={askChat}
        className="[&>button]:w-full"
      />
    </div>
  );
}
