import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { siGithub } from "simple-icons";
import { TechIcon } from "@/components/atoms/tech-icon";
import { DocPager, neighbors } from "@/components/molecules/doc-pager";
import { GraphLink } from "@/components/molecules/graph-link";
import { References } from "@/components/molecules/references";
import { StackTags } from "@/components/molecules/stack-tags";
import { DocLayout } from "@/components/organisms/doc-layout";
import { Sections } from "@/components/site/sections";
import { getProject, getProjects } from "@/lib/api";
import { extractHeadings } from "@/lib/headings";
import { projectMeta, projectPath } from "@/lib/projects";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  return { title: project.title, description: project.summary };
}

const linkStyle =
  "inline-flex items-center gap-2 rounded-md border border-border-hi px-3.5 py-2 text-sm text-text-1 transition-colors hover:bg-surface-hi focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const [project, list] = await Promise.all([getProject(slug), getProjects()]);
  // 목록 화면 순서(대표 → 전체)가 곧 이전·다음 순서다.
  const { previous, next } = neighbors([...list.featured, ...list.others], slug);
  const toPager = (p?: { slug: string; title: string }) => p && { href: projectPath(p.slug), title: p.title };

  const header = (
    <header className="flex flex-col gap-4">
      <Link
        href="/projects"
        className="-ml-2.5 inline-flex w-fit items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-text-2 transition-colors hover:bg-surface-hi hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="size-3.5" strokeWidth={1.5} />
        Projects
      </Link>

      <h1 className="mt-2 text-xl leading-[1.4] font-medium break-keep">{project.title}</h1>
      <p className="font-body text-base leading-[1.6] break-keep text-text-2">{project.summary}</p>

      {/* 기간·소속·역할·기여도는 전부 데이터라 mono 한 줄로 묶는다. */}
      <p className="font-mono text-2xs text-text-2">
        {projectMeta(project, { contributionLabel: true })}
        {project.contributionNote && <span className="text-text-3"> ({project.contributionNote})</span>}
      </p>

      {/* 링크가 없으면 버튼 자체를 그리지 않는다. */}
      {(project.githubUrl || project.serviceUrl) && (
        <div className="flex flex-wrap gap-2">
          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noreferrer" className={linkStyle}>
              <TechIcon icon={siGithub} className="size-4 shrink-0" />
              GitHub
            </a>
          )}
          {project.serviceUrl && (
            <a href={project.serviceUrl} target="_blank" rel="noreferrer" className={linkStyle}>
              <ExternalLink className="size-4" strokeWidth={1.5} />
              서비스
            </a>
          )}
        </div>
      )}

      <StackTags stack={project.skills.map((s) => s.name)} max={project.skills.length} />

      {project.highlights && project.highlights.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {project.highlights.map((highlight) => (
            <li key={highlight} className="flex gap-2">
              <span aria-hidden="true" className="shrink-0 text-text-3">
                –
              </span>
              <span className="font-body text-md leading-[1.65] break-keep text-text-2">{highlight}</span>
            </li>
          ))}
        </ul>
      )}
    </header>
  );

  return (
    <DocLayout key={slug} headings={extractHeadings(project.sections)} header={header}>
      <Sections sections={project.sections} />
      <References references={project.references} referencedBy={project.referencedBy} className="mt-14 border-t border-border pt-14" />
      <GraphLink nodeId={`project:${project.slug}`} label="이 프로젝트의 연결 보기" className="mt-10 w-full" />
      <DocPager previous={toPager(previous)} next={toPager(next)} />
    </DocLayout>
  );
}
