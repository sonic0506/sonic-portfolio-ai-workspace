/** 사이드바·모바일 상단 막대의 브랜드 표기. */
export const SITE_NAME = "Sonic";

/** 검색엔진·링크 미리보기용 절대 주소의 기준. 로컬 확인이 필요하면 SITE_URL로 덮어쓴다. */
export const SITE_URL = process.env.SITE_URL ?? "https://www.sonic-portfolio.com";

/**
 * 화면별 메타데이터. Next는 openGraph를 부모와 합치지 않고 통째로 바꾸므로(generateMetadata 문서)
 * 레이아웃의 공통 값(사이트 이름·이미지)을 여기서 다시 채운다.
 */
export function pageMetadata({ title, description, path }: { title: string; description?: string; path: string }) {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website" as const,
      siteName: SITE_NAME,
      locale: "ko_KR",
      title: `${title} | ${SITE_NAME}`,
      description,
      url: path,
      images: [{ url: "/icon-512.png", width: 512, height: 512 }],
    },
  };
}
