import Link from "next/link";

export type PagerItem = { href: string; title: string };

/** 목록 순서를 그대로 따른다. 첫·마지막 문서는 한쪽이 비고, 칸도 비운다. */
export function DocPager({ previous, next }: { previous?: PagerItem; next?: PagerItem }) {
  if (!previous && !next) return null;

  return (
    <nav aria-label="이전·다음 문서" className="mt-16 border-t border-border pt-6">
      <div className="grid grid-cols-2 gap-4">
        {previous ? (
          <Link
            href={previous.href}
            className="-m-3.5 flex flex-col gap-1.5 rounded-md p-3.5 transition-colors hover:bg-surface-hi focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="font-mono text-2xs text-text-3">← 이전</span>
            <span className="line-clamp-2 text-md font-medium break-keep">{previous.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={next.href}
            className="col-start-2 -m-3.5 flex flex-col items-end gap-1.5 rounded-md p-3.5 text-right transition-colors hover:bg-surface-hi focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="font-mono text-2xs text-text-3">다음 →</span>
            <span className="line-clamp-2 text-md font-medium break-keep">{next.title}</span>
          </Link>
        )}
      </div>
    </nav>
  );
}

/** 목록에서 slug의 앞뒤 항목. */
export function neighbors<T extends { slug: string }>(list: T[], slug: string) {
  const index = list.findIndex((item) => item.slug === slug);
  return {
    previous: index > 0 ? list[index - 1] : undefined,
    next: index >= 0 ? list[index + 1] : undefined,
  };
}
