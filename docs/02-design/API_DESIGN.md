# API Design

Status: Draft

API 방식은 [ADR-0008](../03-decisions/ADR-0008-rest-and-chat-sse.md)로 확정했다. 일반 기능은 REST + JSON, 채팅 응답은 SSE를 사용한다. 상세 Endpoint와 payload 계약은 아직 Draft다.

## API Domains

### Public
- Profile read
- Project list/detail
- Blog list/detail
- Category/Tag browse
- Graph read
- Chat

### Admin
- Authentication
- Profile CRUD
- Career/Skill CRUD
- Project CRUD
- Blog CRUD
- Category/Tag CRUD
- Relation CRUD
- RAG index/re-index
- RAG playground

## Contract Principle

- Public read model과 Admin write model을 필요에 따라 분리한다.
- RAG 내부 처리 모델을 Public API에 그대로 노출하지 않는다.
- API 변경 시 본 문서 및 관련 테스트를 함께 수정한다.

## Chat Progress Stream

서버의 실제 처리 단계에 맞춰 상태와 데이터를 전달한다. 아래 이벤트 이름은 계약 초안이다.

| 이벤트 | UI 동작 |
|---|---|
| status | 문서를 찾는 중 / 관련 문서를 확인하는 중 / 답변을 작성하는 중 |
| documents | 검색된 공개 문서의 ID·제목·링크 표시, 문서 기준 중복 제거 |
| answer_delta | 생성된 답변 조각을 순서대로 추가 |
| done | 완료 처리 및 최종 인용 출처 표시 |

검색에서 확인한 문서 목록과 최종 인용 출처는 별개다. 검색 결과가 확보된 뒤 제목을 표시하고, 실제 연관 문서 확장이 있을 때만 추가 검색 상태를 표시한다. 비공개 문서의 제목·ID·링크는 전송하지 않는다.

### 구현 시 구체화 및 검증

- 질문 전송과 SSE 응답 연결 방식, 세션 식별자, 이벤트 payload를 확정한다.
- 오류/취소/연결 끊김의 종료 처리와 재시도 시 중복 생성 방지 정책을 정한다.
- 배포 경로에서 버퍼링 없이 이벤트가 도착하는지 확인한다.
- 상태 → 문서 목록 → 답변 → 완료의 순서, 근거 없음, 비공개 문서 미노출을 검증한다.

## Implemented Endpoints

실제 구현과 테스트가 있는 계약만 적는다. 구현 코드는 `backend/`에 있다.

### GET /api/skills — 공통 기술 목록 (Public, 익명)

- 응답 `200`, JSON 배열. `code` 오름차순.
- 항목: `id`(number), `code`(string, 참조 키), `name`(string, 표시명), `iconKey`(string 또는 `null`)
- `created_at` 등 내부 필드는 노출하지 않는다. 데이터가 없으면 `[]`.

```json
[{"id":1,"code":"java","name":"Java","iconKey":null}]
```

- 검증: `SkillApiTest` (2026-09-16)

### 공통 규칙 (Public 조회)

- 공개 식별자는 `slug`다. 내부 PK, `published`/`featured` 값, `admin_note`, `created_at`은 응답에 넣지 않는다.
- 비공개(`published = false`) 프로젝트·블로그는 목록에서 제외하고 상세는 `404`(Problem Detail JSON)다.
- 날짜는 `YYYY-MM-DD`, 시각은 ISO-8601 UTC. 기간의 `periodEnd: null`은 진행 중·재직 중이다.
- 섹션은 `sections[{title, bodyMarkdown}]`이며 `:::questions` 블록을 포함한 Markdown 원문 그대로다.
- 관련 문서(Relation)는 아직 응답에 없다. Document 색인 구현 시 공개 문서만 추가한다(ADR-0005).
- 인증: 아래 공개 GET 경로와 `/error`만 익명 허용한다. `/api/admin/**`는 관리자(`ROLE_ADMIN`)만 가능하다([ADR-0010](../03-decisions/ADR-0010-admin-authentication.md)).
- Swagger: `local` 프로필에서만 `/swagger-ui.html`, `/v3/api-docs`를 켜고 익명 허용한다(2026-09-16 사용자 결정). 기본 설정은 꺼짐.

### GET /api/projects

`{featured: [...], others: [...]}`. 정렬은 `display_order` → `period_start desc` → `id desc`, 기술은 `project_skill.display_order` 순.

- 공통 필드: `slug, title, summary, periodStart, periodEnd, position, contribution, contributionNote, skills[]`
- `featured` 항목에만 `highlights[]`, `thumbnailUrl`이 있다(CONTENT_SPEC 1절 목록 표).

### GET /api/projects/{slug}

목록 필드 전부 + `organization, githubUrl, serviceUrl, sections[]`.

### GET /api/blog/posts

쿼리: `page`(0부터), `size`(기본 20, 1~50으로 보정), `category`(code), `tag`(code). 둘 다 주면 AND.
응답: `{items: [...], page, size, totalElements}`. 정렬은 `published_at desc nulls last` → `id desc`.

- 항목: `slug, title, summary, thumbnailUrl, publishedAt, updatedAt, categories[{code,name}], tags[{code,name}], skills[]`
- 카테고리는 `display_order` 순, 태그·기술은 code 순.

### GET /api/blog/posts/{slug}

목록 항목 필드 + `sections[]`.

### GET /api/profile

`headline, shortBio, imageUrl, githubUrl, email, careers[], skillGroups[], sections[]`. 프로필이 없으면 `404`.

