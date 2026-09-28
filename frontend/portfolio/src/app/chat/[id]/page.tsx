import type { Metadata } from "next";
import { ConversationScreen } from "@/components/organisms/conversation-screen";

// 대화 제목은 브라우저 저장소에만 있어 서버가 알 수 없다.
export const metadata: Metadata = { title: "대화" };

export default async function ConversationPage({ params }: PageProps<"/chat/[id]">) {
  const { id } = await params;
  return <ConversationScreen key={id} conversationId={id} />;
}
