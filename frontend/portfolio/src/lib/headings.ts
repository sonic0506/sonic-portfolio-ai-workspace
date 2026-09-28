import type { Section } from "./types";

export type DocHeading = { id: string; level: 2 | 3; text: string };

/** 목차와 본문 제목이 같은 id를 쓰도록 텍스트에서 만든다. 한글은 그대로 둔다. */
export function headingId(text: string): string {
  return `h-${text.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "")}`;
}

/** 섹션 제목(h2)과 본문 안의 ### (h3)로 목차를 만든다. 코드 블록 안의 #은 건너뛴다. */
export function extractHeadings(sections: Section[]): DocHeading[] {
  const headings: DocHeading[] = [];
  for (const section of sections) {
    if (section.title) headings.push({ id: headingId(section.title), level: 2, text: section.title });
    let fenced = false;
    for (const line of section.bodyMarkdown.split("\n")) {
      if (line.trimStart().startsWith("```")) fenced = !fenced;
      const match = !fenced && /^###\s+(.+?)\s*#*$/.exec(line);
      if (match) headings.push({ id: headingId(match[1]), level: 3, text: match[1] });
    }
  }
  return headings;
}
