/**
 * 대화 목록 저장소 (ADR-0011 후속 결정, 2026-09-29).
 *
 * 대화 하나 = 서버 채팅 세션 하나다. 브라우저에는 세션 식별값·비밀키·제목·만료 시각만
 * 둔다. 본문은 저장하지 않고 열 때마다 서버에서 받는다. 그래야 서버가 24시간 뒤
 * 지운 대화가 브라우저에 남지 않는다.
 */

export type StoredConversation = {
  /** 서버 sessionId. URL(/chat/{id})에도 쓴다. */
  id: string;
  /** 서버가 발급한 비밀키. 조회·질문 헤더로만 보낸다. */
  key: string;
  title: string;
  /** ISO-8601. 마지막 질문 후 24시간(서버와 같은 슬라이딩 규칙). */
  expiresAt: string;
  /** 목록 정렬용. 최근에 질문한 대화가 위로 온다. */
  updatedAt: string;
};

const STORAGE_KEY = "portfolio.chat.conversations.v1";
/** ADR-0011 1차의 단일 세션 저장 키. 처음 읽을 때 목록으로 옮긴다. */
const LEGACY_KEY = "portfolio.chat.session";
/** 목록 상한. 넘으면 오래된 대화부터 목록에서 뺀다(서버 세션은 만료로 지워진다). */
export const MAX_CONVERSATIONS = 30;
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const CHANGE_EVENT = "portfolio:chat-store";

const EMPTY: StoredConversation[] = [];
let cache: { raw: string | null; list: StoredConversation[] } | null = null;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeRaw(list: StoredConversation[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // 프라이빗 모드·용량 초과: 목록이 남지 않을 뿐 대화는 계속된다.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function parse(raw: string | null): StoredConversation[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw) as unknown;
    return Array.isArray(value)
      ? value.filter((c): c is StoredConversation => typeof c?.id === "string" && typeof c?.key === "string")
      : [];
  } catch {
    return [];
  }
}

export function isExpired(conversation: StoredConversation, now = Date.now()): boolean {
  const at = Date.parse(conversation.expiresAt);
  return Number.isNaN(at) || at <= now;
}

/** 만료를 걸러 최근 순으로. 순수 함수라 테스트 대상이다. */
export function visible(list: StoredConversation[], now = Date.now()): StoredConversation[] {
  return list
    .filter((c) => !isExpired(c, now))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, MAX_CONVERSATIONS);
}

function migrateLegacy() {
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return;
    window.localStorage.removeItem(LEGACY_KEY);
    const legacy = JSON.parse(raw) as { sessionId?: string; sessionKey?: string };
    if (!legacy.sessionId || !legacy.sessionKey) return;
    // 실제 만료 시각은 모른다. 최대치로 두고, 열 때 서버 값(또는 404)으로 바로잡는다.
    const now = new Date();
    upsert({
      id: legacy.sessionId,
      key: legacy.sessionKey,
      title: "이전 대화",
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
      updatedAt: now.toISOString(),
    });
  } catch {
    // 옮기지 못하면 이전 대화가 목록에 없을 뿐이다.
  }
}

/**
 * 만료를 뺀 목록. useSyncExternalStore 스냅샷이라 저장값과 보이는 개수가 같으면
 * 같은 배열을 돌려준다. 읽기만 하고 쓰지 않는다(지우기는 prune).
 */
export function listConversations(): StoredConversation[] {
  if (typeof window === "undefined") return EMPTY;
  const raw = readRaw();
  if (cache && cache.raw === raw && visible(cache.list).length === cache.list.length) return cache.list;
  cache = { raw, list: visible(parse(raw)) };
  return cache.list;
}

/** 만료된 대화를 저장소에서 지운다. 렌더 밖(타이머·이벤트)에서만 부른다. */
function prune() {
  const all = parse(readRaw());
  const list = visible(all);
  if (list.length !== all.length) writeRaw(list);
}

export function findConversation(id: string): StoredConversation | undefined {
  return listConversations().find((c) => c.id === id);
}

export function upsert(conversation: StoredConversation) {
  const rest = parse(readRaw()).filter((c) => c.id !== conversation.id);
  writeRaw(visible([conversation, ...rest]));
}

/** 질문을 보낼 때마다 서버처럼 만료를 24시간 뒤로 민다. */
export function touch(id: string, serverExpiresAt?: string) {
  const current = parse(readRaw()).find((c) => c.id === id);
  if (!current) return;
  const now = new Date();
  upsert({
    ...current,
    expiresAt: serverExpiresAt ?? new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
    updatedAt: now.toISOString(),
  });
}

/** 서버가 알려 준 만료 시각으로 맞춘다(목록 순서는 그대로). */
export function syncExpiry(id: string, expiresAt: string) {
  const list = parse(readRaw());
  const index = list.findIndex((c) => c.id === id);
  if (index < 0 || list[index].expiresAt === expiresAt) return;
  list[index] = { ...list[index], expiresAt };
  writeRaw(visible(list));
}

export function removeConversation(id: string) {
  writeRaw(parse(readRaw()).filter((c) => c.id !== id));
}

/**
 * useSyncExternalStore용 구독. 같은 탭 변경·다른 탭 storage 이벤트에 더해
 * 1분마다, 탭으로 돌아올 때마다 다시 읽어 만료된 대화를 목록에서 뺀다.
 */
export function subscribe(onChange: () => void) {
  migrateLegacy();
  prune();
  const recheck = () => {
    prune();
    onChange();
  };
  const onVisible = () => {
    if (!document.hidden) recheck();
  };
  const timer = window.setInterval(recheck, 60_000);
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  window.addEventListener("focus", recheck);
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    window.clearInterval(timer);
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
    window.removeEventListener("focus", recheck);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

export const getServerSnapshot = () => EMPTY;
