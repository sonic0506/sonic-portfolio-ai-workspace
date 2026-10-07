import Link from 'next/link';
import { Waypoints } from 'lucide-react';

import { cn } from '@/lib/utils';

/** 그래프로 넘어가는 버튼. 무엇을 열지는 부르는 쪽이 노드 id로 정한다(`/graph?node=`). */
export function GraphLink({ nodeId, label, className }: { nodeId: string; label: string; className?: string }) {
  return (
    <Link
      href={`/graph?node=${encodeURIComponent(nodeId)}`}
      className={cn(
        'flex h-9 items-center justify-center gap-2.5 rounded-md border border-border bg-surface text-sm text-text-1 transition-colors hover:border-border-hi hover:bg-surface-hi focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      <Waypoints className="size-4 shrink-0" strokeWidth={1.5} />
      {label}
    </Link>
  );
}
