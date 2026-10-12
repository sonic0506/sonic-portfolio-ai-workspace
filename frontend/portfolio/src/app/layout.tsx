import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { AppShell } from "@/components/templates/app-shell";
import { QueryProvider } from "@/components/providers/query-provider";
import { getCategories } from "@/lib/api";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

// 모든 경로를 ISR로 캐시하고 5분마다 다시 만든다(ADR-0021). 경로 전체의 주기는 가장 짧은 값이 정하므로
// 여기 한 곳에만 둔다. 어드민 수정은 최대 5분 뒤 반영된다(즉시 재검증은 두지 않음).
export const revalidate = 300;

const DESCRIPTION = "프론트엔드 개발자 Sonic의 프로젝트와 기술 기록. 공개된 글을 근거로 답하는 채팅으로 경력과 작업을 물어볼 수 있습니다.";

// 화면별 title·description은 각 page가 덮어쓰고, openGraph는 Next가 부모 값과 합치지 않으므로 상세 화면은 직접 다시 채운다.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} · 개발자 포트폴리오`, template: `%s | ${SITE_NAME}` },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "ko_KR",
    title: `${SITE_NAME} · 개발자 포트폴리오`,
    description: DESCRIPTION,
    images: [{ url: "/icon-512.png", width: 512, height: 512 }],
  },
  twitter: { card: "summary" },
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
