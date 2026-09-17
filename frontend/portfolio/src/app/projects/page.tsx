import type { Metadata } from "next";
import { ProjectCard } from "@/components/site/project-card";
import { getProjects } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "프로젝트" };

export default async function ProjectsPage() {
  const { featured, others } = await getProjects();
  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">프로젝트</h1>
      {featured.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2">
          {featured.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </section>
      )}
      {others.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">그 밖의 프로젝트</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {others.map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
        </section>
      )}
      {featured.length + others.length === 0 && <p className="text-muted-foreground">공개된 프로젝트가 없습니다.</p>}
    </div>
  );
}
