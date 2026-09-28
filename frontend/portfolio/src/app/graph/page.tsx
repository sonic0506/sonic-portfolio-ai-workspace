import type { Metadata } from "next";
import { GraphScreen } from "@/components/organisms/graph-screen";
import { getGraph } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "그래프" };

export default async function GraphPage({ searchParams }: PageProps<"/graph">) {
  const { node } = await searchParams;
  const data = await getGraph();
  // 같은 경로에서 ?node=만 바뀌면 선택을 다시 잡도록 key로 다시 마운트한다.
  const initialNodeId = typeof node === "string" ? node : null;
  return <GraphScreen key={initialNodeId ?? "all"} data={data} initialNodeId={initialNodeId} />;
}
