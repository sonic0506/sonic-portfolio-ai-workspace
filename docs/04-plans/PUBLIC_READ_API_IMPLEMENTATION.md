# Public Read API Implementation Plan

Status: Done (2026-09-16)
Date: 2026-09-16

**Goal:** 방문자가 보는 Profile / Projects / Blog 화면에 필요한 공개 조회 API를 만들고, 비공개 콘텐츠·관리자 필드가 응답에 섞이지 않음을 실제 PostgreSQL에서 검증한다.

**Spec:** [CONTENT_SPEC](../00-project/CONTENT_SPEC.md), [DATA_MODEL](../02-design/DATA_MODEL.md), [ADR-0005](../03-decisions/ADR-0005-content-and-document-model.md), [ADR-0008](../03-decisions/ADR-0008-rest-and-chat-sse.md). 선행 구현: [FIRST_BACKEND_IMPLEMENTATION](FIRST_BACKEND_IMPLEMENTATION.md)의 `skill` 방식.

## Global Constraints

- 스키마는 V1 그대로 쓴다. 이번 계획에서 마이그레이션을 추가하지 않는다.
- 엔티티는 JPA 연관관계 없이 FK id 컬럼으로 매핑하고, 조회는 QueryDSL로 한다. 목록은 소유자 id 묶음으로 하위 데이터(하이라이트·기술·섹션)를 한 번씩 조회해 N+1을 피한다.
- 응답은 record DTO. `published`, `featured`(값 자체), `admin_note`, 내부 PK는 응답에 넣지 않는다. 공개 식별자는 `slug`다.
- 비공개(`published = false`) 프로젝트·블로그는 목록에서 제외하고 상세는 404다.
- 없는 리소스는 `ResponseStatusException(404)`. `spring.mvc.problemdetails.enabled=true`로 Problem Detail JSON을 쓴다.
- 인증 정책은 정하지 않는다. `SecurityConfig`의 익명 허용 목록에 공개 GET 경로만 추가한다.

## Out of Scope (별도 계획)

- **관련 문서(Relation) 표시:** Relation은 Document ID 기준(ADR-0005)이고 Document 색인이 아직 없다. 색인 구현 시 상세 응답에 공개 문서만 붙인다. RAG-007의 공개→비공개 링크 제외도 그때 검증한다.
- 추천 질문 블록 파싱: 본문 Markdown을 그대로 내려주고 프론트에서 remark-directive로 처리한다.
- 샘플 콘텐츠를 DB에 적재하는 시드 도구, Admin CRUD, Category/Tag 목록 API.

## Task 0 — 개발 환경 Swagger 공개 (2026-09-16 사용자 결정)

- [x] `application.properties`: `springdoc.api-docs.enabled=false`, `springdoc.swagger-ui.enabled=false`, `app.security.swagger-public=false`
- [x] `application-local.properties`: 위 세 값을 `true`로 설정
- [x] `SecurityConfig`: `app.security.swagger-public=true`일 때만 `/v3/api-docs/**`, `/swagger-ui/**`, `/swagger-ui.html` 익명 허용. `/error`도 허용한다(오류 응답이 403으로 바뀌지 않도록).
- [x] 테스트: local 프로필에서 `GET /v3/api-docs` 200, 문서에 `/api/skills` 포함.

## Task 1 — Projects

`GET /api/projects`

```json
{
  "featured": [{"slug":"viora","title":"...","summary":"...","highlights":["..."],
    "periodStart":"2026-07-01","periodEnd":null,"position":"개발",
    "contribution":30,"contributionNote":null,"thumbnailUrl":null,
    "skills":[{"id":1,"code":"java","name":"Java","iconKey":null}]}],
  "others": [{"slug":"...","title":"...","summary":"...","periodStart":"...","periodEnd":"...",
    "position":"...","contribution":50,"contributionNote":"...","skills":[]}]
}
```

- 대표/비대표를 나눠 반환한다. 하이라이트·썸네일은 대표 항목에만 있다(CONTENT_SPEC 1절 목록 표).
- 정렬: `display_order` → `period_start desc` → `id desc`. 기술은 `project_skill.display_order` 순.
- 진행 중 = `periodEnd: null`.

`GET /api/projects/{slug}` — 위 필드 전부 + `organization`, `githubUrl`, `serviceUrl`, `sections[{title, bodyMarkdown}]`(display_order 순).

