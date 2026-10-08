import { headingId } from "@portfolio/markdown";
import type { Section } from "./types";

// 본문 렌더러와 같은 함수를 써야 목차 링크가 맞는다.
export { headingId };

export type DocHeading = { id: string; level: 2 | 3; text: string };

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
