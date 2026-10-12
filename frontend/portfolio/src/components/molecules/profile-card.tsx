export type ProfileMeta = { text: string; href?: string };

/** 우측 aside의 프로필 카드. 메타는 전부 데이터 문자열이라 mono다. href가 있으면 링크로 건다. */
export function ProfileCard({ headline, meta }: { headline: string; meta: ProfileMeta[] }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      <p className="text-sm break-keep text-text-2">{headline}</p>
      {meta.length > 0 && (
        <>
          <div className="h-px bg-border" />
          <ul className="flex flex-col gap-1.5 font-mono text-2xs text-text-2">
            {meta.map((item) => (
              <li key={item.text} className="break-all">
                {item.href ? (
                  <a
                    href={item.href}
                    {...(item.href.startsWith('http') && { target: '_blank', rel: 'noreferrer' })}
                    className="underline-offset-2 transition-colors hover:text-foreground hover:underline focus-visible:rounded-xs focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {item.text}
                  </a>
                ) : (
                  item.text
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
