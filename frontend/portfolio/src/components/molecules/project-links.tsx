import type { ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import { siGithub } from 'simple-icons';

import { TechIcon } from '@/components/atoms/tech-icon';
import { cn } from '@/lib/utils';

/** 링크가 없으면 회색 disabled 아이콘을 남기지 않고 아이콘 자체를 그리지 않는다. */
export function ProjectLinks({
  githubUrl,
  serviceUrl,
  title,
  className,
}: {
  githubUrl: string | null;
  serviceUrl: string | null;
  title: string;
  className?: string;
}) {
  const items = [
    githubUrl && {
      key: 'github',
      href: githubUrl,
      label: `${title} GitHub 저장소`,
      icon: <TechIcon icon={siGithub} className="size-3.5" />,
    },
    serviceUrl && {
      key: 'service',
      href: serviceUrl,
      label: `${title} 서비스 열기`,
      icon: <ExternalLink className="size-4" strokeWidth={1.5} />,
    },
  ].filter(Boolean) as { key: string; href: string; label: string; icon: ReactNode }[];

  if (items.length === 0) return null;

  return (
    <span className={cn('flex items-center gap-1.5', className)}>
      {items.map((item) => (
        <a
          key={item.key}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          aria-label={item.label}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-border text-text-2 transition-colors hover:border-border-hi hover:bg-surface-hi hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {item.icon}
        </a>
      ))}
    </span>
  );
}
