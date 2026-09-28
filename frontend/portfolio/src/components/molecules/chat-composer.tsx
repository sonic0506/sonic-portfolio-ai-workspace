'use client';

import type { KeyboardEvent, RefObject } from 'react';
import { ArrowUp, Book, Square } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/** 서버 질문 길이 상한(API_DESIGN: 1~500자). */
const MAX_LENGTH = 500;

export interface ChatComposerProps {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (value: string) => void;
  /** 툴바 좌측의 블로그 검색 진입점. 없으면 버튼을 두지 않는다. */
  onBlogSearch?: () => void;
  /** 답변이 진행 중인 상태. 입력을 잠그고 전송 버튼을 중지 버튼으로 바꾼다. */
  busy?: boolean;
  onStop?: () => void;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export function ChatComposer({
  value,
  onValueChange,
  onSubmit,
  onBlogSearch,
  busy = false,
  onStop,
  textareaRef,
  disabled = false,
  autoFocus,
  className,
}: ChatComposerProps) {
  const locked = disabled || busy;
  const canSubmit = !locked && value.trim().length > 0 && value.length <= MAX_LENGTH;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit(value.trim());
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // 한글 조합 중의 Enter는 글자 확정이지 전송이 아니다.
    if (
      event.key !== 'Enter' ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }
    event.preventDefault();
    // 답변을 받는 중이면 연속 전송을 막는다.
    if (locked) return;
    submit();
  };

  return (
    <div
      className={cn(
        // 포커스는 ring이 아니라 보더 색으로 알린다. 레이어는 밝기 차 + 1px 보더로만.
        'flex h-30 flex-col gap-2 rounded-lg border border-border bg-surface p-3 transition-colors focus-within:border-accent',
        className,
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        disabled={locked}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          busy ? '답변을 기다리는 중' : '경력과 프로젝트에 대해 무엇이든 질문'
        }
        aria-label="포트폴리오에 질문하기"
        autoFocus={autoFocus}
        className="min-h-0 w-full flex-1 resize-none border-0 bg-transparent p-0 font-body text-md leading-[1.6] text-text-1 outline-none placeholder:text-text-3 disabled:cursor-not-allowed"
      />

      <div className="flex shrink-0 items-center justify-between gap-3">
        {onBlogSearch ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBlogSearch}
            className="-ml-1"
          >
            <Book strokeWidth={1.5} />
            블로그 검색
          </Button>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2.5">
          {/* 키 힌트·글자 수도 데이터 문자열이라 mono. 좁은 화면에서는 접는다. */}
          {value.length > MAX_LENGTH * 0.8 && (
            <span className={cn('font-mono text-2xs', value.length > MAX_LENGTH ? 'text-danger' : 'text-text-3')}>
              {value.length}/{MAX_LENGTH}
            </span>
          )}
          <span className="font-mono text-2xs text-text-3 max-sm:hidden">
            Enter 전송 · Shift+Enter 줄바꿈
          </span>
          {busy ? (
            <Button
              type="button"
              size="icon-sm"
              onClick={onStop}
              aria-label="생성 중지"
              className="size-7"
            >
              <Square className="size-3" strokeWidth={1.5} />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon-sm"
              onClick={submit}
              disabled={!canSubmit}
              aria-label="질문 보내기"
              // 비활성은 투명도가 아니라 배경·아이콘 색으로 알린다.
              className="size-7 disabled:bg-surface-hi disabled:text-text-3 disabled:opacity-100"
            >
              <ArrowUp className="size-[15px]" strokeWidth={1.5} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
