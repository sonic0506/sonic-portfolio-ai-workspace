import Link from "next/link";
import { ProjectCard } from "@/components/site/project-card";
import { getProfileOrNull, getProjects } from "@/lib/api";

// 백엔드 데이터를 요청마다 읽는다(빌드 시 백엔드가 없어도 된다).
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [profile, projects] = await Promise.all([getProfileOrNull(), getProjects()]);
  return (
    <div className="space-y-12">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">{profile?.headline ?? "개발자 포트폴리오"}</h1>
        {profile?.shortBio && <p className="text-lg text-muted-foreground">{profile.shortBio}</p>}
        <p className="text-sm text-muted-foreground">
          오른쪽 아래 <strong>질문하기</strong>로 경력과 프로젝트에 대해 물어볼 수 있어요.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">대표 프로젝트</h2>
          <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground">
            전체 보기
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.featured.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
