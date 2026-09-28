import Link from 'next/link';

import { StackTags } from '@/components/molecules/stack-tags';
import { projectMeta, projectPath } from '@/lib/projects';
import type { ProjectSummary } from '@/lib/types';
import { cn } from '@/lib/utils';

/** 대표 작업 카드. 카드 전체가 상세로 가는 과녁이다(제목 링크의 ::after가 덮는다). */
export function FeaturedProjectCard({ project, className }: { project: ProjectSummary; className?: string }) {
  const meta = projectMeta(project);
  const highlights = project.highlights ?? [];

  return (
    <article
      className={cn(
        'relative flex gap-6 rounded-lg border border-border bg-surface p-5 transition-colors hover:border-border-hi hover:bg-surface-hi max-md:flex-col',
        className,
      )}
    >
      {/* 썸네일이 없으면 칸을 비워 두지 않고 통째로 뺀다. */}
      {project.thumbnailUrl && (
        <div className="aspect-video w-[min(320px,38%)] shrink-0 self-start overflow-hidden rounded-md border border-border bg-surface-hi max-md:w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={project.thumbnailUrl} alt="" className="size-full object-cover" />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* 기간·역할·기여도는 전부 데이터라 mono 한 줄로 묶는다. */}
        {meta && <p className="font-mono text-2xs text-text-3">{meta}</p>}

        <h3 className="mt-2 line-clamp-2 text-lg leading-[1.3] font-medium tracking-[-0.02em] break-keep">
          <Link
            href={projectPath(project.slug)}
            className="after:absolute after:inset-0 after:rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {project.title}
          </Link>
        </h3>

        <p className="mt-2 font-body text-md break-keep text-text-2">{project.summary}</p>

        {highlights.length > 0 && (
          <ul className="mt-4 flex flex-col gap-1.5">
            {highlights.map((highlight) => (
              <li key={highlight} className="flex gap-2">
                <span aria-hidden="true" className="shrink-0 text-text-3">
                  –
                </span>
                <span className="font-body text-sm leading-[1.55] break-keep text-text-2">{highlight}</span>
              </li>
            ))}
          </ul>
        )}

        <StackTags stack={project.skills.map((s) => s.name)} className="mt-4" />
      </div>
    </article>
  );
}
