import { describe, expect, it } from "vitest";
import { buildGraph, neighborsOfType, visibleCounts, visibleGraph, type GraphNode } from "./graph";

const node = (id: string, type: GraphNode["type"]): GraphNode => ({
  id,
  type,
  key: id.split(":")[1],
  title: id,
  url: null,
  summary: null,
  color: null,
  periodStart: null,
  periodEnd: null,
  publishedAt: null,
  tags: null,
});

const graph = buildGraph({
  nodes: [node("project:a", "PROJECT"), node("blog:b", "BLOG"), node("category:ux", "CATEGORY"), node("skill:react", "SKILL")],
  edges: [
    { source: "project:a", target: "blog:b", kind: "REFERENCE" },
    { source: "blog:b", target: "project:a", kind: "REFERENCE" },
    { source: "blog:b", target: "category:ux", kind: "CATEGORY" },
    { source: "project:a", target: "skill:react", kind: "SKILL" },
    { source: "blog:b", target: "skill:react", kind: "SKILL" },
    { source: "blog:b", target: "blog:missing", kind: "REFERENCE" },
  ],
});

describe("graph", () => {
  it("이웃은 방향과 무관하고 중복이 없으며, 없는 노드로 가는 간선은 버린다", () => {
    expect(graph.edges).toHaveLength(5);
    expect(graph.neighbors["blog:b"]).toEqual(["project:a", "category:ux", "skill:react"]);
    expect(graph.degree["project:a"]).toBe(2);
    expect(graph.maxDegree).toBe(3);
    expect(graph.count).toEqual({ PROJECT: 1, BLOG: 1, CATEGORY: 1, SKILL: 1 });
  });

  it("종류별 이웃과 숨김을 반영한 개수", () => {
    expect(neighborsOfType(graph, "blog:b", "CATEGORY").map((n) => n.id)).toEqual(["category:ux"]);
    expect(visibleCounts(graph, new Set(["SKILL"]))).toEqual({ nodes: 3, edges: 3 });
    expect(visibleCounts(graph, new Set())).toEqual({ nodes: 4, edges: 5 });
  });

  it("숨긴 종류를 빼면 연결 수도 보이는 것만 센다", () => {
    const shown = visibleGraph(graph, new Set(["SKILL"]));
    expect(shown.nodes.map((n) => n.id)).not.toContain("skill:react");
    expect(shown.degree["project:a"]).toBe(1);
    expect(visibleGraph(graph, new Set())).toBe(graph);
  });
});
