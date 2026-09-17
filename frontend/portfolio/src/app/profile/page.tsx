import type { Metadata } from "next";
import { SkillBadges } from "@/components/site/project-card";
import { Sections } from "@/components/site/sections";
import { getProfile } from "@/lib/api";
import type { SkillGroupCode } from "@/lib/types";
import { formatPeriod } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "소개" };

// 그룹 표시명은 프론트에서 정한다(API_DESIGN).
const GROUP_LABEL: Record<SkillGroupCode, string> = {
  PRIMARY: "주력 기술",
  PROJECT_EXPERIENCE: "프로젝트 경험",
  LEARNING: "학습 중",
  COLLABORATION: "협업 도구",
};

export default async function ProfilePage() {
  const profile = await getProfile();
  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">{profile.headline}</h1>
        {profile.shortBio && <p className="text-lg text-muted-foreground">{profile.shortBio}</p>}
        <div className="flex gap-4 text-sm">
          {profile.githubUrl && (
            <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
              GitHub
            </a>
          )}
          {profile.email && (
            <a href={`mailto:${profile.email}`} className="underline underline-offset-4">
              {profile.email}
            </a>
          )}
        </div>
      </header>

      {profile.careers.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">경력</h2>
          <ol className="space-y-4">
            {profile.careers.map((c) => (
              <li key={`${c.company}-${c.periodStart}`} className="border-l-2 pl-4">
                <p className="font-medium">
                  {c.company}
                  {c.role ? <span className="text-muted-foreground"> · {c.role}</span> : null}
                </p>
                <p className="text-sm text-muted-foreground">{formatPeriod(c.periodStart, c.periodEnd)}</p>
                {c.description && <p className="mt-1 text-sm">{c.description}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {profile.skillGroups.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">기술</h2>
          {profile.skillGroups.map((g) => (
            <div key={g.group} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{GROUP_LABEL[g.group] ?? g.group}</h3>
              <SkillBadges skills={g.skills} />
            </div>
          ))}
        </section>
      )}

      <Sections sections={profile.sections} />
    </article>
  );
}
