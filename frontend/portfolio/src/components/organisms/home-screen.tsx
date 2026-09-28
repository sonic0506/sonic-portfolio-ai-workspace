'use client';

import { useRef, useState, type ReactNode } from 'react';

import { ChatLottie } from '@/components/atoms/chat-lottie';
import { ChatComposer } from '@/components/molecules/chat-composer';
import { HeroFadeText } from '@/components/molecules/hero-fade-text';
import { ShortcutCards } from '@/components/molecules/shortcut-cards';
import { SuggestionChips } from '@/components/molecules/suggestion-chips';
import { BlogSearchDialog } from '@/components/organisms/blog-search-dialog';
import { useAskChat } from '@/hooks/use-ask-chat';

const SUGGESTIONS = ['어떤 프로젝트를 해왔나요?', '주로 쓰는 기술은 무엇인가요?', '가장 어려웠던 문제는 무엇이었나요?'];

/** 대화 기록 없이 들어온 첫 화면. 프롬프트가 주인공이고 나머지는 그 주변이다. */
export function HomeScreen({
  headline,
  slides,
  projectCount,
  postCount,
}: {
  headline: string;
  slides: ReactNode[][];
  projectCount: number;
  postCount: number;
}) {
  const askChat = useAskChat();
  const [value, setValue] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSelectSuggestion = (suggestion: string) => {
    setValue(suggestion);
    textareaRef.current?.focus();
  };

  return (
    <div className="mx-auto flex min-h-full w-full max-w-content flex-col px-6 pt-6 pb-12 sm:px-8">
      {/* 히어로만 가운데 정렬한다. 나머지 화면은 모두 좌측 정렬이다. */}
      <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
        <ChatLottie className="size-28" />
        <h1 className="mt-4 text-2xl break-keep">{headline}</h1>
        {slides.length > 0 && (
          <HeroFadeText slides={slides} className="mt-4 justify-items-center" textClassName="self-center text-center text-md" />
        )}
      </div>

      <div className="shrink-0">
        <SuggestionChips suggestions={SUGGESTIONS} onSelect={handleSelectSuggestion} className="mb-3" />
        <ChatComposer
          value={value}
          onValueChange={setValue}
          onSubmit={askChat}
          onBlogSearch={() => setSearchOpen(true)}
          textareaRef={textareaRef}
          autoFocus
        />
        <ShortcutCards projectCount={projectCount} postCount={postCount} className="mt-4" />
      </div>

      <BlogSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
