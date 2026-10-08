import type { NextConfig } from "next";

// 브라우저에서 부르는 /api/*(채팅)는 개발 서버가 백엔드로 넘긴다.
// 서버 컴포넌트의 조회는 API_BASE_URL로 직접 부른다(src/lib/api.ts).
const apiBaseUrl = process.env.API_BASE_URL ?? "http://127.0.0.1:8080";

const nextConfig: NextConfig = {
  // 워크스페이스 패키지는 TS 원본 그대로 가져온다.
  transpilePackages: ["@portfolio/markdown"],
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiBaseUrl}/api/:path*` }];
  },
};

export default nextConfig;
