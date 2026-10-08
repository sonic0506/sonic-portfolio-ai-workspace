import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { siGithub } from "simple-icons";
import { TechIcon } from "@/components/atoms/tech-icon";
import { CareerEntry } from "@/components/molecules/career-entry";
import { ProfileCard } from "@/components/molecules/profile-card";
import { DocLayout } from "@/components/organisms/doc-layout";
import { Sections } from "@/components/site/sections";
import { getProfile } from "@/lib/api";
import { extractHeadings, type DocHeading } from "@/lib/headings";
import type { SkillGroupCode } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "소개" };

// 그룹 표시명은 프론트에서 정한다(API_DESIGN).
const GROUP_LABEL: Record<SkillGroupCode, string> = {
  PRIMARY: "주력 기술",
  PROJECT_EXPERIENCE: "프로젝트 경험",
  LEARNING: "학습 중",
  COLLABORATION: "협업 도구",
};

const buttonStyle =
  "inline-flex items-center gap-2.5 rounded-md border border-border-hi px-3.5 py-[9px] text-sm text-text-1 transition-colors hover:bg-surface-hi focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default async function ProfilePage() {
  const profile = await getProfile();
  const hasCareers = profile.careers.length > 0;
  const hasSkills = profile.skillGroups.length > 0;

  // 고정 섹션 id는 본문 섹션(h-*)과 겹치지 않게 접두사 없이 둔다.
  const headings: DocHeading[] = [
    ...(hasCareers ? [{ id: "career", level: 2 as const, text: "경력" }] : []),
    ...(hasSkills ? [{ id: "skills", level: 2 as const, text: "스킬" }] : []),
    ...extractHeadings(profile.sections),
    { id: "contact", level: 2, text: "연락처" },
  ];

  const header = (
    <header>
      <h1 className="text-xl">Profile</h1>
      <div className="mt-4 flex gap-6 max-sm:flex-col">
        {profile.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.imageUrl}
            alt=""
            className="h-56 w-45 shrink-0 rounded-lg border border-border bg-surface object-cover"
          />
        )}
        <div className="flex min-w-0 flex-col gap-3">
          <p className="font-display text-lg leading-[1.4] font-medium break-keep">{profile.headline}</p>
          {profile.shortBio && (
            <p className="font-body text-base leading-[1.75] break-keep whitespace-pre-line text-text-2">
              {profile.shortBio}
            </p>
          )}
        </div>
      </div>
    </header>
  );

  const meta = [profile.careers[0]?.role, profile.githubUrl, profile.email].filter(Boolean) as string[];

  return (
    <DocLayout headings={headings} header={header} aside={<ProfileCard headline={profile.headline} meta={meta} />}>
      {hasCareers && (
        <section id="career" className="mt-14 scroll-mt-6">
          <h2 className="font-display text-lg font-medium tracking-[-0.02em]">경력</h2>
          <ol className="mt-6 flex flex-col gap-14">
            {profile.careers.map((career) => (
              <CareerEntry key={`${career.company}-${career.periodStart}`} career={career} />
            ))}
          </ol>
        </section>
      )}

      {hasSkills && (
        <section id="skills" className="mt-14 scroll-mt-6">
          <h2 className="font-display text-lg font-medium tracking-[-0.02em]">스킬</h2>
          <div className="mt-6 flex flex-col gap-6">
            {profile.skillGroups.map((group) => (
              <div key={group.group} className="flex flex-col gap-2.5">
                <span className="font-mono text-2xs text-text-3">{GROUP_LABEL[group.group] ?? group.group}</span>
                {/* 숙련도를 막대나 별로 그리지 않는다. 분류는 그룹 라벨이 대신한다. */}
                <ul className="flex flex-wrap gap-2">
                  {group.skills.map((skill) => (
                    <li
                      key={skill.code}
                      className={cn(
                        "inline-flex items-center rounded-xs border px-2.5 py-[5px] text-sm text-text-2",
                        group.group === "PRIMARY" ? "border-border-hi" : "border-border",
                      )}
                    >
                      {/* 올린 로고가 있을 때만(ADR-0020). 스택 태그는 아이콘 없이 둔다(stack-tag.tsx). */}
                      {skill.iconUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={skill.iconUrl} alt="" className="mr-1.5 size-3.5 shrink-0 object-contain" />
                      )}
                      {skill.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <Sections sections={profile.sections} />

      <section id="contact" className="mt-14 scroll-mt-6">
        <h2 className="font-display text-lg font-medium tracking-[-0.02em]">연락처</h2>
        <p className="mt-2.5 text-md text-text-2">이 페이지에 없는 게 궁금하다면</p>
        <Link
          href="/"
          className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-3.5 transition-colors hover:border-border-hi hover:bg-surface-hi focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="flex min-w-0 flex-col gap-1">
            <span className="text-md font-medium">채팅에서 물어보기</span>
            <span className="font-mono text-2xs text-text-3">프로젝트와 블로그 글에서 답을 찾습니다</span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-text-2" strokeWidth={1.5} />
        </Link>
        {(profile.githubUrl || profile.email) && (
          <div className="mt-6 flex flex-wrap gap-2">
            {profile.githubUrl && (
              <a href={profile.githubUrl} target="_blank" rel="noreferrer" className={buttonStyle}>
                <TechIcon icon={siGithub} className="size-4 shrink-0" />
                GitHub
              </a>
            )}
            {profile.email && (
              <a href={`mailto:${profile.email}`} className={buttonStyle}>
                <Mail className="size-4 shrink-0" strokeWidth={1.5} />
                Email
              </a>
            )}
          </div>
        )}
      </section>
    </DocLayout>
  );
}
