import Link from "next/link";
import { Thread, ThreadItem } from "@/components/molecules/thread";
import type { DocumentReference } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<DocumentReference["type"], string> = { PROJECT: "프로젝트", BLOG: "블로그" };

/**
 * 상세 하단의 "참고 문서"와 "이 문서를 참고한 문서" (ADR-0005 후속 결정). 비어 있는 목록은 숨긴다.
 * sonic 시그니처 스레드로 잇고, 프로젝트는 악센트 사각형·블로그는 원으로 구분한다.
 */
export function References({
  references,
  referencedBy,
  className,
}: {
  references: DocumentReference[];
  referencedBy: DocumentReference[];
  className?: string;
}) {
  const groups = [
    { title: "참고 문서", items: references },
    { title: "이 문서를 참고한 문서", items: referencedBy },
  ].filter((g) => g.items.length > 0);
  if (groups.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-10", className)}>
      {groups.map((g) => (
        <section key={g.title} aria-label={g.title}>
          <h2 className="font-mono text-2xs text-text-3">
            {g.title} {g.items.length}
          </h2>
          <Thread className="mt-3">
            {g.items.map((r) => (
              <ThreadItem key={`${r.type}-${r.slug}`}>
                <Link
                  href={r.url}
                  className="-mx-2 flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-surface-hi focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <span
                    aria-hidden="true"
                    className={cn("size-2 shrink-0", r.type === "PROJECT" ? "bg-accent" : "rounded-[4px] bg-text-3")}
                  />
                  <span className="min-w-0 flex-1 truncate text-md">{r.title}</span>
                  <span className="shrink-0 font-mono text-2xs text-text-3">{TYPE_LABEL[r.type]}</span>
                </Link>
              </ThreadItem>
            ))}
          </Thread>
        </section>
      ))}
    </div>
  );
}
