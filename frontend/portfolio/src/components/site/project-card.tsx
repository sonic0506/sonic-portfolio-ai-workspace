import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectSummary, Skill } from "@/lib/types";
import { formatPeriod } from "@/lib/utils";

export function ProjectCard({ project }: { project: ProjectSummary }) {
  return (
    <Link href={`/projects/${project.slug}`} className="block">
      <Card className="h-full transition-colors hover:bg-accent/50">
        <CardHeader>
          <CardTitle>{project.title}</CardTitle>
          <CardDescription>
            {formatPeriod(project.periodStart, project.periodEnd)}
            {project.position ? ` · ${project.position}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">{project.summary}</p>
          {project.highlights && project.highlights.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {project.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          )}
          <SkillBadges skills={project.skills} />
        </CardContent>
      </Card>
    </Link>
  );
}

export function SkillBadges({ skills }: { skills: Skill[] }) {
  if (!skills.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((s) => (
        <Badge key={s.code} variant="secondary">
          {s.name}
        </Badge>
      ))}
    </div>
  );
}
