import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { AppShell } from "@/components/templates/app-shell";
import { getCategoriesOrEmpty } from "@/lib/api";
import "./globals.css";

// 사이드바의 카테고리 글 수를 요청마다 읽는다(빌드 시점 값으로 굳지 않게, 404·/chat 포함).
export const dynamic = "force-dynamic";

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
          <AppShell categories={categories}>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