- `careers[{company, role, periodStart, periodEnd, description}]`: `display_order` → `period_start desc`
- `skillGroups[{group, skills[]}]`: `PRIMARY` → `PROJECT_EXPERIENCE` → `LEARNING` → `COLLABORATION` 고정 순서, 빈 그룹 생략. 표시명은 프론트에서 정한다.

검증: `ProjectApiTest`, `BlogApiTest`, `ProfileApiTest`, `SwaggerAccessTest` (2026-09-16)

## Admin API

인증·세션 규칙은 [ADR-0010](../03-decisions/ADR-0010-admin-authentication.md)을 따른다.

- 로그인: 브라우저로 `GET /oauth2/authorization/github` → GitHub → `/login/oauth2/code/github` → 성공 시 `/api/admin/me`(설정 `app.admin.login-success-url`). 허용되지 않은 계정은 `403`.
- 세션: `JSESSIONID` 쿠키. 변경 요청(POST/PUT/DELETE)은 `XSRF-TOKEN` 쿠키 값을 `X-XSRF-TOKEN` 헤더로 보낸다.
- 오류: 미로그인 `401`, 권한 없음·CSRF 누락 `403`, 입력 검증 실패 `400`, 없음 `404`, 중복·참조 충돌 `409`. 본문은 Problem Detail JSON.

### GET /api/admin/me

`{login, name, avatarUrl}`. `name`은 GitHub 프로필에 이름이 없으면 `null`. 이 요청이 `XSRF-TOKEN` 쿠키를 발급한다.

### POST /api/admin/logout

세션 종료 → `204`.

### Skill 관리

목록은 공개 `GET /api/skills`를 그대로 쓴다.

- `POST /api/admin/skills` → `201` + `SkillResponse`
- `PUT /api/admin/skills/{id}` → `200` + `SkillResponse`
- `DELETE /api/admin/skills/{id}` → `204`. 프로젝트·블로그·프로필에서 참조 중이면 `409`

요청 본문:

```json
{"code":"web-serial","name":"Web Serial API","iconKey":null}
```

- `code`: 필수, 60자 이하, 소문자·숫자와 하이픈(`[a-z0-9]+(-[a-z0-9]+)*`). 다른 기술과 중복이면 `409`
- `name`: 필수, 100자 이하, 앞뒤 공백 제거
- `iconKey`: 선택, 100자 이하, 공백만 있으면 `null`

검증: `AdminAccessPolicyTest`, `AdminSecurityTest`, `CsrfCookieTest`, `SkillAdminApiTest` (2026-09-16)

### 콘텐츠 관리 공통 규칙

- 대상은 내부 `id`로 지정한다(slug는 수정 가능한 값).
- `PUT`은 전체 교체다. 하위 목록(`highlights`, `skillIds`, `sections` 등)은 필수이며 통째로 교체되고, 배열 순서가 표시 순서다. 빈 배열은 모두 삭제.
- 처음 공개(`published: true`)될 때 `publishedAt`이 비어 있으면 현재 시각을 넣는다. 공개 해제 후에도 유지되어 재공개 시 원래 발행일이 남는다.
- 생성·수정 시 `updatedAt`을 현재 시각으로 갱신한다.
- 관리자 응답은 비공개 항목과 `adminNote`, `published`, `featured`, `displayOrder`를 포함한다.

### Project 관리

- `GET /api/admin/projects` → 비공개 포함 목록 `[{id, slug, title, featured, published, displayOrder, periodStart, periodEnd, publishedAt, updatedAt}]`. 정렬은 공개 목록과 같다.
- `GET /api/admin/projects/{id}` → 모든 필드 + `adminNote, publishedAt, createdAt, updatedAt, highlights[], skillIds[], sections[]`
- `POST /api/admin/projects` → `201`, `PUT /api/admin/projects/{id}` → `200`, 둘 다 상세 응답
- `DELETE /api/admin/projects/{id}` → `204`. 하이라이트·기술 연결·섹션도 삭제된다.

요청 본문:

```json
{"slug":"viora","title":"...","summary":"...","organization":null,"position":"개발",
 "contribution":30,"contributionNote":null,"periodStart":"2026-07-01","periodEnd":null,
 "thumbnailUrl":null,"githubUrl":null,"serviceUrl":null,
 "featured":true,"published":false,"displayOrder":0,"adminNote":null,
 "highlights":["..."],"skillIds":[1,2],"sections":[{"title":"개요","bodyMarkdown":"..."}]}
```

- `slug`: 필수, 소문자·숫자·하이픈, 중복 `409`
- `title`·`summary`·`periodStart`: 필수. `contribution`: 0~100
- URL 필드: `http(s)://`로 시작
- `periodEnd`가 `periodStart`보다 이르면 `400`. `skillIds`에 없는 ID나 중복이 있으면 `400`

### Category / Tag 관리

- `GET /api/admin/categories` (`displayOrder`, code 순), `POST` → `201`, `PUT /{id}`, `DELETE /{id}` → `204`
  - 본문 `{code, name, displayOrder}`. 블로그가 사용 중인 카테고리 삭제는 `409`
- `GET /api/admin/tags` (code 순), `POST` → `201`, `PUT /{id}`, `DELETE /{id}` → `204`
  - 본문 `{code, name}`. 사용 중인 태그도 삭제되며 글과의 연결이 함께 지워진다
- code 형식·중복 규칙은 Skill과 같다

검증: `ProjectAdminApiTest`, `TaxonomyAdminApiTest` (2026-09-16)
