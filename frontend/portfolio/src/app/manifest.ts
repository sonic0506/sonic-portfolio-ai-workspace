import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/site";

// 모바일 홈 화면 추가용. 탭 아이콘은 같은 폴더의 favicon.ico·apple-icon.png를 Next가 자동으로 연결한다.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} · 개발자 포트폴리오`,
    short_name: SITE_NAME,
    start_url: "/",
    display: "browser",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
