// 그래프 데이터 모델 (ADR-0015, GRAPH_DESIGN 4절). 서버 응답을 화면이 쓰는 모양으로 바꾼다.

export type GraphNodeType = "PROJECT" | "BLOG" | "CATEGORY" | "SKILL";
export type GraphEdgeKind = "REFERENCE" | "SKILL" | "CATEGORY";

/** GET /api/graph 노드. 종류에 맞지 않는 선택 필드는 null이다. */
export type GraphNode = {
  id: string;
  type: GraphNodeType;
  key: string;
  title: string;
  url: string | null;
  summary: string | null;
  color: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  publishedAt: string | null;
  tags: string[] | null;
};

/** REFERENCE: source가 target을 참고. SKILL: 문서 → 스킬. CATEGORY: 블로그 → 카테고리. */
export type GraphEdge = { source: string; target: string; kind: GraphEdgeKind };

export type GraphApiResponse = { nodes: GraphNode[]; edges: GraphEdge[] };

/** 필터 카드·범례·트리의 순서. */
export const GRAPH_TYPES: GraphNodeType[] = ["PROJECT", "BLOG", "CATEGORY", "SKILL"];

export const GRAPH_TYPE_LABEL: Record<GraphNodeType, string> = {
  PROJECT: "프로젝트",
  BLOG: "블로그",
  CATEGORY: "카테고리",
  SKILL: "스킬",
};


export type Graph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  byId: Record<string, GraphNode>;
  /** 방향과 무관한 이웃. 패널의 "연결"과 hover 강조가 쓴다. */
  neighbors: Record<string, string[]>;
  degree: Record<string, number>;
  maxDegree: number;
  count: Record<GraphNodeType, number>;
};

export function buildGraph({ nodes, edges }: GraphApiResponse): Graph {
  const byId: Record<string, GraphNode> = {};
  for (const node of nodes) byId[node.id] = node;
  // 양끝이 모두 있는 간선만 쓴다(서버가 보장하지만 그리다 깨지지 않게).
  const valid = edges.filter((edge) => byId[edge.source] && byId[edge.target]);

  const neighbors: Record<string, string[]> = {};
  const link = (a: string, b: string) => {
    const list = (neighbors[a] ??= []);
    if (!list.includes(b)) list.push(b);
  };
  for (const edge of valid) {
    link(edge.source, edge.target);
    link(edge.target, edge.source);
  }

  const degree: Record<string, number> = {};
  for (const node of nodes) degree[node.id] = neighbors[node.id]?.length ?? 0;

  const count = { PROJECT: 0, BLOG: 0, CATEGORY: 0, SKILL: 0 };
  for (const node of nodes) count[node.type] += 1;

  return {
    nodes,
    edges: valid,
    byId,
    neighbors,
    degree,
    maxDegree: Math.max(1, ...Object.values(degree)),
    count,
  };
}

/** 이웃 중 한 종류만. 예: 프로젝트의 스킬, 블로그의 카테고리. */
export function neighborsOfType(graph: Graph, id: string, type: GraphNodeType): GraphNode[] {
  return (graph.neighbors[id] ?? []).map((n) => graph.byId[n]).filter((n) => n?.type === type);
}

/** 보이는 노드·간선 수. 숨긴 종류의 노드와 그 노드에 닿는 간선은 뺀다. */
export function visibleCounts(graph: Graph, hidden: Set<GraphNodeType>) {
  const shown = (id: string) => !hidden.has(graph.byId[id].type);
  return {
    nodes: graph.nodes.filter((n) => shown(n.id)).length,
    edges: graph.edges.filter((e) => shown(e.source) && shown(e.target)).length,
  };
}

/**
 * 숨긴 종류를 뺀 그래프. 배치·크기·라벨은 보이는 연결만으로 계산한다.
 * (숨긴 스킬 노드가 시뮬레이션에 남으면 화면이 퍼지고 문서 크기가 스킬 수로 부풀었다.)
 */
export function visibleGraph(graph: Graph, hidden: Set<GraphNodeType>): Graph {
  if (hidden.size === 0) return graph;
  return buildGraph({
    nodes: graph.nodes.filter((n) => !hidden.has(n.type)),
    edges: graph.edges.filter((e) => !hidden.has(graph.byId[e.source].type) && !hidden.has(graph.byId[e.target].type)),
  });
}

/**
 * 화면 상태 ↔ URL 쿼리(ADR-0015 후속). 새로고침·뒤로 가기에도 같은 화면이 나오게 한다.
 * - `node`: 선택한 노드 id, `hide`: 숨긴 종류(소문자, 쉼표), `q`: 검색어. 기본값(전체 보기)은 쓰지 않는다.
 */
export type GraphViewState = { node: string | null; hidden: Set<GraphNodeType>; query: string };

export function parseGraphParams(params: URLSearchParams): GraphViewState {
  const hidden = new Set(
    (params.get("hide") ?? "")
      .split(",")
      .map((v) => v.trim().toUpperCase())
      .filter((v): v is GraphNodeType => (GRAPH_TYPES as string[]).includes(v)),
  );
  return { node: params.get("node") || null, hidden, query: params.get("q") ?? "" };
}

export function toGraphParams({ node, hidden, query }: GraphViewState): string {
  const params = new URLSearchParams();
  if (node) params.set("node", node);
  // 종류 순서를 고정해 같은 상태가 늘 같은 주소가 되게 한다.
  const hide = GRAPH_TYPES.filter((t) => hidden.has(t)).map((t) => t.toLowerCase());
  if (hide.length) params.set("hide", hide.join(","));
  if (query) params.set("q", query);
  return params.toString();
}
