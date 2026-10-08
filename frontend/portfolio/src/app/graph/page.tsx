import type { Metadata } from "next";
import { Suspense } from "react";
import { GraphScreen } from "@/components/organisms/graph-screen";
import { getGraph } from "@/lib/api";

export const metadata: Metadata = { title: "그래프" };

/**
 * 선택·필터·검색은 화면이 URL 쿼리(node, hide, q)에서 직접 읽고 쓴다.
 * 정적 페이지에서 useSearchParams는 가장 가까운 Suspense까지 브라우저에서 그린다.
 */
export default async function GraphPage() {
  const data = await getGraph();
  return (
    <Suspense>
      <GraphScreen data={data} />
    </Suspense>
  );
}
