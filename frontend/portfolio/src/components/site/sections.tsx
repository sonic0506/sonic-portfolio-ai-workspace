import { Markdown } from "@/components/markdown/markdown";
import type { Section } from "@/lib/types";

export function Sections({ sections }: { sections: Section[] }) {
  return (
    <div>
      {sections.map((section, i) => (
        <section key={`${i}-${section.title}`}>
          {section.title && <h2 className="mt-10 mb-3 text-xl font-semibold">{section.title}</h2>}
          <Markdown>{section.bodyMarkdown}</Markdown>
        </section>
      ))}
    </div>
  );
}
