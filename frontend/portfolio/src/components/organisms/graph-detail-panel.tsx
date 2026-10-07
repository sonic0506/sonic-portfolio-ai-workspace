'use client';

import Link from 'next/link';
import { CornerDownRight, X } from 'lucide-react';

import { NodeMark } from '@/components/atoms/node-mark';
import { Thread, ThreadItem } from '@/components/molecules/thread';
import { Button } from '@/components/ui/button';
import { useAskChat } from '@/hooks/use-ask-chat';
import { formatDate } from '@/lib/blog';
import type { Graph, GraphNode } from '@/lib/graph';
import { GRAPH_TYPE_LABEL, neighborsOfType } from '@/lib/graph';
import { cn, formatMonth } from '@/lib/utils';

type PanelContent = {
  label: string;
  description: string | null;
  meta: string | null;
  chips: string[];
  href: string | null;
  cta: string;
  chatPrompt: string;
};

/** 노드 종류마다 패널에 보일 내용(GRAPH_DESIGN 5절). 스킬·카테고리 정보는 이웃에서 센다. */
function toContent(graph: Graph, node: GraphNode): PanelContent {
  switch (node.type) {
    case 'PROJECT':
      return {
        label: GRAPH_TYPE_LABEL.PROJECT,
        description: node.summary,
        meta: node.periodStart
          ? `${formatMonth(node.periodStart)} – ${node.periodEnd ? formatMonth(node.periodEnd) : '진행 중'}`
          : null,
        chips: neighborsOfType(graph, node.id, 'SKILL').map((s) => s.title),
        href: node.url,
        cta: '프로젝트 열기',
        chatPrompt: `"${node.title}" 프로젝트에 대해 알려줘`,
      };
    case 'BLOG':
      return {
        label: neighborsOfType(graph, node.id, 'CATEGORY')[0]?.title ?? GRAPH_TYPE_LABEL.BLOG,
        description: node.summary,
        meta: node.publishedAt ? formatDate(node.publishedAt) : null,
        chips: (node.tags ?? []).map((t) => `#${t}`),
        href: node.url,
        cta: '글 열기',
        chatPrompt: `"${node.title}" 글을 요약해줘`,
      };
    case 'CATEGORY':
      return {
        label: GRAPH_TYPE_LABEL.CATEGORY,
        description: null,
        meta: `공개 글 ${neighborsOfType(graph, node.id, 'BLOG').length}편`,
        chips: [],
        href: node.url,
        cta: '글 목록 보기',
        chatPrompt: `${node.title} 관련 경험을 알려줘`,
      };
    case 'SKILL':
      return {
        label: GRAPH_TYPE_LABEL.SKILL,
        description: null,
        meta: `${graph.degree[node.id] ?? 0}개 문서에서 사용`,
        chips: [],
        href: null,
        cta: '',
        chatPrompt: `${node.title}을(를) 어디에 썼나요?`,
      };
  }
}

/** 노드를 고르면 우측에서 밀려 들어오는 상세. 그림자 없이 좌측 1px 보더로만 뗀다. */
export function GraphDetailPanel({
  graph,
  node,
  open,
  onClose,
  onNavigate,
}: {
  graph: Graph;
  node: GraphNode | null;
  open: boolean;
  onClose: () => void;
  onNavigate: (id: string) => void;
}) {
  const askChat = useAskChat();
  const content = node ? toContent(graph, node) : null;
  const connected = node ? (graph.neighbors[node.id] ?? []).map((id) => graph.byId[id]).filter(Boolean) : [];

  return (
    <aside
      aria-label="노드 상세"
      aria-hidden={!open}
      inert={!open || undefined}
      className={cn(
        // w-75(300px)는 캔버스의 GRAPH_PANEL_WIDTH와 같은 값이다.
        'absolute top-0 right-0 bottom-0 z-20 w-75 overflow-y-auto border-l border-border bg-surface p-5 transition-transform',
        open ? 'translate-x-0' : 'translate-x-full',
      )}
    >
      {node && content && (
        <>
          <div className="flex items-center gap-2.5">
            <NodeMark type={node.type} color={node.color} />
            <span className="min-w-0 flex-1 truncate font-mono text-2xs text-text-3">{content.label}</span>
            <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="상세 닫기" className="size-7">
              <X strokeWidth={1.5} />
            </Button>
          </div>

          <h2 className="mt-3 text-base leading-[1.4] font-medium tracking-[-0.02em] break-keep">{node.title}</h2>

          {/* 요약이 없으면 이 블록이 없다. 빈 자리를 남기지 않는다. */}
          {content.description && (
            <p className="mt-2.5 font-body text-sm leading-[1.6] break-keep text-text-2">{content.description}</p>
          )}
          {content.meta && <p className="mt-3 font-mono text-2xs text-text-3">{content.meta}</p>}
          {content.chips.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {content.chips.map((chip) => (
                <li key={chip} className="rounded-xs border border-border px-2 py-[3px] font-mono text-2xs tracking-[0.02em] text-text-2">
                  {chip}
                </li>
              ))}
            </ul>
          )}

          {connected.length > 0 && (
            <section className="mt-5 border-t border-border pt-5">
              <h3 className="font-mono text-2xs text-text-3">연결 {connected.length}</h3>
              {/* 시그니처 스레드. 스템을 끊는 마스크는 패널 배경색이어야 한다. */}
              <Thread className="mt-3">
                {connected.map((item) => (
                  <ThreadItem key={item.id} className="last:after:bg-surface">
                    <button
                      type="button"
                      onClick={() => onNavigate(item.id)}
                      className="-mx-2 flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-surface-hi focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <NodeMark type={item.type} color={item.color} />
                      <span className="min-w-0 flex-1 truncate text-sm">{item.title}</span>
                      <span className="shrink-0 font-mono text-[10px] tracking-[0.02em] text-text-3">
                        {GRAPH_TYPE_LABEL[item.type]}
                      </span>
                    </button>
                  </ThreadItem>
                ))}
              </Thread>
            </section>
          )}

          <div className="mt-5 border-t border-border pt-5">
            {/* 악센트 채움은 이 화면에서 이 버튼 하나뿐이다. 스킬은 갈 곳이 없어 없다. */}
            {content.href && (
              <Button asChild className="mb-2.5 w-full">
                <Link href={content.href}>{content.cta}</Link>
              </Button>
            )}
            <button
              type="button"
              onClick={() => askChat(content.chatPrompt)}
              className="flex w-full items-center gap-2.5 rounded-md border border-border px-3 py-2 text-left text-sm text-text-2 transition-colors hover:border-border-hi hover:bg-surface-hi hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <CornerDownRight className="size-3.5 shrink-0 text-text-3" strokeWidth={1.5} />
              <span className="truncate">{content.chatPrompt}</span>
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
