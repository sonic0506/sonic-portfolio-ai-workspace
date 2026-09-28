"use client";

import { useChat } from "@/components/chat/chat-provider";

/** 질문 하나로 대화를 시작한다. (채팅 화면 교체 전까지는 기존 패널로 보낸다.) */
export function useAskChat() {
  return useChat().ask;
}
