'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkCjkFriendly from 'remark-cjk-friendly';
import remarkGfm from 'remark-gfm';
import { Check, Copy, TriangleAlert } from 'lucide-react';

import { StreamCursor } from '@/components/atoms/stream-cursor';
import { SearchingDocs } from '@/components/molecules/searching-docs';
import { SourceList } from '@/components/molecules/source-list';
import { Button } from '@/components/ui/button';
import type { AssistantMessage as Message } from '@/hooks/use-conversation';
import { stripCitations } from '@/lib/citations';

const COPIED_MS = 1500;

/** 답변 본문. 채팅 폭에 맞춰 위키 본문보다 한 단계 작고 촘촘하게 그린다. */
function AnswerText({ text, streaming }: { text: string; streaming: boolean }) {
  return (
    <div className="font-body text-md leading-[1.75] break-keep text-text-1 [&_a]:text-accent-text [&_a:hover]:underline [&_code]:rounded-xs [&_code]:bg-surface [&_code]:px-1 [&_code]:font-mono [&_code]:text-sm [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-3 [&_strong]:font-medium [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&>*:first-child]:mt-0">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkCjkFriendly]}>{stripCitations(text)}</ReactMarkdown>
      {streaming && <StreamCursor />}
    </div>
  );
}

export function AssistantMessage({
  message,
  onStop,
  onRetry,
}: {
  message: Message;
  onStop: () => void;
  onRetry: (message: Message) => void;
}) {
  const { status, text } = message;

  // 검색 단계에서는 아직 글자가 없다. 무엇을 찾고 있는지만 보여준다.
  if (status === 'searching') return <SearchingDocs stage={message.stage} docs={message.documents} />;

  const hasText = text.length > 0;

  return (
    <div className="flex flex-col">
      {hasText && <AnswerText text={text} streaming={status === 'streaming'} />}

      {status === 'streaming' && (
        <div className="mt-3">
          <Button type="button" variant="ghost" size="sm" onClick={onStop}>
            중지
          </Button>
        </div>
      )}

      {status === 'stopped' && <span className="mt-3 font-mono text-2xs text-text-3">생성 중지됨</span>}

      {status === 'error' && (
        // 오류는 조용한 인라인 행이다. 배너도, 사과도 두지 않는다.
        <div className="mt-3 flex flex-col gap-2">
          <p className="flex items-center gap-2.5 text-md text-text-2">
            <TriangleAlert className="size-4 shrink-0 text-text-3" strokeWidth={1.5} />
            {message.error}
          </p>
          {!hasText && (
            <div>
              <Button type="button" variant="ghost" size="sm" onClick={() => onRetry(message)}>
                다시 시도
              </Button>
            </div>
          )}
        </div>
      )}

      {status === 'done' && (
        <>
          <SourceList sources={message.sources} />
          {message.unanswered && (
            <p className="mt-3 text-sm text-text-3">답하지 못한 질문으로 기록했습니다. 내용을 보강하는 데 참고하겠습니다.</p>
          )}
          {hasText && <CopyButton text={stripCitations(text)} />}
        </>
      )}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 클립보드 권한이 없으면 표시만 하지 않는다.
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };

  return (
    <div className="mt-3 flex items-center">
      <Button type="button" variant="ghost" size="icon-sm" onClick={copy} aria-label={copied ? '복사됨' : '답변 복사'} className="size-6.5">
        {copied ? <Check className="size-3.5" strokeWidth={1.5} /> : <Copy className="size-3.5" strokeWidth={1.5} />}
      </Button>
    </div>
  );
}
