'use client';

import Lottie from 'lottie-react';

import chatLottie from '@/assets/lotties/chat_lottie.json';
import { cn } from '@/lib/utils';

export function ChatLottie({ className }: { className?: string }) {
  return (
    <Lottie
      animationData={chatLottie}
      loop
      autoplay
      aria-hidden
      className={cn('size-40', className)}
    />
  );
}
