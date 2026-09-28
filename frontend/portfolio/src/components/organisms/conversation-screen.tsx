'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { AssistantMessage } from '@/components/molecules/assistant-message';
import { ChatComposer } from '@/components/molecules/chat-composer';
import { ConversationSkeleton, SkeletonBar } from '@/components/molecules/conversation-skeleton';
import { UserMessage } from '@/components/molecules/user-message';
import { Button } from '@/components/ui/button';
import { fromHistory, takePendingQuestion, useConversation, useConversations } from '@/hooks/use-conversation';
import { fetchHistory } from '@/lib/chat-api';
import { findConversation, removeConversation, syncExpiry, type StoredConversation } from '@/lib/chat-store';

/** 하단에서 이만큼 안쪽이면 따라 내려간다. 그보다 위로 올리면 자동 스크롤을 멈춘다. */
const STICK_THRESHOLD = 80;

type Phase = 'loading' | 'ready' | 'missing' | 'expired';

/** "2026-09-30T01:02:03Z" → "09.30 10:02" (로컬 시각) */
function formatExpiry(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 대화 화면. conversationId가 없으면 새 대화(/chat)이고, 첫 질문 때 서버 세션을
 * 만든 뒤 주소만 /chat/{id}로 바꾼다(다시 마운트하지 않아 스트리밍이 이어진다).
 */
export function ConversationScreen({ conversationId }: { conversationId: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [phase, setPhase] = useState<Phase>(conversationId ? 'loading' : 'ready');
  const [current, setCurrent] = useState<StoredConversation | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const bootedRef = useRef(false);

  const handleCreated = useCallback((created: StoredConversation) => {
    setCurrent(created);
    window.history.replaceState(null, '', `/chat/${created.id}`);
  }, []);
  const handleExpired = useCallback(() => {
    const id = conversationId ?? current?.id;
    if (id) removeConversation(id);
  }, [conversationId, current]);

  const { messages, setMessages, ask, retry, stop, busy } = useConversation({
    conversation: current,
    onCreated: handleCreated,
    onExpired: handleExpired,
  });

  // 처음 한 번: 기존 대화면 서버에서 본문을 받고, 새 대화면 넘겨받은 질문을 보낸다.
  /* eslint-disable react-hooks/set-state-in-effect -- 외부 저장소(localStorage·서버)를
     상태로 옮기는 마운트 시점 부트스트랩이다. 렌더 중에 읽으면 서버 렌더와 어긋난다. */
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    if (!conversationId) {
      const question = takePendingQuestion();
      if (question) ask(question);
      else router.replace('/');
      return;
    }

    const stored = findConversation(conversationId);
    if (!stored) {
      setPhase('missing');
      return;
    }
    setCurrent(stored);

    const controller = new AbortController();
    fetchHistory(stored, controller.signal)
      .then((history) => {
        if (!history) {
          // 서버가 이미 지운 대화: 목록에서도 지우고 본문을 보여주지 않는다.
          removeConversation(stored.id);
          setPhase('expired');
          return;
        }
        syncExpiry(stored.id, history.expiresAt);
        setMessages(fromHistory(history.messages));
        setPhase('ready');
      })
      .catch(() => {
        if (!controller.signal.aborted) setPhase('missing');
      });
  }, [conversationId, ask, router, setMessages]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // 보고 있는 동안 만료(1분 주기 확인)되거나 다른 탭에서 지워지면 본문을 거둔다.
  const conversations = useConversations();
  const activeId = conversationId ?? current?.id;
  const stored = activeId ? conversations.find((c) => c.id === activeId) : undefined;
  const gone = phase === 'ready' && !!activeId && !stored && !busy;

  // 토큰이 붙을 때마다 따라 내려간다. 사용자가 위로 올려 둔 동안에는 건드리지 않는다.
  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !stickRef.current) return;
    element.scrollTop = element.scrollHeight;
  }, [messages, phase]);

  const handleScroll = () => {
    const element = scrollRef.current;
    if (!element) return;
    stickRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < STICK_THRESHOLD;
  };

  const send = (question: string) => {
    setValue('');
    stickRef.current = true;
    ask(question);
  };

  if (phase === 'missing' || phase === 'expired' || gone) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="font-mono text-2xs text-text-3">{phase === 'missing' ? '404' : '만료됨'}</span>
        <p className="text-md break-keep text-text-2">
          {phase === 'missing'
            ? '이 브라우저에 없는 대화입니다.'
            : '마지막 질문 후 24시간이 지나 삭제된 대화입니다.'}
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/">새 대화</Link>
        </Button>
      </div>
    );
  }

  const title = stored?.title ?? messages.find((m) => m.role === 'user')?.text;

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-border px-5 py-2.5">
        {phase === 'loading' ? (
          <>
            <SkeletonBar className="w-40" />
            <SkeletonBar className="w-16" />
          </>
        ) : (
          <>
            {title && <h1 className="min-w-0 truncate text-sm font-medium">{title}</h1>}
            {/* 개수·시각은 데이터라 mono. */}
            <span className="shrink-0 font-mono text-2xs text-text-3">{messages.length}개 메시지</span>
            {stored && (
              <span className="ml-auto shrink-0 font-mono text-2xs text-text-3">
                {formatExpiry(stored.expiresAt)}까지 보관
              </span>
            )}
          </>
        )}
      </header>

      <div ref={scrollRef} onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-content flex-col gap-7 px-6 py-8 sm:px-8">
          {phase === 'loading' && <ConversationSkeleton />}
          {phase === 'ready' &&
            messages.map((message) =>
              message.role === 'assistant' ? (
                <AssistantMessage key={message.id} message={message} onStop={stop} onRetry={retry} />
              ) : (
                <UserMessage key={message.id} text={message.text} />
              ),
            )}
        </div>
      </div>

      <div className="shrink-0 px-6 pt-3 pb-2.5 sm:px-8">
        <div className="mx-auto w-full max-w-content">
          <ChatComposer
            value={value}
            onValueChange={setValue}
            onSubmit={send}
            busy={busy}
            onStop={stop}
            textareaRef={textareaRef}
            disabled={phase !== 'ready'}
            autoFocus
          />
          <p className="mt-2 text-center font-mono text-2xs text-text-3">
            공개된 글을 근거로 답합니다 · 대화는 마지막 질문 후 24시간 뒤 삭제됩니다
          </p>
        </div>
      </div>
    </div>
  );
}
