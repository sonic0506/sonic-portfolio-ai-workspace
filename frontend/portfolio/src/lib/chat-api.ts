// 채팅 세션 API (ADR-0008, ADR-0011). 브라우저에서 부른다. 개발 중에는 /api/*를 Next rewrites가 넘기고,
// 운영에서는 NEXT_PUBLIC_API_BASE_URL(api 도메인)을 직접 부른다. Vercel을 거치면 질문 제한이 방문자 IP를 못 본다(ADR-0017).
import type { StoredConversation } from "./chat-store";
import type { ChatSource } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export type HistoryMessage = {
  role: "USER" | "ASSISTANT";
  content: string;
  sources: ChatSource[];
  createdAt: string;
};

type Session = Pick<StoredConversation, "id" | "key">;

const keyHeader = (session: Session) => ({ "X-Chat-Session-Key": session.key });

export async function createSession(): Promise<{ id: string; key: string; expiresAt: string }> {
  const res = await fetch(`${BASE}/api/chat/sessions`, { method: "POST" });
  if (!res.ok) throw new ChatHttpError(res.status);
  const body = (await res.json()) as { sessionId: string; sessionKey: string; expiresAt: string };
  return { id: body.sessionId, key: body.sessionKey, expiresAt: body.expiresAt };
}

/** 만료·삭제된 세션이면 null. */
export async function fetchHistory(
  session: Session,
  signal?: AbortSignal,
): Promise<{ messages: HistoryMessage[]; expiresAt: string } | null> {
  const res = await fetch(`${BASE}/api/chat/sessions/${session.id}`, { headers: keyHeader(session), signal });
  if (res.status === 404) return null;
  if (!res.ok) throw new ChatHttpError(res.status);
  return (await res.json()) as { messages: HistoryMessage[]; expiresAt: string };
}

export async function deleteSession(session: Session) {
  await fetch(`${BASE}/api/chat/sessions/${session.id}`, { method: "DELETE", headers: keyHeader(session) }).catch(
    () => undefined,
  );
}

export function postQuestion(session: Session, question: string, signal?: AbortSignal) {
  return fetch(`${BASE}/api/chat/sessions/${session.id}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream", ...keyHeader(session) },
    body: JSON.stringify({ question }),
    signal,
  });
}

export class ChatHttpError extends Error {
  constructor(readonly status: number) {
    super(errorMessage(status));
  }
}

/** 오류는 조용한 인라인 행이다. 사과하지 않고 원인과 다음 행동만 적는다. */
export function errorMessage(status: number): string {
  switch (status) {
    case 400:
      return "질문은 1~500자로 입력해 주세요.";
    case 404:
      return "대화가 만료되었습니다. 새 대화를 시작해 주세요.";
    case 409:
      return "이 대화에서 할 수 있는 질문 수를 모두 썼습니다. 새 대화를 시작해 주세요.";
    case 429:
      return "오늘 질문할 수 있는 횟수를 모두 사용했습니다. 내일 다시 이용해 주세요.";
    case 503:
      return "지금은 채팅을 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.";
    default:
      return "답변을 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }
}
