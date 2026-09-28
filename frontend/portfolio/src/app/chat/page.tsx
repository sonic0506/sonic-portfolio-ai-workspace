import type { Metadata } from "next";
import { ConversationScreen } from "@/components/organisms/conversation-screen";

export const metadata: Metadata = { title: "대화" };

/** 새 대화. 홈·본문에서 넘겨받은 첫 질문을 보내고, 세션이 생기면 주소가 /chat/{id}로 바뀐다. */
export default function NewChatPage() {
  return <ConversationScreen conversationId={null} />;
}
