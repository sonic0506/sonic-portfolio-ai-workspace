'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { NodeMark } from '@/components/atoms/node-mark';
import { GraphFilterCard } from '@/components/molecules/graph-filter-card';
import { GraphTree } from '@/components/molecules/graph-tree';
import { GraphCanvas } from '@/components/organisms/graph-canvas';
import { GraphDetailPanel } from '@/components/organisms/graph-detail-panel';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Graph, GraphApiResponse, GraphNode, GraphNodeType } from '@/lib/graph';
import { GRAPH_TYPES, buildGraph, parseGraphParams, toGraphParams, visibleCounts } from '@/lib/graph';

/** URL 쿼리 → 화면 상태. 없는 노드는 버리고, 선택한 노드의 종류가 숨겨져 있으면 그 종류를 켠다. */
function viewFromParams(graph: Graph, params: URLSearchParams) {
  const view = parseGraphParams(params);
  const node = view.node ? (graph.byId[view.node] ?? null) : null;
  if (node) view.hidden.delete(node.type);
  return { node, hidden: view.hidden, query: view.query };
}

/**
 * 그래프 화면 전체. 필터·검색·선택 상태를 여기서 들고, 캔버스는 그리기와 입력만 맡는다.
 * 상태는 URL 쿼리(`node`, `hide`, `q`)와 맞춘다. 기록을 쌓지 않고 현재 기록만 바꾸므로
 * 새로고침하거나 다른 화면에 갔다가 뒤로 와도 같은 선택이 남는다.
 */
export function GraphScreen({ data }: { data: GraphApiResponse }) {
  const graph = useMemo(() => buildGraph(data), [data]);
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const [initial] = useState(() => viewFromParams(graph, searchParams));

  const [query, setQuery] = useState(initial.query);
  const [hidden, setHidden] = useState<Set<GraphNodeType>>(initial.hidden);
  const [selectedId, setSelectedId] = useState<string | null>(initial.node?.id ?? null);
  // 패널이 닫히는 140ms 동안에도 내용이 남아 있어야 해서 선택과 따로 들고 있는다.
  const [panelNode, setPanelNode] = useState<GraphNode | null>(initial.node);
  const [focus, setFocus] = useState<{ id: string; token: number } | null>(
    initial.node ? { id: initial.node.id, token: 1 } : null,
  );

  // 화면 상태 → URL. 마지막으로 쓴 값을 기억해 두고, 그와 다른 쿼리가 들어오면 바깥에서 온 이동이다.
  const writtenRef = useRef(searchParams.toString());
  useEffect(() => {
    const next = toGraphParams({ node: selectedId, hidden, query });
    if (next === writtenRef.current) return;
    writtenRef.current = next;
    window.history.replaceState(window.history.state, '', next ? `/graph?${next}` : '/graph');
  }, [selectedId, hidden, query]);

  // URL → 화면 상태. 그래프 화면에 있는 채로 사이드바·딥링크로 다른 쿼리가 오면 그 상태로 바꾼다.
  const incoming = searchParams.toString();
  useEffect(() => {
    if (incoming === writtenRef.current) return;
    writtenRef.current = incoming;
    const view = viewFromParams(graph, new URLSearchParams(incoming));
    /* eslint-disable react-hooks/set-state-in-effect -- 외부(URL) 변경을 상태로 옮기는 동기화다. */
    setQuery(view.query);
    setHidden(view.hidden);
    setSelectedId(view.node?.id ?? null);
    if (view.node) {
      setPanelNode(view.node);
      setFocus((previous) => ({ id: view.node!.id, token: (previous?.token ?? 0) + 1 }));
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [incoming, graph]);

  const select = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      if (id) setPanelNode(graph.byId[id] ?? null);
    },
    [graph],
  );

  const allHidden = hidden.size === GRAPH_TYPES.length;
  const counts = useMemo(() => visibleCounts(graph, hidden), [graph, hidden]);

  const toggleType = useCallback(
    (type: GraphNodeType) => {
      setHidden((previous) => {
        const next = new Set(previous);
        if (next.has(type)) next.delete(type);
        else next.add(type);
        return next;
      });
      // 방금 끈 종류의 노드를 보고 있었다면 패널도 함께 닫는다.
      setSelectedId((previous) => (previous && graph.byId[previous]?.type === type ? null : previous));
    },
    [graph],
  );

  const reset = useCallback(() => {
    setHidden(new Set());
    setQuery('');
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId]);

  const navigateTo = useCallback(
    (id: string) => {
      // 패널의 연결 목록에서 숨긴 종류(예: 스킬)를 누르면 그 종류를 켠다.
      const type = graph.byId[id]?.type;
      if (type) setHidden((previous) => (previous.has(type) ? new Set([...previous].filter((t) => t !== type)) : previous));
      select(id);
      setFocus((previous) => ({ id, token: (previous?.token ?? 0) + 1 }));
    },
    [graph, select],
  );

  // 768px 미만에서는 그래프 대신 목록을 편다.
  if (isMobile) return <GraphTree graph={graph} />;

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden">
      <GraphCanvas
        graph={graph}
        query={query}
        hidden={hidden}
        selectedId={selectedId}
        onSelect={select}
        focus={focus}
        panelOpen={Boolean(selectedId)}
      />

      <GraphFilterCard
        query={query}
        onQueryChange={setQuery}
        hidden={hidden}
        counts={graph.count}
        onToggle={toggleType}
        onReset={reset}
        className="absolute top-4 left-4 z-10"
      />

      {/* 통계·범례·힌트는 데이터라 mono. 클릭을 가로채지 않는다. */}
      <p className="pointer-events-none absolute top-5 right-5 font-mono text-2xs text-text-3">
        {counts.nodes} nodes · {counts.edges} edges
      </p>

      <div className="pointer-events-none absolute bottom-5 left-5 flex flex-col gap-1 font-mono text-2xs text-text-3">
        <span className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <NodeMark type="PROJECT" />
            프로젝트
          </span>
          <span className="flex items-center gap-2">
            <NodeMark type="BLOG" />
            블로그
          </span>
          <span className="flex items-center gap-2">
            <NodeMark type="CATEGORY" />
            카테고리
          </span>
          <span className="flex items-center gap-2">
            <NodeMark type="SKILL" />
            스킬
          </span>
        </span>
        <span>크기 = 연결 수 · 화살표 = 참고 방향</span>
      </div>

      <p
        className={`pointer-events-none absolute right-5 bottom-5 font-mono text-2xs text-text-3 transition-opacity ${
          selectedId ? 'opacity-0' : 'opacity-100'
        }`}
      >
        노드를 선택하면 정보가 표시됩니다
      </p>

      {/* 종류를 전부 끄면 캔버스가 비므로 다음 행동만 남긴다. */}
      {allHidden && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3">
          <p className="text-sm text-text-3">표시할 노드가 없습니다</p>
          <Button variant="outline" size="sm" onClick={reset}>
            전체 보기
          </Button>
        </div>
      )}

      <GraphDetailPanel
        graph={graph}
        node={panelNode}
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        onNavigate={navigateTo}
      />
    </div>
  );
}
