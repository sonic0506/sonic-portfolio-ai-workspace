import type { Metadata } from "next";
import { GraphScreen } from "@/components/organisms/graph-screen";
import { getGraph } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "그래프" };

/** 선택·필터·검색은 화면이 URL 쿼리(node, hide, q)에서 직접 읽고 쓴다. */
export default async function GraphPage() {
  return <GraphScreen data={await getGraph()} />;
}
