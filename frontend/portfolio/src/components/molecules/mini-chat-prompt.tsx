'use client';

import type { FormEvent, KeyboardEvent } from 'react';
import { useState } from 'react';
import { ArrowUp } from 'lucide-react';

import { useAskChat } from '@/hooks/use-ask-chat';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface MiniChatPromptProps {
  /** 입력 바 위 안내 한 줄. */
  label: string;
  placeholder: string;
  /** 아래 캡션. 어디서 답을 찾는지 적는다. */
  caption: string;
  className?: string;
}

/**
 * 페이지 끝에 놓는 축소판 컴포저. 한 줄만 받고, 보내면 그 문장을 첫 메시지로
 * 새 대화를 연다.
 */
export function MiniChatPrompt({
  label,
  placeholder,
  caption,
  className,
}: MiniChatPromptProps) {
  const askChat = useAskChat();
  const [value, setValue] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const question = value.trim();
    if (!question) return;
    askChat(question);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // 한글 조합 중의 Enter는 글자 확정이지 전송이 아니다. 폼이 먼저 넘어가지 않게 막는다.
    if (event.key === 'Enter' && event.nativeEvent.isComposing) {
      event.preventDefault();
    }
  };

  return (
    <section className={cn('flex flex-col', className)}>
      <p className="font-body text-md text-text-2">{label}</p>

      {/* 포커스는 ring이 아니라 보더 색으로 알린다. */}
      <form
        onSubmit={handleSubmit}
        className="mt-3 flex h-12 items-center gap-2 rounded-lg border border-border bg-surface pr-1.5 pl-3.5 transition-colors focus-within:border-border-hi"
      >
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={label}
          className="min-w-0 flex-1 border-0 bg-transparent font-body text-md text-text-1 outline-none placeholder:text-text-3"
        />
        <Button
          type="submit"
          size="icon-lg"
          disabled={value.trim().length === 0}
          aria-label="질문 보내기"
          // 비활성은 투명도가 아니라 배경·아이콘 색으로 알린다.
          className="disabled:bg-surface-hi disabled:text-text-3 disabled:opacity-100"
        >
          <ArrowUp className="size-4" strokeWidth={1.5} />
        </Button>
      </form>

      <p className="mt-2.5 font-mono text-2xs text-text-3">{caption}</p>
    </section>
  );
}
