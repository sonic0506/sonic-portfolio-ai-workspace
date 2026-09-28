"use client";

import { SuggestionChips } from "@/components/molecules/suggestion-chips";
import { useAskChat } from "@/hooks/use-ask-chat";

/** 본문의 :::questions 블록 — 누르면 그 질문으로 새 대화를 연다. */
export function SuggestedQuestions({ questions }: { questions: string[] }) {
  const askChat = useAskChat();
  if (!questions.length) return null;
  return (
    <div className="my-7">
      <p className="mb-2.5 font-mono text-2xs text-text-3">이 내용에 대해 물어보기</p>
      <SuggestionChips suggestions={questions} onSelect={askChat} />
    </div>
  );
}
