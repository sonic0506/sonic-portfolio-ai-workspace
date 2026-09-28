import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { StackTags } from '@/components/molecules/stack-tags';
import { projectMeta, projectPath } from '@/lib/projects';
import type { ProjectSummary } from '@/lib/types';

/**
 * 행 전체가 상세로 가는 과녁이다. 링크 중첩을 피하려고 제목 링크만 두고 그
 * 바깥을 ::after로 덮는다. 배경은 좌우 12px씩 넘겨 hover 면이 텍스트보다 넓다.
 */
export function ProjectTimelineItem({ project }: { project: ProjectSummary }) {
  const meta = projectMeta(project);

  return (
    <li className="relative border-t border-border first:border-t-0">
      <div className="-mx-3 flex items-start gap-4 rounded-md px-3 py-5 transition-colors hover:bg-surface-hi">
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="text-base leading-[1.4] font-medium tracking-[-0.02em] break-keep">
            <Link
              href={projectPath(project.slug)}
              className="after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {project.title}
            </Link>
          </h3>
          {meta && <p className="mt-1 font-mono text-2xs text-text-3">{meta}</p>}
          <p className="mt-2 font-body text-sm break-keep text-text-2">{project.summary}</p>
          <StackTags stack={project.skills.map((s) => s.name)} max={4} className="mt-3" />
        </div>
        {/* 상세로 이어진다는 표시. 색 변화 없이 자리만 지킨다. */}
        <ArrowRight className="mt-0.5 size-4 shrink-0 text-text-3" strokeWidth={1.5} aria-hidden="true" />
      </div>
    </li>
  );
}
