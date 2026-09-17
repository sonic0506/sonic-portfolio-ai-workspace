import Link from "next/link";
import type { DocumentReference } from "@/lib/types";

const TYPE_LABEL: Record<DocumentReference["type"], string> = { PROJECT: "프로젝트", BLOG: "블로그" };

/** 상세 하단의 "참고 문서"와 "이 문서를 참고한 문서" (ADR-0005 후속 결정). 비어 있는 목록은 숨긴다. */
export function References({
  references,
  referencedBy,
}: {
  references: DocumentReference[];
  referencedBy: DocumentReference[];
}) {
  const groups = [
    { title: "참고 문서", items: references },
    { title: "이 문서를 참고한 문서", items: referencedBy },
  ].filter((g) => g.items.length > 0);
  if (groups.length === 0) return null;

  return (
    <aside className="mt-12 grid gap-8 border-t pt-8 sm:grid-cols-2">
      {groups.map((g) => (
        <section key={g.title} aria-label={g.title}>
          <h2 className="mb-3 text-base font-semibold">{g.title}</h2>
          <ul className="space-y-2">
            {g.items.map((r) => (
              <li key={`${r.type}-${r.slug}`}>
                <Link href={r.url} className="group flex items-baseline gap-2 text-sm">
                  <span className="shrink-0 text-xs text-muted-foreground">{TYPE_LABEL[r.type]}</span>
                  <span className="underline-offset-4 group-hover:underline">{r.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </aside>
  );
}
