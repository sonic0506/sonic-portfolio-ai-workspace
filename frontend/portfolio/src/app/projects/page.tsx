import type { Metadata } from "next";
import { FeaturedProjectCard } from "@/components/molecules/featured-project-card";
import { MiniChatPrompt } from "@/components/molecules/mini-chat-prompt";
import { ProjectTimelineItem } from "@/components/molecules/project-timeline-item";
import { getProjects } from "@/lib/api";
import { groupProjectsByYear } from "@/lib/projects";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "프로젝트" };

export default async function ProjectsPage() {
  const { featured, others } = await getProjects();
  const timeline = groupProjectsByYear(others);
  const total = featured.length + others.length;

  return (
    <div className="mx-auto w-full max-w-[900px] px-6 pt-10 pb-20 sm:px-10">
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="text-xl">Projects</h1>
        {/* 총 개수는 데이터라 mono. */}
        <span className="font-mono text-2xs text-text-3">{total}</span>
      </header>

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
        <section className={featured.length > 0 ? undefined : "mt-10"}>
          <h2 className="font-mono text-2xs text-text-3">전체 작업</h2>
          <div className="mt-3.5">
            {timeline.map((group, index) => (
              <div
                key={group.year}
                // 그룹 사이만 선으로 나눈다. 첫 그룹 위에는 선을 두지 않는다.
                className={
                  index === 0
                    ? "flex gap-6 max-sm:flex-col max-sm:gap-0"
                    : "flex gap-6 border-t border-border max-sm:flex-col max-sm:gap-0"
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

      <MiniChatPrompt
        label="어떤 작업이 궁금한지 물어보셔도 됩니다"
        placeholder="예: VIORA에서 처리 위치를 왜 나눴나요?"
        caption="프로젝트와 블로그 글에서 답을 찾습니다"
        className="mt-16"
      />
    </div>
  );
}
