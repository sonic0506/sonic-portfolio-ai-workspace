'use client';

import { FeaturedProjectCard } from '@/components/molecules/featured-project-card';
import { ProjectTimelineItem } from '@/components/molecules/project-timeline-item';
import { Skeleton } from '@/components/ui/skeleton';
import { groupProjectsByYear } from '@/lib/projects';
import { useProjects } from '@/lib/queries';

/**
 * 프로젝트 목록. 제목·질문 칸은 정적 HTML로 바로 보이고, 목록만 브라우저에서 받는다.
 * 다시 들어오면 React Query 캐시를 그대로 그린다(ADR-0021).
 */
export function ProjectsView() {
  const { data, isError } = useProjects();
  const featured = data?.featured ?? [];
  const timeline = groupProjectsByYear(data?.others ?? []);
  const total = data ? data.featured.length + data.others.length : null;

  return (
    <>
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-xl">Projects</h1>
        {/* 총 개수는 데이터라 mono. */}
        {total === null ? (
          !isError && <Skeleton className="h-3 w-5" />
        ) : (
          <span className="font-mono text-2xs text-text-3">{total}</span>
        )}
      </header>

      {isError && <p className="mt-6 font-body text-md text-text-2">프로젝트를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
      {!data && !isError && <ProjectsSkeleton />}
      {total === 0 && <p className="mt-6 font-body text-md text-text-2">공개된 프로젝트가 없습니다.</p>}

      {featured.length > 0 && (
        <section className="mt-10">
          <h2 className="font-mono text-2xs text-text-3">대표 작업</h2>
          <div className="mt-3.5 flex flex-col gap-4">
            {featured.map((project) => (
              <FeaturedProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && timeline.length > 0 && <hr className="my-16 border-t border-border" />}

      {timeline.length > 0 && (
        <section className={featured.length > 0 ? undefined : 'mt-10'}>
          <h2 className="font-mono text-2xs text-text-3">전체 작업</h2>
          <div className="mt-3.5">
            {timeline.map((group, index) => (
              <div
                key={group.year}
                // 그룹 사이만 선으로 나눈다. 첫 그룹 위에는 선을 두지 않는다.
                className={
                  index === 0
                    ? 'flex gap-6 max-sm:flex-col max-sm:gap-0'
                    : 'flex gap-6 border-t border-border max-sm:flex-col max-sm:gap-0'
                }
              >
                {/* 연도도 데이터라 mono. 좁은 화면에서는 항목 위 라벨로 내려온다. */}
                <span className="w-14 shrink-0 pt-5 font-mono text-md text-text-3 max-sm:w-auto max-sm:pb-1">
                  {group.year}
                </span>
                <ol className="min-w-0 flex-1">
                  {group.projects.map((project) => (
                    <ProjectTimelineItem key={project.slug} project={project} />
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/** 대표 카드 2장 + 목록 4줄. 실제 배치와 높이를 비슷하게 맞춰 들어올 때 덜 흔들린다. */
function ProjectsSkeleton() {
  return (
    <div role="status" aria-label="프로젝트 불러오는 중" className="mt-10">
      <Skeleton className="h-3 w-14" />
      <div className="mt-3.5 flex flex-col gap-4">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-44 w-full rounded-lg" />
        ))}
      </div>
      <div className="mt-16 flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
