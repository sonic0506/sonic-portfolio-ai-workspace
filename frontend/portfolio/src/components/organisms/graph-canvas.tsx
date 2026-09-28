'use client';

import type { ComponentType, RefObject } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import type { ForceGraphMethods, ForceGraphProps, NodeObject } from 'react-force-graph-2d';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import type { Graph, GraphNodeType } from '@/lib/graph';
import { visibleGraph } from '@/lib/graph';
import type { GraphData, GraphDatum, LinkDatum } from '@/lib/graph-layout';
import { createGraphData, settleGraphData } from '@/lib/graph-layout';

/** 상세 패널이 덮는 폭. 노드를 가운데로 옮길 때 이만큼 뺀 영역을 기준으로 삼는다. */
export const GRAPH_PANEL_WIDTH = 300;

// 스킬까지 켜면 노드가 두 배라 0.5로는 화면에 다 들어오지 않는다.
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 3;
/** 첫 화면 배율의 상한. 노드가 적으면 캔버스를 다 채우지 못해 라벨이 겹친다. */
const MAX_FIT_ZOOM = 1.6;
/** 라벨은 18자에서 자른다. mono 10px에서 한 글자가 대략 6px이다. */
const LABEL_MAX_CHARS = 18;
/** 첫 배율이 좌측 필터 카드(16px 여백 + 200px)와 라벨이 삐져나오는 몫을 비워 둔다. */
const FILTER_CARD_RESERVE = 16 + 200 + LABEL_MAX_CHARS * 3;
const FIT_MARGIN_RIGHT = 40;
const FIT_MARGIN_Y = 140;

/** 이 배율부터는 라벨을 전부 편다. */
const LABEL_ZOOM = 1.8;
/** 연결이 이만큼 있는 노드는 라벨을 항상 단다. 카테고리는 늘 단다. */
const LABEL_DEGREE = 3;
const LABEL_SIZE = 10;
const LABEL_OFFSET = 7;

/** 140ms 트랜지션에 맞춘 지수 보간 시상수. */
const FADE_TAU = 47;
const FOCUS_DURATION = 420;

/** 참고 간선은 악센트, 스킬·카테고리 간선은 더 옅은 중립색이다(ADR-0015 5). */
const REFERENCE_ALPHA = 0.3;
const MEMBER_ALPHA = 0.14;
const EDGE_DIM_ALPHA = 0.04;
const NODE_DIM_ALPHA = 0.15;
/** 화살촉 길이(화면 px). 옅게 두어 방향만 읽히게 한다. */
const ARROW_SIZE = 5;
const HIT_PADDING = 6;

type GraphNodeDatum = NodeObject<GraphDatum>;

/**
 * 노드·간선의 현재 불투명도. 프레임마다 바뀌지만 렌더와는 무관한 값이라
 * 그래프 데이터에 얹지 않고 여기에 따로 둔다.
 */
const fade = new WeakMap<object, number>();
const NODE_START_ALPHA = 1;
const LINK_START_ALPHA = 0;

function fadeOf(key: object, start: number) {
  return fade.get(key) ?? start;
}

/** 이 라이브러리는 모듈 최상단에서 window를 만져 서버에서 불러올 수 없다. 마운트 뒤에 들여온다. */
type ForceGraphComponent = ComponentType<
  ForceGraphProps<GraphDatum, LinkDatum> & {
    ref?: RefObject<ForceGraphMethods<GraphDatum, LinkDatum> | undefined>;
  }
>;

export interface GraphCanvasProps {
  graph: Graph;
  query: string;
  /** 토글로 꺼진 종류. 그 노드와 닿는 간선은 사라진다. */
  hidden: Set<GraphNodeType>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** 특정 노드로 옮겨 달라는 요청. 같은 노드를 다시 눌러도 움직이도록 token으로 구분한다. */
  focus: { id: string; token: number } | null;
  panelOpen: boolean;
}

function truncate(label: string) {
  return label.length > LABEL_MAX_CHARS ? `${label.slice(0, LABEL_MAX_CHARS)}…` : label;
}

function labelFont(globalScale: number) {
  return `${LABEL_SIZE / globalScale}px "JetBrains Mono", ui-monospace, SFMono-Regular, monospace`;
}

