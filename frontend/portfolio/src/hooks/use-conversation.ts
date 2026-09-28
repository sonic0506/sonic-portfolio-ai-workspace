'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { ChatHttpError, createSession, errorMessage, postQuestion, type HistoryMessage } from '@/lib/chat-api';
import {
  getServerSnapshot,
  listConversations,
  subscribe,
  touch,
  upsert,
  type StoredConversation,
} from '@/lib/chat-store';
import { readSse } from '@/lib/sse';
import type { ChatSource } from '@/lib/types';

export type Stage = 'SEARCHING' | 'EXPANDING' | 'ANSWERING';
export type AssistantStatus = 'searching' | 'streaming' | 'done' | 'stopped' | 'error';

export type UserMessage = { id: string; role: 'user'; text: string };
export type AssistantMessage = {
  id: string;
  role: 'assistant';
  question: string;
  text: string;
  status: AssistantStatus;
  stage: Stage | null;
  /** 검색 단계에서 하나씩 드러나는 문서. */
  documents: ChatSource[];
  /** 답변이 끝난 뒤에만 그린다. */
  sources: ChatSource[];
  unanswered?: boolean;
  error?: string;
};
export type ChatMessage = UserMessage | AssistantMessage;

let nextId = 0;
const newId = () => `m${Date.now()}-${nextId++}`;

/** 사이드바·대화 화면이 함께 읽는 대화 목록. 만료된 대화는 자동으로 빠진다. */
export function useConversations() {
  return useSyncExternalStore(subscribe, listConversations, getServerSnapshot);
}

/** 서버 이력 → 화면 메시지. */
export function fromHistory(history: HistoryMessage[]): ChatMessage[] {
  let lastQuestion = '';
  return history.map((m) => {
    if (m.role === 'USER') {
      lastQuestion = m.content;
      return { id: newId(), role: 'user', text: m.content };
    }
    return {
      id: newId(),
      role: 'assistant',
      question: lastQuestion,
      text: m.content,
      status: 'done',
      stage: null,
      documents: [],
      sources: m.sources,
    };
  });
}

function mergeSources(current: ChatSource[], added: ChatSource[]): ChatSource[] {
  const seen = new Set(current.map((s) => `${s.type}:${s.slug}`));
  return [...current, ...added.filter((s) => !seen.has(`${s.type}:${s.slug}`))];
}

/**
 * 대화 하나의 질문·스트리밍. conversation이 없으면 첫 질문 때 서버 세션을 만들고
 * onCreated로 알린다(화면이 주소를 /chat/{id}로 바꾼다).
 * 404(서버에서 만료·삭제)면 onExpired를 부른다. 새 세션으로 몰래 바꾸지 않는다.
 */
export function useConversation({
  conversation,
  onCreated,
  onExpired,
}: {
  conversation: StoredConversation | null;
  onCreated?: (conversation: StoredConversation) => void;
  onExpired?: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const sessionRef = useRef(conversation);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    sessionRef.current = conversation;
  }, [conversation]);

  const patch = useCallback((id: string, update: (m: AssistantMessage) => Partial<AssistantMessage>) => {
    setMessages((prev) => prev.map((m) => (m.id === id && m.role === 'assistant' ? { ...m, ...update(m) } : m)));
  }, []);

  const run = useCallback(
    async (question: string, assistantId: string) => {
      const controller = new AbortController();
      controllerRef.current = controller;
      patch(assistantId, () => ({
        status: 'searching',
        stage: 'SEARCHING',
        text: '',
        documents: [],
        sources: [],
        error: undefined,
        unanswered: undefined,
      }));

      try {
        let session = sessionRef.current;
        if (!session) {
          const created = await createSession();
          const now = new Date().toISOString();
          session = { ...created, title: question.slice(0, 60), updatedAt: now };
          sessionRef.current = session;
          upsert(session);
          onCreated?.(session);
        }

        const res = await postQuestion(session, question, controller.signal);
        if (res.status === 404) {
          onExpired?.();
          throw new ChatHttpError(404);
        }
        if (!res.ok || !res.body) throw new ChatHttpError(res.status);

        for await (const { event, data } of readSse(res.body)) {
          const payload = JSON.parse(data);
          switch (event) {
            case 'status':
              patch(assistantId, () => ({ stage: payload.stage as Stage }));
              break;
            case 'documents':
              patch(assistantId, (m) => ({ documents: mergeSources(m.documents, payload.documents) }));
              break;
            case 'answer_delta':
              patch(assistantId, (m) => ({ status: 'streaming', text: m.text + payload.text }));
              break;
            case 'done':
              patch(assistantId, () => ({
                status: 'done',
                stage: null,
                sources: payload.sources ?? [],
                unanswered: payload.unanswered,
              }));
              break;
            case 'error':
              patch(assistantId, () => ({ status: 'error', stage: null, error: payload.message ?? errorMessage(500) }));
              break;
          }
        }
        // 질문이 저장됐으니 서버처럼 만료를 24시간 뒤로 민다.
        touch(session.id);
      } catch (e) {
        if (controller.signal.aborted) {
          patch(assistantId, () => ({ status: 'stopped', stage: null }));
          return;
        }
        const message = e instanceof ChatHttpError ? e.message : errorMessage(0);
        patch(assistantId, () => ({ status: 'error', stage: null, error: message }));
      } finally {
        // 스트림이 done 없이 끝났으면 받은 데까지로 마무리한다.
        patch(assistantId, (m) =>
          m.status === 'searching' || m.status === 'streaming' ? { status: 'done', stage: null } : {},
        );
        controllerRef.current = null;
      }
    },
    [patch, onCreated, onExpired],
  );

  const ask = useCallback(
    (raw: string) => {
      const question = raw.trim();
      if (!question || controllerRef.current) return;
      const assistantId = newId();
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: 'user', text: question },
        {
          id: assistantId,
          role: 'assistant',
          question,
          text: '',
          status: 'searching',
          stage: 'SEARCHING',
          documents: [],
          sources: [],
        },
      ]);
      void run(question, assistantId);
    },
    [run],
  );

  /** 오류가 난 답변을 같은 질문으로 다시 받는다. */
  const retry = useCallback((message: AssistantMessage) => void run(message.question, message.id), [run]);

  const stop = useCallback(() => controllerRef.current?.abort(), []);

  // 화면을 벗어나면 진행 중인 요청도 접는다. 개발 모드 StrictMode의 가짜 언마운트
  // (정리 → 곧바로 다시 설정)에는 끊지 않도록 한 틱 뒤에 정말 떠났는지 본다.
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      setTimeout(() => {
        if (!mountedRef.current) controllerRef.current?.abort();
      }, 0);
    };
  }, []);

  const last = messages[messages.length - 1];
  const busy = last?.role === 'assistant' && (last.status === 'searching' || last.status === 'streaming');

  return { messages, setMessages, ask, retry, stop, busy };
}

/**
 * 다른 화면(홈·본문 추천 질문)에서 넘겨받는 첫 질문. URL에 싣지 않고 클라이언트
 * 이동 사이에 메모리로 넘긴다. 새로고침하면 사라지는 게 맞다.
 */
let pendingQuestion: string | null = null;

export function setPendingQuestion(question: string) {
  pendingQuestion = question;
}

export function takePendingQuestion(): string | null {
  const question = pendingQuestion;
  pendingQuestion = null;
  return question;
}
