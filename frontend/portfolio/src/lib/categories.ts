/**
 * 블로그 카테고리 code → 점 색. content/taxonomy.md의 code와 맞춘다.
 * 표에 없는 새 카테고리는 기본색으로 그린다(어드민에서 추가해도 깨지지 않게).
 */
const DOT: Record<string, string> = {
  frontend: "bg-cat-frontend",
  architecture: "bg-cat-architecture",
  ux: "bg-cat-ux",
  collaboration: "bg-cat-collaboration",
  infra: "bg-cat-infra",
  hardware: "bg-cat-hardware",
};

export function categoryDotClass(code: string | null | undefined): string {
  return (code && DOT[code]) || "bg-cat-default";
}
