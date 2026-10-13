"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { setPendingQuestion } from "@/hooks/use-conversation";
import { createSession } from "@/lib/chat-api";
import { upsert } from "@/lib/chat-store";
import type { ChatFocus } from "@/lib/types";

/**
 * 질문 하나로 새 대화를 연다. 질문은 세션과 함께 서버에 맡기고 /chat/{id}로 간다(ADR-0024).
 * 이동이 전체 페이지 로드가 되어도(배포 직후 등) 서버에 남아 있어 사라지지 않는다.
 * 세션을 못 만들면 예전처럼 메모리로 /chat에 넘긴다. /chat이 다시 시도하고 오류를 보여 준다.
 */
export function useAskChat() {
  const router = useRouter();
  const busyRef = useRef(false);
  return useCallback(
    async (question: string, focus?: ChatFocus) => {
      const trimmed = question.trim();
      if (!trimmed || busyRef.current) return;
      busyRef.current = true;
      try {
        const created = await createSession({ question: trimmed, focus });
        upsert({ ...created, title: trimmed.slice(0, 60), updatedAt: new Date().toISOString() });
        router.push(`/chat/${created.id}`);
      } catch {
        setPendingQuestion(trimmed, focus);
        router.push("/chat");
      } finally {
        busyRef.current = false;
      }
    },
    [router],
  );
}
