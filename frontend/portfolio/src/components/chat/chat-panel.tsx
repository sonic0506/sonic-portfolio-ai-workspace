"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MessageCircle, RotateCcw, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ChatSource } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useChat, type ChatMessage, type Stage } from "./chat-provider";

const STAGE_LABEL: Record<Stage, string> = {
  SEARCHING: "문서를 찾는 중",
  EXPANDING: "관련 문서를 확인하는 중",
  ANSWERING: "답변을 작성하는 중",
};

const EXAMPLES = ["어떤 프로젝트를 해왔나요?", "주로 쓰는 기술은 무엇인가요?"];

export function ChatPanel() {
  const { open, setOpen, messages, stage, busy, ask, reset } = useChat();
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  const submit = () => {
    if (!input.trim() || busy) return;
    ask(input);
    setInput("");
  };

  if (!open) {
    return (
      <Button
        size="lg"
        className="fixed right-4 bottom-4 z-40 rounded-full shadow-lg"
        onClick={() => setOpen(true)}
        aria-label="채팅 열기"
      >
        <MessageCircle />
        질문하기
      </Button>
    );
  }

  return (
    <section
      aria-label="포트폴리오 채팅"
      className="fixed inset-x-0 bottom-0 z-40 flex h-[85dvh] flex-col border bg-background shadow-2xl sm:inset-x-auto sm:right-4 sm:bottom-4 sm:h-[640px] sm:w-[400px] sm:rounded-xl"
    >
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="font-semibold">포트폴리오에 질문하기</h2>
          <p className="text-xs text-muted-foreground">공개된 글을 근거로 답해요. 대화는 마지막 질문 후 24시간 뒤 삭제됩니다.</p>
        </div>
        <div className="flex">
          <Button variant="ghost" size="icon" onClick={reset} disabled={busy || !messages.length} aria-label="새 대화">
            <RotateCcw />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="채팅 닫기">
            <X />
          </Button>
        </div>
      </header>

      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>경력, 프로젝트, 기술에 대해 물어보세요.</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((q) => (
                <Button key={q} variant="outline" size="sm" onClick={() => ask(q)}>
                  {q}
                </Button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <Message key={m.id} message={m} stage={m.pending ? stage : null} />
        ))}
      </div>

      <form
        className="flex items-end gap-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Textarea
          value={input}
          maxLength={500}
          rows={2}
          placeholder="질문을 입력하세요"
          className="max-h-32 resize-none"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <Button type="submit" size="icon" disabled={busy || !input.trim()} aria-label="보내기">
          <Send />
        </Button>
      </form>
    </section>
  );
}

function Message({ message, stage }: { message: ChatMessage; stage: Stage | null }) {
  if (message.role === "user") {
    return (
      <div className="ml-8 rounded-lg bg-primary px-3 py-2 text-sm whitespace-pre-wrap text-primary-foreground">
        {message.content}
      </div>
    );
  }
  return (
    <div className="mr-4 space-y-2 text-sm">
      {stage && (
        <p className="animate-pulse text-muted-foreground">
          {STAGE_LABEL[stage]}…
          {message.documents?.length ? ` (${message.documents.map((d) => d.title).join(", ")})` : ""}
        </p>
      )}
      {message.content && (
        <div className="prose-md rounded-lg bg-muted px-3 py-2 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>
      )}
      {message.error && <p className="text-destructive">{message.error}</p>}
      {message.sources.length > 0 && <Sources sources={message.sources} />}
      {message.unanswered && (
        <p className="text-xs text-muted-foreground">답하지 못한 질문으로 기록했어요. 내용을 보강하는 데 참고할게요.</p>
      )}
    </div>
  );
}

function Sources({ sources }: { sources: ChatSource[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className="text-muted-foreground">출처</span>
      {sources.map((s) => {
        const className = cn("rounded-md border px-2 py-0.5", s.url && "hover:bg-accent");
        return s.url ? (
          <Link key={`${s.type}:${s.slug}`} href={s.url} className={className}>
            {s.title}
          </Link>
        ) : (
          <span key={`${s.type}:${s.slug}`} className={className}>
            {s.title}
          </span>
        );
      })}
    </div>
  );
}
