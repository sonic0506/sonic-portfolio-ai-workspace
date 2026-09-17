import type { Metadata } from "next";
import { SkillBadges } from "@/components/site/project-card";
import { References } from "@/components/site/references";
import { Sections } from "@/components/site/sections";
import { getProject } from "@/lib/api";
import { formatPeriod } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  return { title: project.title, description: project.summary };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = await getProject(slug);
  const facts = [
    project.organization && ["소속", project.organization],
    ["기간", formatPeriod(project.periodStart, project.periodEnd)],
    project.position && ["역할", project.position],
    project.contribution !== null && [
      "기여도",
      `${project.contribution}%${project.contributionNote ? ` (${project.contributionNote})` : ""}`,
    ],
  ].filter(Boolean) as [string, string][];

  return (
    <article className="space-y-6">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
        <p className="text-lg text-muted-foreground">{project.summary}</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          {facts.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <SkillBadges skills={project.skills} />
        <div className="flex gap-4 text-sm">
          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
              GitHub
            </a>
          )}
          {project.serviceUrl && (
            <a href={project.serviceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
              서비스
            </a>
          )}
        </div>
      </header>
      <Sections sections={project.sections} />
      <References references={project.references} referencedBy={project.referencedBy} />
    </article>
  );
}
