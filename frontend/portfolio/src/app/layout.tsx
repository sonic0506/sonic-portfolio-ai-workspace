import type { Metadata } from "next";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ChatProvider } from "@/components/chat/chat-provider";
import { SiteHeader } from "@/components/site/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "개발자 포트폴리오", template: "%s | 개발자 포트폴리오" },
  description: "프로젝트와 기술 기록, 그리고 내용을 근거로 답하는 질문하기",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <ChatProvider>
          <SiteHeader />
          <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">{children}</main>
          <ChatPanel />
        </ChatProvider>
      </body>
    </html>
  );
}
