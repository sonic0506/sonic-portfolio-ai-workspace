# Graph Design

Status: Accepted (2026-09-29, [ADR-0015](../03-decisions/ADR-0015-graph-visualization.md))

## 1. Purpose

프로젝트, 블로그, 기술 등 콘텐츠의 연결 관계를 시각적으로 탐색한다.

## 2. Node Candidates

- Project
- Blog
- Skill
- Category

초기 MVP에서 어떤 Node Type까지 포함할지는 설계 단계에서 축소 가능하다.

Skill과 Category는 `document_type`에 포함하지 않는다([DATA_MODEL](DATA_MODEL.md), [ADR-0005](../03-decisions/ADR-0005-content-and-document-model.md)).
`document_relation`이 Document 사이만 연결하므로, Skill/Category를 노드로 그리려면 `project_skill` / `blog_skill` / `blog_category` 연결 테이블을 Graph 전용 Edge로 함께 읽어야 한다. MVP 포함 여부는 미정이다.

### 결정 — 2026-09-29 (사용자, 구현은 다른 프론트 작업 뒤)

- 노드: Project, Blog, **Skill, Category까지 포함**한다. Skill 간선은 `project_skill`·`blog_skill`, Category 간선은 `blog_post.category_id`(단일 카테고리, ADR-0005 후속 3)에서 읽는다.
- 노드 UI는 sonic-portfolio 그래프(문서·프로젝트 2종)를 4종으로 확장한다. 카테고리 색은 서버 `category.color`(ADR-0005 후속 3)를 노드에 쓴다.
- 라이브러리·API·화살표·스킬 기본 숨김은 ADR-0015에서 정했다.

## 3. Edge

| kind | 방향 | 원천 | 비고 |
|---|---|---|---|
| `REFERENCE` | source가 target을 참고 | `document_relation`(`RELATED_TO`) | 옅은 화살표로 방향 표시 |
| `SKILL` | 문서 → 스킬 | `project_skill`, `blog_skill` | 스킬 노드를 숨기면 함께 숨김 |
| `CATEGORY` | 블로그 → 카테고리 | `blog_post.category_id` | |

공개 문서끼리의 참고만 포함한다(비공개 한쪽이면 간선 제외).

## 4. API — `GET /api/graph` (익명)

```json
{
  "nodes": [
    {"id": "project:viora", "type": "PROJECT", "key": "viora", "title": "...", "url": "/projects/viora",
     "summary": "...", "periodStart": "2026-07-01", "periodEnd": null},
    {"id": "blog:evar-credit-flow", "type": "BLOG", "key": "evar-credit-flow", "title": "...", "url": "/blog/evar-credit-flow",
     "summary": "...", "color": "#2E93A8", "publishedAt": "...", "tags": ["관리자"]},
    {"id": "category:ux", "type": "CATEGORY", "key": "ux", "title": "UX·화면 흐름", "url": "/blog?category=ux", "color": "#2E93A8"},
    {"id": "skill:react", "type": "SKILL", "key": "react", "title": "React", "url": null}
  ],
  "edges": [{"source": "project:evar", "target": "blog:evar-credit-flow", "kind": "REFERENCE"}]
}
```

- 값이 없는 선택 필드는 null이다. 노드 순서: 프로젝트(목록 순서) → 블로그(최신순) → 카테고리(`display_order`) → 스킬(code).
- 카테고리·스킬은 공개 문서가 쓰는 것만. 프로젝트 `color`는 없다(악센트 고정).

## 5. Filter / 화면

- 필터: 프로젝트·블로그·카테고리·스킬 표시 토글(기본은 전체 보기, ADR-0015 후속)과 제목 검색. **배치·노드 크기·라벨은 보이는 종류만으로 계산한다**(숨긴 스킬이 시뮬레이션에 남으면 화면이 퍼지고 문서 크기가 스킬 수로 부풀어 구현 중 바꿨다). 토글하면 다시 배치하고 화면에 맞춘다.
- 노드 모양·크기·간선 스타일, 모바일 트리는 ADR-0015.
- 상세 패널: 프로젝트(요약·기간·스킬·열기), 블로그(요약·카테고리·날짜·태그·열기), 카테고리(글 수·목록 링크), 스킬(쓴 문서 목록). 공통 "이 노드에 대해 물어보기".
- URL 상태: `?node=&hide=&q=`(ADR-0015 후속). 새로고침·뒤로 가기에도 선택·필터·검색이 유지된다.
- 진입점: 사이드바, 프로젝트·블로그 상세 `/graph?node={id}`, 블로그 카테고리 `/graph?node=category:{code}`.

## 6. RAG Integration

Graph용 Relation과 RAG Relation Expansion의 데이터 소스를 분리하지 않는 것을 기본 방향으로 한다. 화면의 방향 표시는 RAG 탐색(양방향)에 영향을 주지 않는다.
