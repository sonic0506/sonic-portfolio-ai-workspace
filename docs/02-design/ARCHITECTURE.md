# Architecture

Status: Draft

## 1. High-level Components

```text
Public Web
   │
   ├── Profile / Projects / Blog / Graph / Chat
   │
Backend / Application API
   │
   ├── Content Domain
   ├── Admin Domain
   ├── Knowledge / Document Domain
   └── RAG Service
   │
   ├── Relational Database
   ├── Vector Search
   └── File / Image Storage

Admin Web
   │
   └── Content / Relation / RAG Management
```

## 2. Architecture Principles

- Public과 Admin은 동일한 원본 콘텐츠를 사용한다.
- Business Data와 RAG 파생 데이터를 분리한다.
- RAG Index는 원본이 아니며 재생성 가능한 데이터로 취급한다.
- Graph View와 RAG Relation Expansion은 동일한 Relation Source를 사용한다.

## 3. Confirmed Technology Stack

[ADR-0001](../03-decisions/ADR-0001-core-technology-stack.md)에 따라 Public은 Next.js, Admin은 React, 서버는 Spring Boot(Java 21)와 JPA/QueryDSL을 사용한다. DB/검색은 PostgreSQL/pgvector, LLM 제공자는 OpenAI, 스토리지는 S3이다. 배포 토폴로지와 상세 설계는 아직 Draft이다.

운영 조건은 [ADR-0002](../03-decisions/ADR-0002-operating-budget-auth-and-limits.md)를 따른다. 모든 비용 포함 월 10만 원, AWS 및 AWS 관리형 DB 선호, GitHub 본인 계정만 관리자 접근 허용, 설정으로 해제 가능한 챗봇 질문 제한을 적용한다.

## 4. Pending Decisions

배포 구성은 [ADR-0003](../03-decisions/ADR-0003-initial-deployment.md)과 [ADR-0017](../03-decisions/ADR-0017-single-server-docker-deployment.md)을 따른다: 프론트는 Vercel Hobby, 백엔드는 서울 Lightsail 4GB 1대에 Docker Compose(Spring·PostgreSQL/pgvector·Caddy). RDS는 쓰지 않는다. 실행 계획은 [DEPLOYMENT_PLAN](../04-plans/DEPLOYMENT_PLAN.md).

모델과 검색·답변 정책은 [ADR-0006](../03-decisions/ADR-0006-embedding-model-and-retrieval.md), [ADR-0007](../03-decisions/ADR-0007-generation-model-and-answer-prompt.md)로 확정했다. 콘텐츠·Document 모델은 [ADR-0005](../03-decisions/ADR-0005-content-and-document-model.md)를 따른다.

기존 5건을 **구현 착수 전 필요한 것**과 **해당 기능을 만들 때 정할 것**으로 나눈다(2026-09-10 사용자 결정).
문서로 미리 정해도 추측이 되는 항목은 코드가 생긴 뒤에 정한다. RAG 설계에서 측정 없이 세운 가정이 두 번 틀렸던 경험을 반영한 것이다.

### 구현 착수 전 필요

| 항목 | 이유 |
|---|---|
| Dependency versions and build tools | 프론트: ADR-0012(Next.js·React+Vite·pnpm). 백엔드 완료: ADR-0009. Gradle Groovy 9.7.1, Java 21, Boot 4.1.1, AI 2.0.1, QueryDSL 5.1.0, PostgreSQL 17 / pgvector 0.8.2. 프론트 확정(FRONTEND_IMPLEMENTATION): pnpm 12.4.2 workspace, Node ≥22.22, Next.js 16.3.5, Vite 8.3 + React Router 8.4 + TanStack Query 5 + RHF 7 + Zod 4, Tailwind 4 + shadcn/ui, Vitest 5. 개발 중 API는 개발 서버 프록시 |
| API style — 완료 | ADR-0008: REST + JSON, 채팅 진행 상태·문서 목록·답변 SSE |

### 해당 기능 착수 시 결정

| 항목 | 시점 | 비고 |
|---|---|---|
| Authentication session details — 완료 | Admin 인증 구현 시 | [ADR-0010](../03-decisions/ADR-0010-admin-authentication.md): GitHub 숫자 ID 대조, 서버 세션 쿠키, 쿠키 CSRF 토큰. Admin 도메인/CORS는 ADR-0017(2026-10-04): admin은 같은 호스트 rewrite로 CORS 없음, CORS는 채팅에만 |
| Graph library — 완료 | Graph View 구현 시 | [ADR-0015](../03-decisions/ADR-0015-graph-visualization.md): `react-force-graph-2d` + `d3-force`, `GET /api/graph` (2026-09-29) |
| S3 region / access policy | 이미지 업로드 구현 시 | 본문 Markdown 저장은 `content_section.body_markdown`으로 DATA_MODEL에서 이미 결정됐다. 남은 것은 이미지 등 첨부 파일 정책이다 |

이 문서는 위 표의 "구현 착수 전 필요" 항목이 해소되면 `Accepted`로 올린다. 나머지는 해당 기능 구현 시 ADR로 추가한다.

배포 구성은 ADR-0017로 정했으나 실제 배포·성능·청구는 미검증이다.

로컬 개발 데이터: `samples/`를 local 전용 시드(`app.seed.samples-dir`)로 등록한다. 테스트는 같은 서버의 별도 DB `portfolio_test`를 쓴다(backend/README).

초기 백엔드 구현은 ADR-0009 검증 결과 및 FIRST_BACKEND_IMPLEMENTATION 계획을 기준으로 시작할 수 있다. 전체 문서의 Draft는 프론트·기능별 상세 미확정을 나타낸다. 실제 제품 기동·JPA/AI 연동은 첫 구현에서 검증한다.
