import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ChatProvider } from "@/components/chat/chat-provider";
import { AppShell } from "@/components/templates/app-shell";
import { getCategoriesOrEmpty } from "@/lib/api";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "개발자 포트폴리오", template: "%s | 개발자 포트폴리오" },
  description: "프로젝트와 기술 기록, 그리고 내용을 근거로 답하는 질문하기",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const categories = await getCategoriesOrEmpty();

  return (
    // next-themes가 <html>에 .dark를 붙이므로 서버와 클래스가 달라진다.
    <html lang="ko" suppressHydrationWarning>
      <body className="h-screen w-screen overflow-hidden bg-bg text-text-1">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ChatProvider>
            <AppShell categories={categories}>{children}</AppShell>
            <ChatPanel />
          </ChatProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
