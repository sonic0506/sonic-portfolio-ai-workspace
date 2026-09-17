"use client";

import { MessageCircleQuestion } from "lucide-react";
import { useChat } from "./chat-provider";

/** 본문의 :::questions 블록 — 누르면 채팅으로 질문한다. */
export function SuggestedQuestions({ questions }: { questions: string[] }) {
  const { ask, busy } = useChat();
  if (!questions.length) return null;
  return (
    <div className="my-5 rounded-lg border bg-muted/40 p-4">
      <p className="mt-0 mb-2 flex items-center gap-1.5 text-sm font-medium">
        <MessageCircleQuestion className="size-4" />
        이 내용에 대해 물어보기
      </p>
      <ul className="my-0 flex list-none flex-col items-start gap-1.5 pl-0">
        {questions.map((q) => (
          <li key={q} className="my-0">
            <button
              type="button"
              disabled={busy}
              onClick={() => ask(q)}
              className="text-left text-sm underline-offset-4 hover:underline disabled:opacity-50"
            >
              {q}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
