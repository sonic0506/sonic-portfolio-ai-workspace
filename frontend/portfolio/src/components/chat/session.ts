// 채팅 세션 저장 (ADR-0011) — 로그인이 없으므로 브라우저 localStorage에 식별자와 비밀키를 둔다.
import type { ChatSource } from "@/lib/types";

const STORAGE_KEY = "portfolio.chat.session";

export type StoredSession = { sessionId: string; sessionKey: string };

export type HistoryMessage = {
  role: "USER" | "ASSISTANT";
  content: string;
  sources: ChatSource[];
  createdAt: string;
};

export function loadStoredSession(): StoredSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    return parsed.sessionId && parsed.sessionKey ? { sessionId: parsed.sessionId, sessionKey: parsed.sessionKey } : null;
  } catch {
    return null;
  }
}

function store(session: StoredSession | null) {
  try {
    if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 저장소를 못 쓰면 새로고침 시 대화가 이어지지 않을 뿐이다.
  }
}

export function clearStoredSession() {
  store(null);
}

export async function createSession(): Promise<StoredSession> {
  const res = await fetch("/api/chat/sessions", { method: "POST" });
  if (!res.ok) throw new ChatHttpError(res.status);
  const body = (await res.json()) as StoredSession;
  const session = { sessionId: body.sessionId, sessionKey: body.sessionKey };
  store(session);
  return session;
}

/** 만료·삭제된 세션이면 null. */
export async function fetchHistory(session: StoredSession): Promise<HistoryMessage[] | null> {
  const res = await fetch(`/api/chat/sessions/${session.sessionId}`, {
    headers: { "X-Chat-Session-Key": session.sessionKey },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new ChatHttpError(res.status);
  const body = (await res.json()) as { messages: HistoryMessage[] };
  return body.messages;
}

export async function deleteSession(session: StoredSession) {
  await fetch(`/api/chat/sessions/${session.sessionId}`, {
    method: "DELETE",
    headers: { "X-Chat-Session-Key": session.sessionKey },
  }).catch(() => undefined);
}

export function postQuestion(session: StoredSession, question: string, signal?: AbortSignal) {
  return fetch(`/api/chat/sessions/${session.sessionId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      "X-Chat-Session-Key": session.sessionKey,
    },
    body: JSON.stringify({ question }),
    signal,
  });
}

export class ChatHttpError extends Error {
  constructor(readonly status: number) {
    super(errorMessage(status));
  }
}

export function errorMessage(status: number): string {
  switch (status) {
    case 400:
      return "질문은 1~500자로 입력해주세요.";
    case 409:
      return "이 대화에서 할 수 있는 질문 수를 모두 썼어요. 새 대화를 시작해주세요.";
    case 429:
      return "오늘 질문할 수 있는 횟수를 모두 사용했어요. 내일 다시 이용해주세요.";
    case 503:
      return "지금은 채팅을 사용할 수 없어요. 잠시 후 다시 시도해주세요.";
    default:
      return "답변을 가져오지 못했어요. 잠시 후 다시 시도해주세요.";
  }
}
