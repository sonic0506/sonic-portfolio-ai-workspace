import { forceLink, forceManyBody, forceSimulation, forceX, forceY } from 'd3-force';

import type { Graph, GraphEdgeKind, GraphNode } from '@/lib/graph';
import { GRAPH_TYPES } from '@/lib/graph';

/**
 * react-force-graph에 넘기는 노드. 라이브러리가 x·y·vx·vy와 인덱스를 이 객체에
 * 직접 써넣으므로, 서버 데이터를 그대로 넘기지 않고 매번 새로 만든다.
 */
export interface GraphDatum extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 값이 있으면 시뮬레이션이 이 노드를 움직이지 않는다. 드래그가 여기에 쓴다. */
  fx?: number;
  fy?: number;
  radius: number;
  degree: number;
  /** 중심 인력 계산용. 연결 수 / 최대 연결 수. */
  weight: number;
}

export interface LinkDatum {
  /** 초기화 전에는 노드 id이고, 라이브러리가 붙으면 노드 객체로 바뀐다. */
  source: string | GraphDatum;
  target: string | GraphDatum;
  kind: GraphEdgeKind;
}

export interface GraphData {
  nodes: GraphDatum[];
  links: LinkDatum[];
}

/** 지름 6px + 비율 × 12px. 스킬은 한 단계 작게, 카테고리는 한 단계 크게 그린다. */
export function nodeRadius(node: GraphNode, weight: number) {
  const base = (6 + weight * 12) / 2;
  if (node.type === 'SKILL') return base * 0.8;
  if (node.type === 'CATEGORY') return base + 2;
  return base;
}

// ── 힘 설정 (sonic 측정값 유지) ─────────────────────────────────────
export const LINK_DISTANCE = 85;
export const CHARGE_STRENGTH = -500;
const CENTER_STRENGTH = 0.06;
/** 캔버스가 가로로 길어 세로 인력에만 더 준다. */
export const CENTER_ASPECT = 1.8;
export const VELOCITY_DECAY = 0.35;
/** 시간이 아니라 틱으로 끊어야 프레임이 밀려도 같은 배치가 나온다. 60fps에서 약 2초. */
export const SIM_TICKS = 120;
export const ALPHA_MIN = 0.001;
export const ALPHA_DECAY = 1 - Math.pow(ALPHA_MIN, 1 / SIM_TICKS);
const STATIC_TICKS = 240;

export function centerStrength(node: GraphDatum) {
  return CENTER_STRENGTH * (0.4 + node.weight * 1.6);
}

/** 시드 고정 난수. 새로고침해도 같은 배치가 나와야 한다. */
function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LAYOUT_SEED = 20250811;

/**
 * 그래프 데이터 한 벌. 시작 좌표는 노드 종류마다 각도 구간을 나눠 흩어 두어
 * 짧은 시뮬레이션으로도 덩어리가 알아볼 만한 모양으로 자리 잡게 한다.
 */
export function createGraphData(graph: Graph): GraphData {
  const random = seededRandom(LAYOUT_SEED);
  const sectors = GRAPH_TYPES.length;

  const nodes: GraphDatum[] = graph.nodes.map((node) => {
    const sector = GRAPH_TYPES.indexOf(node.type);
    const degree = graph.degree[node.id] ?? 0;
    const weight = degree / graph.maxDegree;
    // 연결이 많은 노드일수록 안쪽에서 시작한다.
    const radial = 120 + (1 - weight) * 130 + random() * 60;
    const angle = ((sector + 0.15 + random() * 0.7) / sectors) * Math.PI * 2 - Math.PI / 2;
    return {
      ...node,
      x: Math.cos(angle) * radial,
      y: Math.sin(angle) * radial,
      vx: 0,
      vy: 0,
      radius: nodeRadius(node, weight),
      degree,
      weight,
    };
  });

  const links: LinkDatum[] = graph.edges.map((edge) => ({ source: edge.source, target: edge.target, kind: edge.kind }));
  return { nodes, links };
}

/**
 * reduced-motion 경로. 애니메이션 없이 같은 힘으로 미리 돌려 자리를 잡고 고정한다.
 * forceLink가 간선 양끝을 노드 참조로 바꿔 쓰므로 복사본으로 돌린다.
 */
export function settleGraphData(data: GraphData) {
  const links = data.links.map((link) => ({ source: link.source, target: link.target }));
  forceSimulation(data.nodes)
    .randomSource(seededRandom(LAYOUT_SEED))
    .force('charge', forceManyBody<GraphDatum>().strength(CHARGE_STRENGTH))
    .force(
      'link',
      forceLink<GraphDatum, (typeof links)[number]>(links)
        .id((node) => node.id)
        .distance(LINK_DISTANCE),
    )
    .force('x', forceX<GraphDatum>(0).strength(centerStrength))
    .force('y', forceY<GraphDatum>(0).strength((node) => centerStrength(node) * CENTER_ASPECT))
    .velocityDecay(VELOCITY_DECAY)
    .stop()
    .tick(STATIC_TICKS);

  for (const node of data.nodes) {
    node.fx = node.x;
    node.fy = node.y;
  }
}
