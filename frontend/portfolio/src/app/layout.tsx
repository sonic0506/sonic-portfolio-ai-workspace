import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { AppShell } from "@/components/templates/app-shell";
import { QueryProvider } from "@/components/providers/query-provider";
import { getCategories } from "@/lib/api";
import "./globals.css";

// 모든 경로를 ISR로 캐시하고 5분마다 다시 만든다(ADR-0021). 경로 전체의 주기는 가장 짧은 값이 정하므로
// 여기 한 곳에만 둔다. 어드민 수정은 최대 5분 뒤 반영된다(즉시 재검증은 두지 않음).
export const revalidate = 300;

export const metadata: Metadata = {
  title: { default: "개발자 포트폴리오", template: "%s | 개발자 포트폴리오" },
  description: "프로젝트와 기술 기록, 그리고 내용을 근거로 답하는 질문하기",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const categories = await getCategories();

  return (
    // next-themes가 <html>에 .dark를 붙이므로 서버와 클래스가 달라진다.
    <html lang="ko" suppressHydrationWarning>
      <body className="h-screen w-screen overflow-hidden bg-bg text-text-1">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <AppShell categories={categories}>{children}</AppShell>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
