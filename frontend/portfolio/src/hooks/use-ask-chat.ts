"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { setPendingQuestion } from "@/hooks/use-conversation";

/** 질문 하나로 새 대화를 연다. 질문은 URL이 아니라 메모리로 넘기고 /chat이 이어받는다. */
export function useAskChat() {
  const router = useRouter();
  return useCallback(
    (question: string) => {
      const trimmed = question.trim();
      if (!trimmed) return;
      setPendingQuestion(trimmed);
      router.push("/chat");
    },
    [router],
  );
}