type Colors = { accent: string; label: string; neutral: string; fallback: string; bg: string };

/** 캔버스는 Tailwind 클래스를 쓸 수 없으므로 테마 토큰을 CSS 변수에서 읽는다. */
function readColors(): Colors {
  const style = getComputedStyle(document.documentElement);
  const token = (name: string) => style.getPropertyValue(name).trim();
  return {
    accent: token('--s-accent'),
    label: token('--s-text-3'),
    neutral: token('--s-text-2'),
    fallback: token('--s-cat-default'),
    bg: token('--s-bg'),
  };
}

/**
 * react-force-graph-2d로 그리는 콘텐츠 그래프. 시뮬레이션·줌·팬·드래그·피킹은
 * 라이브러리가 맡고, 노드와 간선의 생김새는 캔버스 콜백에서 직접 그린다.
 */
export function GraphCanvas({ graph, query, hidden, selectedId, onSelect, focus, panelOpen }: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraphMethods<GraphDatum, LinkDatum> | undefined>(undefined);

  const [ForceGraph2D, setForceGraph2D] = useState<ForceGraphComponent | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const reduceMotion = useReducedMotion();
  const { resolvedTheme } = useTheme();

  /*
   * 라이브러리가 이 객체들에 좌표를 직접 써넣으므로 한 번 만들어 계속 쓴다.
   * 보이는 종류만으로 배치한다. 종류를 켜고 끄면 다시 배치한다(ADR-0015 3).
   * 배치는 그리기 전에 끝내고 노드를 고정한다. 애니메이션으로 자리 잡은 뒤에 화면을
   * 맞추면 "한 번 그리고 다시 정렬하는" 점프가 보였다(2026-09-29 측정: 1초 뒤 배율 1 → 0.39).
   */
  const hiddenKey = [...hidden].sort().join(',');
  const data: GraphData = useMemo(() => {
    const built = createGraphData(visibleGraph(graph, new Set(hiddenKey.split(',').filter(Boolean) as GraphNodeType[])));
    settleGraphData(built);
    return built;
  }, [graph, hiddenKey]);

  const propsRef = useRef({ query, hidden, selectedId, onSelect, panelOpen });
  const hoverRef = useRef<string | null>(null);
  const lastFrameRef = useRef(0);
  const focusTokenRef = useRef(0);
  /** 첫 배율을 잡기 전에 들어온 포커스 요청. 첫 맞춤과 함께 곧바로 처리한다. */
  const pendingFocusRef = useRef<string | null>(null);
  const fittedRef = useRef(false);
  const userMovedRef = useRef(false);
  const colorsRef = useRef<Colors>({ accent: '#3f6fd9', label: '#8b8b94', neutral: '#52525b', fallback: '#8b8b94', bg: '#fff' });

  // 새로 배치하면 첫 화면 맞춤도 다시 한다.
  useEffect(() => {
    fittedRef.current = false;
    userMovedRef.current = false;
  }, [data]);

  // 프레임 콜백이 최신 props를 읽되, props가 바뀌었다고 캔버스를 다시 만들지는 않는다.
  useEffect(() => {
    propsRef.current = { query, hidden, selectedId, onSelect, panelOpen };
  });

  // 테마가 바뀌면 토큰 색을 다시 읽는다(다음 프레임부터 반영).
  useEffect(() => {
    colorsRef.current = readColors();
  }, [resolvedTheme]);

  useEffect(() => {
    let alive = true;
    import('react-force-graph-2d').then((module) => {
      if (alive) setForceGraph2D(() => module.default as unknown as ForceGraphComponent);
    });
    return () => {
      alive = false;
    };
  }, []);

  // 라이브러리는 캔버스 크기를 직접 재지 않는다. 컨테이너를 재서 넘긴다.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  /** 그래프 전체를 필터 카드 오른쪽 영역에 맞춰 앉힌다. */
  const fitView = useCallback(() => {
    const instance = graphRef.current;
    const container = containerRef.current;
    if (!instance || !container) return;
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    const bbox = instance.getGraphBbox();
    if (!bbox) return;

    const graphWidth = Math.max(bbox.x[1] - bbox.x[0], 1);
    const graphHeight = Math.max(bbox.y[1] - bbox.y[0], 1);
    const reserved = Math.min(FILTER_CARD_RESERVE, width * 0.34);
    const available = Math.max(width - reserved - FIT_MARGIN_RIGHT, 1);
    const zoom = Math.min(
      MAX_FIT_ZOOM,
      Math.max(MIN_ZOOM, Math.min(available / graphWidth, (height - FIT_MARGIN_Y) / graphHeight)),
    );

    instance.zoom(zoom, 0);
    // 화면 중앙이 아니라 필터 카드 오른쪽 영역의 한가운데에 놓는다.
    const offset = (reserved + available / 2 - width / 2) / zoom;
    instance.centerAt((bbox.x[0] + bbox.x[1]) / 2 - offset, (bbox.y[0] + bbox.y[1]) / 2, 0);
  }, []);


  // 사용자가 줌·팬·드래그를 시작하면 그 뒤로는 시야에 손대지 않는다.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const markMoved = () => {
      userMovedRef.current = true;
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.buttons !== 0) markMoved();
    };
    container.addEventListener('wheel', markMoved, { passive: true });
    container.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => {
      container.removeEventListener('wheel', markMoved);
      container.removeEventListener('pointermove', onPointerMove);
    };
  }, []);

  // 리사이즈: 아직 손대지 않은 시야라면 다시 화면에 맞춘다.
  useEffect(() => {
    if (!fittedRef.current || userMovedRef.current || !size.width) return;
    fitView();
  }, [size, fitView]);

  /** 노드를 패널이 덮지 않는 영역의 한가운데로 옮긴다. instant면 애니메이션 없이 옮긴다. */
  const focusNode = useCallback(
    (id: string, instant = false) => {
      const instance = graphRef.current;
      const node = data.nodes.find((item) => item.id === id);
      if (!instance || !node) return;
      const zoom = instance.zoom();
      const offset = propsRef.current.panelOpen ? GRAPH_PANEL_WIDTH / 2 / zoom : 0;
      userMovedRef.current = true;
      instance.centerAt(node.x + offset, node.y, instant || reduceMotion ? 0 : FOCUS_DURATION);
    },
    [data, reduceMotion],
  );

  useEffect(() => {
    if (!focus || focus.token === focusTokenRef.current) return;
    focusTokenRef.current = focus.token;
    // 첫 맞춤 전이면 그때 함께 옮긴다(처음부터 그 노드 자리에서 시작한다).
    if (!fittedRef.current) {
      pendingFocusRef.current = focus.id;
      return;
    }
    focusNode(focus.id);
  }, [focus, focusNode]);

  /** 프레임마다 목표 불투명도로 한 걸음씩 옮긴다. 그리는 콜백은 계산된 값을 읽기만 한다. */
  const advanceFade = useCallback(() => {
    const now = performance.now();
    const dt = Math.min(now - lastFrameRef.current, 64);
    lastFrameRef.current = now;

    const { query: search, hidden: hiddenTypes } = propsRef.current;
    const needle = search.trim().toLowerCase();
    const hoverId = hoverRef.current;
    const highlight = hoverId ? new Set([hoverId, ...(graph.neighbors[hoverId] ?? [])]) : null; // 전체 그래프 기준 이웃
    const blend = reduceMotion ? 1 : 1 - Math.exp(-dt / FADE_TAU);
    const matches = (node: GraphDatum) => !needle || node.title.toLowerCase().includes(needle);

    for (const node of data.nodes) {
      let target = 1;
      if (hiddenTypes.has(node.type)) target = 0;
      else if (!matches(node)) target = NODE_DIM_ALPHA;
      else if (highlight && !highlight.has(node.id)) target = NODE_DIM_ALPHA;
      const current = fadeOf(node, NODE_START_ALPHA);
      fade.set(node, current + (target - current) * blend);
    }

    for (const link of data.links) {
      const source = link.source as GraphDatum;
      const target = link.target as GraphDatum;
      // 초기화 전에는 양끝이 아직 id 문자열이다.
      if (typeof source !== 'object' || typeof target !== 'object') continue;
      let next = link.kind === 'REFERENCE' ? REFERENCE_ALPHA : MEMBER_ALPHA;
      if (hiddenTypes.has(source.type) || hiddenTypes.has(target.type)) next = 0;
      else if (highlight && !(highlight.has(source.id) && highlight.has(target.id))) next = EDGE_DIM_ALPHA;
      else if (!matches(source) || !matches(target)) next = EDGE_DIM_ALPHA;
      const current = fadeOf(link, LINK_START_ALPHA);
      fade.set(link, current + (next - current) * blend);
    }
  }, [data, graph, reduceMotion]);

  const paintNode = useCallback((node: GraphNodeDatum, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const alpha = fadeOf(node, NODE_START_ALPHA);
    if (alpha <= 0.005) return;
    const colors = colorsRef.current;
    const r = node.radius;
    ctx.globalAlpha = alpha;
    ctx.beginPath();

    switch (node.type) {
      case 'PROJECT': {
        // 악센트 둥근 사각형. 모서리는 한 변의 0.35배, 최대 6px.
        const side = r * 2;
        ctx.roundRect(node.x - r, node.y - r, side, side, Math.min(side * 0.35, 6 / globalScale));
        ctx.fillStyle = colors.accent;
        ctx.fill();
        break;
      }
      case 'BLOG':
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = node.color ?? colors.fallback;
        ctx.fill();
        break;
      case 'CATEGORY':
        // 카테고리 색 테두리만 있는 큰 원. 속은 배경색으로 비워 블로그 점과 구분한다.
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = colors.bg;
        ctx.fill();
        ctx.lineWidth = Math.max(2 / globalScale, r * 0.3);
        ctx.strokeStyle = node.color ?? colors.fallback;
        ctx.stroke();
        break;
      case 'SKILL':
        // 작은 중립색 마름모.
        ctx.moveTo(node.x, node.y - r);
        ctx.lineTo(node.x + r, node.y);
        ctx.lineTo(node.x, node.y + r);
        ctx.lineTo(node.x - r, node.y);
        ctx.closePath();
        ctx.fillStyle = colors.neutral;
        ctx.fill();
        break;
    }

    if (node.id === propsRef.current.selectedId) {
      // 선택 링은 2px, 반지름 + 4px. 배율과 무관하게 같은 두께로 보여야 한다.
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 2 / globalScale;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 4 / globalScale, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, []);

  /** 라벨은 노드를 다 그린 뒤에 얹어야 뒤 노드에 가리지 않는다. */
  const paintLabels = useCallback(
    (ctx: CanvasRenderingContext2D, globalScale: number) => {
      ctx.font = labelFont(globalScale);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0.02em';
      ctx.fillStyle = colorsRef.current.label;

      for (const node of data.nodes) {
        const alpha = fadeOf(node, NODE_START_ALPHA);
        if (alpha <= 0.005) continue;
        const show =
          node.type === 'CATEGORY' ||
          node.degree >= LABEL_DEGREE ||
          node.id === hoverRef.current ||
          node.id === propsRef.current.selectedId ||
          globalScale >= LABEL_ZOOM;
        if (!show) continue;
        ctx.globalAlpha = alpha;
        ctx.fillText(truncate(node.title), node.x, node.y - node.radius - LABEL_OFFSET / globalScale);
      }
      ctx.globalAlpha = 1;
    },
    [data],
  );

  const paintNodePointerArea = useCallback(
    (node: GraphNodeDatum, color: string, ctx: CanvasRenderingContext2D, globalScale: number) => {
      // 꺼진 종류의 노드는 보이지 않으니 집히지도 않아야 한다.
      if (propsRef.current.hidden.has(node.type)) return;
      const radius = node.radius + HIT_PADDING / globalScale;
      ctx.fillStyle = color;
      ctx.beginPath();
      if (node.type === 'PROJECT') ctx.rect(node.x - radius, node.y - radius, radius * 2, radius * 2);
      else ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fill();
    },
    [],
  );

  const paintLink = useCallback((link: LinkDatum, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const alpha = fadeOf(link, LINK_START_ALPHA);
    if (alpha <= 0.005) return;
    const source = link.source as GraphDatum;
    const target = link.target as GraphDatum;
    if (typeof source !== 'object' || typeof target !== 'object') return;

    const colors = colorsRef.current;
    const reference = link.kind === 'REFERENCE';
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const distance = Math.hypot(dx, dy) || 1;
    // 참고 간선만 살짝 휜다. 서로 참고하는 두 간선이 겹치지 않고, 직선인 소속 간선과도 구분된다.
    const bend = reference ? distance * 0.08 : 0;
    const cx = (source.x + target.x) / 2 - (dy / distance) * bend;
    const cy = (source.y + target.y) / 2 + (dx / distance) * bend;

    ctx.globalAlpha = alpha;
    ctx.strokeStyle = reference ? colors.accent : colors.neutral;
    ctx.lineWidth = 1 / globalScale;
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.quadraticCurveTo(cx, cy, target.x, target.y);
    ctx.stroke();

    if (reference) {
      // 방향 화살표: 끝점에서의 접선(제어점 → 끝점) 방향으로, 대상 노드 가장자리에 촉을 둔다.
      const tx = target.x - cx;
      const ty = target.y - cy;
      const tl = Math.hypot(tx, ty) || 1;
      const ux = tx / tl;
      const uy = ty / tl;
      const tipX = target.x - ux * (target.radius + 1 / globalScale);
      const tipY = target.y - uy * (target.radius + 1 / globalScale);
      const size = ARROW_SIZE / globalScale;
      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(tipX - ux * size - uy * size * 0.5, tipY - uy * size + ux * size * 0.5);
      ctx.lineTo(tipX - ux * size + uy * size * 0.5, tipY - uy * size - ux * size * 0.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, []);

  /** 첫 화면 맞춤. 딥링크로 들어왔으면 곧바로 그 노드로 옮긴다(애니메이션 없음). */
  const fitOnce = useCallback(() => {
    if (fittedRef.current || !graphRef.current) return;
    fittedRef.current = true;
    fitView();
    const pending = pendingFocusRef.current;
    if (pending) {
      pendingFocusRef.current = null;
      focusNode(pending, true);
    }
  }, [fitView, focusNode]);

  // 캔버스가 붙거나 새로 배치하면 곧바로 맞춘다. 좌표는 이미 정해져 있다.
  useEffect(() => {
    if (ForceGraph2D && size.width) fitOnce();
  }, [ForceGraph2D, size.width, data, fitOnce]);

  const handleNodeHover = useCallback((node: GraphNodeDatum | null) => {
    hoverRef.current = node?.id ?? null;
  }, []);
  const handleNodeClick = useCallback((node: GraphNodeDatum) => propsRef.current.onSelect(node.id), []);
  const handleBackgroundClick = useCallback(() => propsRef.current.onSelect(null), []);
  const handleNodeDragEnd = useCallback((node: GraphNodeDatum) => {
    // 라이브러리는 드래그가 끝나면 고정을 푼다. 놓은 자리에 그대로 두려면 다시 박는다.
    node.fx = node.x;
    node.fy = node.y;
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0">
      {ForceGraph2D && size.width > 0 && (
        <ForceGraph2D
          ref={graphRef}
          graphData={data}
          width={size.width}
          height={size.height}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          // 페이드가 프레임마다 진행되므로 쉬는 프레임을 두면 안 된다.
          autoPauseRedraw={false}
          // 배치는 미리 끝냈다. 라이브러리 시뮬레이션은 돌리지 않는다.
          cooldownTicks={0}
          // 첫 프레임 전에 맞춤이 끝나지 않았다면 여기서 한 번 더 시도한다.
          onEngineStop={fitOnce}
          onRenderFramePre={advanceFade}
          onRenderFramePost={paintLabels}
          nodeCanvasObjectMode={() => 'replace'}
          nodeCanvasObject={paintNode}
          nodePointerAreaPaint={paintNodePointerArea}
          linkCanvasObjectMode={() => 'replace'}
          linkCanvasObject={paintLink}
          // 간선은 집을 일이 없다. 피킹 캔버스에 그리지 않아 계산을 아낀다.
          linkPointerAreaPaint={() => {}}
          onNodeHover={handleNodeHover}
          onNodeClick={handleNodeClick}
          onNodeDragEnd={handleNodeDragEnd}
          onBackgroundClick={handleBackgroundClick}
        />
      )}
    </div>
  );
}
