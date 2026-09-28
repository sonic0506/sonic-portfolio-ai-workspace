import Link from 'next/link';

import { NodeMark } from '@/components/atoms/node-mark';
import type { Graph, GraphNode } from '@/lib/graph';
import { neighborsOfType } from '@/lib/graph';
import { cn } from '@/lib/utils';

function Row({ node, degree }: { node: GraphNode; degree: number }) {
  const body = (
    <>
      <span className="min-w-0 flex-1 truncate text-sm text-text-2">{node.title}</span>
      {/* 연결 수는 데이터라 mono. */}
      <span className="shrink-0 font-mono text-2xs text-text-3">{degree}</span>
    </>
  );
  const style = 'flex min-h-11 items-center gap-2.5 rounded-md px-2';
  return node.url ? (
    <Link
      href={node.url}
      className={cn(style, 'transition-colors hover:bg-surface-hi focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background')}
    >
      {body}
    </Link>
  ) : (
    <div className={style}>{body}</div>
  );
}

function Section({ title, mark, count, children }: { title: string; mark: React.ReactNode; count: number; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="flex items-center gap-2.5">
        <span className="flex size-2 items-center justify-center">{mark}</span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium">{title}</span>
        <span className="font-mono text-2xs text-text-3">{count}</span>
      </h2>
      <ul className="mt-1 flex flex-col">{children}</ul>
    </section>
  );
}

/**
 * 768px 미만 폴백(ADR-0015 6). 좁은 화면에서 force 그래프는 읽을 수도 만질 수도 없어
 * 프로젝트 → 카테고리별 블로그 → 스킬 목록으로 대신한다. 터치 타깃은 44px.
 */
export function GraphTree({ graph, className }: { graph: Graph; className?: string }) {
  const of = (type: GraphNode['type']) => graph.nodes.filter((n) => n.type === type);
  const degree = (id: string) => graph.degree[id] ?? 0;
  const projects = of('PROJECT');
  const skills = of('SKILL');

  return (
    <div className={cn('px-4 py-6', className)}>
      <h1 className="text-lg">그래프</h1>
      <p className="mt-2 font-body text-sm text-text-2">좁은 화면에서는 연결을 목록으로 폅니다. 숫자는 연결 수입니다.</p>

      <div className="mt-6 flex flex-col gap-6">
        {projects.length > 0 && (
          <Section title="프로젝트" mark={<NodeMark type="PROJECT" />} count={projects.length}>
            {projects.map((node) => (
              <li key={node.id}>
                <Row node={node} degree={degree(node.id)} />
              </li>
            ))}
          </Section>
        )}

        {of('CATEGORY').map((category) => {
          const posts = neighborsOfType(graph, category.id, 'BLOG');
          return (
            <Section key={category.id} title={category.title} mark={<NodeMark type="BLOG" color={category.color} />} count={posts.length}>
              {posts.map((node) => (
                <li key={node.id}>
                  <Row node={node} degree={degree(node.id)} />
                </li>
              ))}
            </Section>
          );
        })}

        {skills.length > 0 && (
          <Section title="스킬" mark={<NodeMark type="SKILL" />} count={skills.length}>
            {[...skills]
              .sort((a, b) => degree(b.id) - degree(a.id))
              .map((node) => (
                <li key={node.id}>
                  <Row node={node} degree={degree(node.id)} />
                </li>
              ))}
          </Section>
        )}
      </div>
    </div>
  );
}
