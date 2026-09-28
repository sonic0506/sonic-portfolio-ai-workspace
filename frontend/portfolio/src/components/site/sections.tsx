import { Markdown } from "@/components/markdown/markdown";
import { headingId } from "@/lib/headings";
import type { Section } from "@/lib/types";

/** 본문 섹션. 섹션 제목이 h2이고 목차(extractHeadings)와 같은 id를 쓴다. */
export function Sections({ sections }: { sections: Section[] }) {
  return (
    <div className="[&>section:first-child>h2]:mt-8">
      {sections.map((section, i) => (
        <section key={`${i}-${section.title}`}>
          {section.title && (
            <h2
              id={headingId(section.title)}
              className="mt-14 mb-4 scroll-mt-6 font-display text-lg font-medium tracking-[-0.02em]"
            >
              {section.title}
            </h2>
          )}
          <Markdown>{section.bodyMarkdown}</Markdown>
        </section>
      ))}
    </div>
  );
}