- [x] `ProjectApiTest`: 공개/비공개·대표/비대표 섞인 데이터로 목록 구분과 정렬, 비대표에 `highlights`/`thumbnailUrl` 없음, `adminNote`·`published`·`featured` 필드 없음, 상세 섹션 순서와 다른 소유자 섹션 미포함, 비공개·없는 slug 404.
- [x] `project` 패키지: `Project`, `ProjectHighlight`, `ProjectSkill` 엔티티, 응답 record, `ProjectQueryService`(QueryDSL), `ProjectController`.
- [x] 공용 `content` 패키지: `ContentSection` 엔티티와 `SectionResponse`.

## Task 2 — Blog

`GET /api/blog/posts?page=0&size=20&category={code}&tag={code}`

```json
{"items":[{"slug":"...","title":"...","summary":"...","thumbnailUrl":null,
  "publishedAt":"2025-04-02T00:00:00Z","updatedAt":"...",
  "categories":[{"code":"architecture","name":"아키텍처"}],
  "tags":[{"code":"websocket","name":"websocket"}],
  "skills":[]}],
 "page":0,"size":20,"totalElements":2}
```

- 공개 글만. 정렬 `published_at desc nulls last` → `id desc`. `size`는 1~50으로 보정한다. `category`/`tag`는 code 일치 필터이며 둘 다 주면 AND.
- 화면의 생성일시는 `publishedAt`, 수정일시는 `updatedAt`로 표시한다(관리용 `created_at`은 노출하지 않는다).

`GET /api/blog/posts/{slug}` — 목록 필드 + `sections`.

- [x] `BlogApiTest`: 비공개 글(샘플의 `offline-first-boundary` 상황) 목록 제외와 상세 404, 정렬, 페이지 이동과 `totalElements`, 카테고리·태그 필터, 섹션.
- [x] `blog` 패키지: `BlogPost`, `Category`, `Tag`, `BlogCategory`, `BlogTag`, `BlogSkill`, 응답 record, `BlogQueryService`, `BlogController`.

## Task 3 — Profile

`GET /api/profile`

```json
{"headline":"...","shortBio":"...","imageUrl":null,"githubUrl":"...","email":"...",
 "careers":[{"company":"...","role":"...","periodStart":"...","periodEnd":null,"description":"..."}],
 "skillGroups":[{"group":"PRIMARY","skills":[...]}],
 "sections":[{"title":"...","bodyMarkdown":"..."}]}
```

- 프로필은 단일 행(가장 작은 id). 없으면 404.
- 경력 정렬: `display_order` → `period_start desc` → `id`.
- 스킬 그룹 순서는 `PRIMARY`, `PROJECT_EXPERIENCE`, `LEARNING`, `COLLABORATION` 고정이고 비어 있는 그룹은 생략한다. 그룹 표시명은 프론트에서 정한다(CONTENT_SPEC 4절 후속 설계).
- 이메일 노출은 CONTENT_SPEC 4절 기본 정보에 따른다.

- [x] `ProfileApiTest`: 404, 경력 정렬, 그룹 순서·빈 그룹 생략, 섹션.
- [x] `profile` 패키지: `Profile`, `Career`, `ProfileSkill`, 응답 record, `ProfileQueryService`, `ProfileController`.

## 완료 기준

- `./gradlew clean test bootJar` 통과(로컬 docker DB).
- API_DESIGN의 Implemented Endpoints에 계약 기록, 세션 문서 갱신.
- 커밋 단위: `feat: open swagger in local profile`, `feat: public project/blog/profile read APIs`.

## 결과 — 2026-09-16

사용자 로컬 실행(13:46 KST): `./gradlew clean test bootJar` 성공, 전체 18건 통과. 추가된 테스트: ProjectApiTest 5, BlogApiTest 4, ProfileApiTest 2, SwaggerAccessTest 1.

- 계획과 다른 점: 공용 테스트 기반 `support/ApiTestSupport`를 두었다. `profile_skill.skill_group`은 enum 대신 text로 매핑하고 조회 시 `SkillGroup`으로 바꾼다(스키마 검증을 단순하게 유지). 섹션 조회는 `content/SectionQuery`로 공용화했다.
- 테스트는 구현과 함께 작성해 구현 전 실패 단계는 관찰하지 않았다.
- 미검증: 실제 Swagger UI 화면(테스트는 `/v3/api-docs`만 확인), `bootRun` 기동, 샘플 콘텐츠 실데이터 조회.
