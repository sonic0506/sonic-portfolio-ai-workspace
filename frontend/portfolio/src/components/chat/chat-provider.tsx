"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ChatSource } from "@/lib/types";
import { readSse } from "./sse";
import {
  ChatHttpError,
  clearStoredSession,
  createSession,
  deleteSession,
  errorMessage,
  fetchHistory,
  loadStoredSession,
  postQuestion,
  type StoredSession,
} from "./session";

export type Stage = "SEARCHING" | "EXPANDING" | "ANSWERING";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources: ChatSource[];
  documents?: ChatSource[];
  unanswered?: boolean;
  error?: string;
  pending?: boolean;
};

type ChatContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  messages: ChatMessage[];
  stage: Stage | null;
  busy: boolean;
  ask: (question: string) => void;
  reset: () => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChat() {
  const value = useContext(ChatContext);
  if (!value) throw new Error("ChatProvider 안에서 사용해야 합니다.");
  return value;
}

let nextId = 0;
const newId = () => `m${Date.now()}-${nextId++}`;

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stage, setStage] = useState<Stage | null>(null);
  const [busy, setBusy] = useState(false);
  const sessionRef = useRef<StoredSession | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 새로고침 시 남아 있는 세션의 대화를 복원한다.
  useEffect(() => {
    const stored = loadStoredSession();
    if (!stored) return;
    sessionRef.current = stored;
    fetchHistory(stored)
      .then((history) => {
        if (history === null) {
          clearStoredSession();
          sessionRef.current = null;
          return;
        }
        setMessages(
          history.map((m) => ({
            id: newId(),
            role: m.role === "USER" ? "user" : "assistant",
            content: m.content,
            sources: m.sources,
          })),
        );
      })
      .catch(() => undefined);
  }, []);

  const updateLast = useCallback((update: (m: ChatMessage) => ChatMessage) => {
    setMessages((prev) => (prev.length ? [...prev.slice(0, -1), update(prev[prev.length - 1])] : prev));
  }, []);

  const ask = useCallback(
    (raw: string) => {
      const question = raw.trim();
      if (!question || busy) return;
      setOpen(true);
      setBusy(true);
      setStage("SEARCHING");
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: "user", content: question, sources: [] },
        { id: newId(), role: "assistant", content: "", sources: [], pending: true },
      ]);
      const controller = new AbortController();
      abortRef.current = controller;

      const run = async () => {
        let res: Response | null = null;
        // 세션이 만료(404)됐으면 새 세션으로 한 번만 다시 보낸다.
        for (let attempt = 0; attempt < 2; attempt++) {
          if (!sessionRef.current) sessionRef.current = await createSession();
          res = await postQuestion(sessionRef.current, question, controller.signal);
          if (res.status !== 404) break;
          clearStoredSession();
          sessionRef.current = null;
        }
        if (!res || !res.ok || !res.body) throw new ChatHttpError(res?.status ?? 0);

        for await (const { event, data } of readSse(res.body)) {
          const payload = JSON.parse(data);
          switch (event) {
            case "status":
              setStage(payload.stage as Stage);
              break;
            case "documents":
              updateLast((m) => ({ ...m, documents: mergeSources(m.documents ?? [], payload.documents) }));
              break;
            case "answer_delta":
              updateLast((m) => ({ ...m, content: m.content + payload.text }));
              break;
            case "done":
              updateLast((m) => ({ ...m, sources: payload.sources, unanswered: payload.unanswered, pending: false }));
              break;
            case "error":
              updateLast((m) => ({ ...m, error: payload.message ?? errorMessage(500), pending: false }));
              break;
          }
        }
      };

      run()
        .catch((e: unknown) => {
          if (controller.signal.aborted) return;
          const message = e instanceof ChatHttpError ? e.message : errorMessage(0);
          updateLast((m) => ({ ...m, error: message }));
        })
        .finally(() => {
          updateLast((m) => ({ ...m, pending: false }));
          setBusy(false);
          setStage(null);
          abortRef.current = null;
        });
    },
    [busy, updateLast],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    const current = sessionRef.current;
    sessionRef.current = null;
    clearStoredSession();
    if (current) void deleteSession(current);
    setMessages([]);
  }, []);

  return (
    <ChatContext.Provider value={{ open, setOpen, messages, stage, busy, ask, reset }}>{children}</ChatContext.Provider>
  );
}

function mergeSources(current: ChatSource[], added: ChatSource[]): ChatSource[] {
  const seen = new Set(current.map((s) => `${s.type}:${s.slug}`));
  return [...current, ...added.filter((s) => !seen.has(`${s.type}:${s.slug}`))];
}
