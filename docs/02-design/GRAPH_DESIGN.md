# Graph Design

Status: Draft

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

## 3. Edge

Document Relation을 기본 Edge Source로 사용한다.

## 4. Filter

- All
- Project
- Blog
- Skill

## 5. RAG Integration

Graph용 Relation과 RAG Relation Expansion의 데이터 소스를 분리하지 않는 것을 기본 방향으로 한다.
