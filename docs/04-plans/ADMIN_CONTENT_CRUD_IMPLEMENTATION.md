# Admin Content CRUD Implementation

Status: Done (2026-09-16)
Date: 2026-09-16

**Goal:** 관리자가 Project / Blog / Profile / Category / Tag를 API로 등록·수정·삭제하고, 공개 API가 그 결과를 규칙대로(비공개 제외) 보여주는 것을 실제 DB에서 검증한다.

**Spec:** [CONTENT_SPEC](../00-project/CONTENT_SPEC.md), [DATA_MODEL](../02-design/DATA_MODEL.md), [ADR-0005](../03-decisions/ADR-0005-content-and-document-model.md), [ADR-0010](../03-decisions/ADR-0010-admin-authentication.md), [API_DESIGN](../02-design/API_DESIGN.md). 선행: [ADMIN_AUTH_IMPLEMENTATION](ADMIN_AUTH_IMPLEMENTATION.md)의 Skill 관리 방식.

## 단계

- **1단계(이번):** Project 관리, Category/Tag 관리, 공용 섹션 저장
- **2단계(다음):** Blog 관리(카테고리·태그·기술·섹션), Profile 수정(경력·스킬 그룹·섹션)

## 공통 규칙

- 경로는 `/api/admin/...`, 관리자 + CSRF 필요. 관리 대상은 내부 `id`로 지정한다(slug는 수정 가능한 값).
- **전체 교체(PUT):** 수정 요청은 항목 전체를 보낸다. 하이라이트·기술·섹션 목록도 통째로 교체하며, 목록 순서가 곧 `display_order`(0부터)다. 목록 필드는 필수이고 빈 배열은 "모두 삭제"다.
- **발행 시각:** 비공개→공개로 처음 바뀔 때 `published_at`이 비어 있으면 현재 시각을 넣는다. 공개를 해제해도 `published_at`은 유지해 재공개 시 원래 발행일이 남는다.
- **수정 시각:** 생성·수정 때 `updated_at`을 현재 시각으로 갱신한다.
- 오류: 입력 검증 `400`(기간 역전, 존재하지 않는 기술 ID, 중복 기술 ID 포함), 없음 `404`, slug/code 중복·참조 중 삭제 `409`.
- 관리자 응답은 비공개 항목과 `adminNote`, `published`, `featured`, `displayOrder`를 포함한다. 공개 API 응답은 바뀌지 않는다.
- **RAG 연결 지점(이번 범위 밖):** 생성·수정·발행 토글·삭제 시 Document 투영(`document.visible`, 재색인 요청)을 같은 트랜잭션에서 갱신해야 한다(ADR-0005). Document 색인 계획에서 이 서비스 메서드들에 연결한다.

## 1단계 Tasks

### Project

- [x] `GET /api/admin/projects` — 비공개 포함 전체 목록. `id, slug, title, featured, published, displayOrder, periodStart, periodEnd, publishedAt, updatedAt`. 정렬은 공개 목록과 동일.
- [x] `GET /api/admin/projects/{id}` — 모든 필드 + `adminNote`, `highlights[]`, `skillIds[]`, `sections[]`
- [x] `POST /api/admin/projects` → `201`, `PUT /api/admin/projects/{id}` → `200`, `DELETE /api/admin/projects/{id}` → `204`(하위 행은 FK cascade)
- [x] 요청: `slug, title, summary, organization, position, contribution(0~100), contributionNote, periodStart, periodEnd, thumbnailUrl, githubUrl, serviceUrl, featured, published, displayOrder, adminNote, highlights[], skillIds[], sections[{title, bodyMarkdown}]`
- [x] `ProjectAdminApiTest`: 생성→관리자 상세·공개 상세 반영, 발행 시각 규칙, 목록 교체, slug 중복 409, 기간 역전·없는 기술 400, 삭제와 하위 행 제거, 관리자 목록의 비공개 포함, 미로그인 401

### Category / Tag

- [x] `GET/POST /api/admin/categories`, `PUT/DELETE /api/admin/categories/{id}` — `{code, name, displayOrder}`. 블로그가 쓰는 카테고리 삭제는 `409`(FK restrict).
- [x] `GET/POST /api/admin/tags`, `PUT/DELETE /api/admin/tags/{id}` — `{code, name}`. 태그 삭제는 글 연결도 함께 지운다(FK cascade, DATA_MODEL).
- [x] `TaxonomyAdminApiTest`: 생성·수정·중복 409·참조 중 카테고리 삭제 409·사용 중 태그 삭제 허용

## 완료 기준

- `./gradlew clean test bootJar` 통과(로컬 docker DB)
- API_DESIGN Admin API 갱신, 세션 문서 갱신, 기능 단위 커밋

## 1단계 결과 — 2026-09-16

- 사용자 로컬 실행(15:03 KST): `./gradlew clean test bootJar` 성공, 전체 44건 통과. 추가: ProjectAdminApiTest 6, TaxonomyAdminApiTest 4.
- 구현: `content/SectionWriter`(소유자별 섹션 전체 교체), `project/ProjectAdminService`(JPA로 본체 저장 후 JDBC로 하위 목록 교체), `blog/TaxonomyAdminService`.
- `project.updated_at`을 쓰기 가능 매핑으로 바꿨다(애플리케이션이 수정 시각을 기록). 생성 직후 DB 기본값 `created_at`을 읽으려고 refresh한다.
- 테스트와 구현을 함께 작성해 실패 단계는 관찰하지 않았다.
- 미검증: Swagger에서의 수동 호출, 동시 수정 충돌(낙관적 잠금 없음, 관리자 1명이라 수용).

## 2단계 Tasks (다음)

- [x] Blog 관리 `/api/admin/blog/posts` — 1단계 Project와 같은 규칙. 요청: `slug, title, summary, thumbnailUrl, published, adminNote, categoryIds[], tagIds[], skillIds[], sections[]`. 없는 카테고리·태그·기술 ID는 400.
- [x] Profile 수정 `GET/PUT /api/admin/profile` — 단일 행 upsert. 요청: `headline, shortBio, imageUrl, githubUrl, email, careers[], skills[{skillId, group}], sections[]`. 경력 기간 역전 400, 그룹 값 검증 400.
- [x] `BlogAdminApiTest`, `ProfileAdminApiTest`

## 2단계 결과 — 2026-09-16

- 사용자 로컬 실행(15:21 KST): 전체 52건 통과. 추가: BlogPostAdminApiTest 4, ProfileAdminApiTest 4. 첫 실행에 통과했다.
- 구현: `blog/BlogPostAdminService`(카테고리·태그·기술 연결과 섹션 전체 교체), `profile/ProfileAdminService`(단일 행 upsert, 경력·스킬 그룹·섹션 전체 교체), 공용 `content/IdChecks`(참조 ID 중복·존재 검사 → 400).
- 관리자 블로그 목록은 초안(`publishedAt` 없음)을 먼저, 이후 최신순으로 정렬한다.
- Profile 관리 응답은 요청과 같은 모양(`careers[]`, `skills[{skillId, group}]`)이라 받은 그대로 수정해 다시 보낼 수 있다.
- `blog_post.updated_at`, `profile.updated_at`을 쓰기 가능 매핑으로 바꿨다.
