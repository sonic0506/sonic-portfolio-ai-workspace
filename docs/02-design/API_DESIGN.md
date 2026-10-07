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
- Relation CRUD — 프로젝트·블로그 관리 요청의 `references`로 편집(2026-09-17)
- RAG index/re-index
- RAG playground

## Contract Principle

- Public read model과 Admin write model을 필요에 따라 분리한다.
- RAG 내부 처리 모델을 Public API에 그대로 노출하지 않는다.
- API 변경 시 본 문서 및 관련 테스트를 함께 수정한다.

## Chat Progress Stream

서버의 실제 처리 단계에 맞춰 상태와 데이터를 전달한다. 1차 구현(단일 질문, 세션 없음)의 계약은 아래 "구현된 계약"을 따른다.

| 이벤트 | UI 동작 |
|---|---|
| status | 문서를 찾는 중 / 관련 문서를 확인하는 중 / 답변을 작성하는 중 |
| documents | 검색된 공개 문서의 ID·제목·링크 표시, 문서 기준 중복 제거 |
| answer_delta | 생성된 답변 조각을 순서대로 추가 |
| done | 완료 처리 및 최종 인용 출처 표시 |

검색에서 확인한 문서 목록과 최종 인용 출처는 별개다. 검색 결과가 확보된 뒤 제목을 표시하고, 실제 연관 문서 확장이 있을 때만 추가 검색 상태를 표시한다. 비공개 문서의 제목·ID·링크는 전송하지 않는다.

### 구현된 계약 — 2026-09-16 (단일 질문)

`POST /api/chat` — 익명, CSRF 제외. 요청 `{"question": "..."}`(1~500자), 응답 `text/event-stream`.

스트림 시작 전 오류(JSON Problem Detail): `400` 질문 검증, `503` 임베딩·생성 모델 꺼짐, `429` 하루 질문 제한 초과(IP당 20, 전체 300 — `CHAT_LIMIT_*`로 변경·해제). `CHAT_LIMIT_EXEMPT_IPS`(쉼표 구분)의 IP는 제한·집계에서 제외한다(2026-09-17 사용자 요청). 로컬에서는 개발 서버 프록시를 거쳐 모든 요청이 `127.0.0.1`로 보인다.

| 이벤트 | data | 비고 |
|---|---|---|
| `status` | `{"stage":"SEARCHING"\|"EXPANDING"\|"ANSWERING"}` | EXPANDING은 공개 연관 문서가 있을 때만 |
| `documents` | `{"documents":[{type, slug, title, url}]}` | 검색 결과(문서 단위 중복 제거), 확장 시 추가분을 한 번 더 |
| `answer_delta` | `{"text":"..."}` | 생성 조각 순서대로 |
| `done` | `{"sources":[{type, slug, title, url}], "unanswered": bool}` | 답변에 나온 `[n]` 번호의 문서만. 없으면 `[]`. `unanswered`는 근거 부족으로 질문이 보관됐는지(ADR-0013) |
| `error` | `{"message":"..."}` | 처리 중 오류. 내부 오류 내용은 넣지 않는다 |

- `url`: `/projects/{slug}`, `/blog/{slug}`, `/profile`. 내부 ID는 보내지 않는다.
- 응답 헤더 `Cache-Control: no-cache, no-transform`, `X-Accel-Buffering: no` — 압축·프록시가 이벤트를 모아 보내지 않게 한다(세션 질문 SSE도 같음, 2026-09-17).
- 검색: 코사인 거리 상위 5청크(공개 문서만), 연관 공개 문서 최대 2건에서 질문과 가장 가까운 청크 1개씩 추가.
- 근거가 없어도 생성은 호출한다(ADR-0007). 답변의 `[n]`은 근거 청크 번호다.

검증: `ChatApiTest`, `ChatRateLimiterTest` (2026-09-16)

### 구현 시 구체화 및 검증

- 질문 전송과 SSE 응답 연결 방식, 세션 식별자, 이벤트 payload를 확정한다.
- 오류/취소/연결 끊김의 종료 처리와 재시도 시 중복 생성 방지 정책을 정한다.
  - 클라이언트 쪽은 [ADR-0016](../03-decisions/ADR-0016-chat-sse-client-fetch-stream.md)로 정했다: fetch 스트림으로 받고, 자동 재연결·재전송 없음(사용자 "다시 시도"만), `done` 없이 끝나면 받은 데까지 완료, 취소는 `AbortController`.
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
- 프로젝트·블로그 상세는 `references`(이 문서가 참고한 문서)와 `referencedBy`(이 문서를 참고한 문서)를 준다. 항목은 `{type: "PROJECT"|"BLOG", slug, title, url, category}`이며(`category{code,name,color}`는 블로그만, 프로젝트는 null — 2026-09-29) 공개 문서만, 등록 순서대로다(ADR-0005 후속 결정, 2026-09-17).
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

- 항목: `slug, title, summary, thumbnailUrl, publishedAt, updatedAt, category{code,name,color}, tags[{code,name}], skills[]`
- 카테고리는 글마다 하나다(ADR-0005 후속 3, 2026-09-29). 태그·기술은 code 순.

### GET /api/blog/categories

`[{code, name, color, postCount}]`. 카테고리 `display_order` → code 순. `postCount`는 공개 글 수이며 0인 카테고리도 준다(2026-09-29, 포트폴리오 사이드바용).

### GET /api/blog/posts/{slug}

목록 항목 필드 + `sections[]`.

### GET /api/graph

그래프 전체(ADR-0015). `{nodes:[{id, type, key, title, url, summary, color, periodStart, periodEnd, publishedAt, tags}], edges:[{source, target, kind}]}`. 
`id`는 `project:{slug}`·`blog:{slug}`·`category:{code}`·`skill:{code}`, `kind`는 `REFERENCE`(source가 target을 참고)·`SKILL`(문서 → 스킬)·`CATEGORY`(블로그 → 카테고리). 공개 문서만, 카테고리·스킬은 공개 문서가 쓰는 것만. 형태와 순서는 [GRAPH_DESIGN](GRAPH_DESIGN.md) 4절.

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
 "highlights":["..."],"skillIds":[1,2],"sections":[{"title":"개요","bodyMarkdown":"..."}],
 "references":[{"type":"BLOG","id":3}]}
```

- `slug`: 필수, 소문자·숫자·하이픈, 중복 `409`
- `title`·`summary`·`periodStart`: 필수. `contribution`: 0~100
- URL 필드: `http(s)://`로 시작
- `periodEnd`가 `periodStart`보다 이르면 `400`. `skillIds`에 없는 ID나 중복이 있으면 `400`

### 참고 문서 (프로젝트·블로그 공통, ADR-0005 후속 결정)

- 요청 `references: [{"type":"PROJECT"|"BLOG","id":1}]` — 이 문서가 참고하는 문서(나가는 연결). 필수이며 전체 교체, 배열 순서가 표시 순서다.
- 없는 대상, 중복, 자기 자신, 다른 type이면 `400`. 비공개 대상도 연결할 수 있다(공개 화면에서만 제외).
- 관리자 상세 응답 `references[]`, `referencedBy[]` — 항목 `{type, id, slug, title, published}`. `referencedBy`는 읽기 전용이며 상대 문서에서 편집한다.
- 문서를 삭제하면 양방향 연결이 함께 지워진다(FK cascade).
- 공개 상세는 `references[]`, `referencedBy[]` — 항목 `{type, slug, title, url}`, 공개 문서만.

### Category / Tag 관리

- `GET /api/admin/categories` (`displayOrder`, code 순), `POST` → `201`, `PUT /{id}`, `DELETE /{id}` → `204`
  - 본문 `{code, name, displayOrder, color, ragEnabled}`. `color`는 필수 `#RRGGBB`이며 대문자로 저장한다(2026-09-29). `ragEnabled`는 그 카테고리 글을 채팅 근거로 쓸지이며 생략하면 생성 시 `true`, 수정 시 기존 값 유지(ADR-0018, 2026-10-05). 블로그가 사용 중인 카테고리 삭제는 `409`
- `GET /api/admin/tags` (code 순), `POST` → `201`, `PUT /{id}`, `DELETE /{id}` → `204`
  - 본문 `{code, name}`. 사용 중인 태그도 삭제되며 글과의 연결이 함께 지워진다
- code 형식·중복 규칙은 Skill과 같다

검증: `ProjectAdminApiTest`, `TaxonomyAdminApiTest` (2026-09-16)

### Blog 관리

- `GET /api/admin/blog/posts` → 비공개 포함 `[{id, slug, title, published, publishedAt, updatedAt}]`. 초안(`publishedAt` 없음) 먼저, 이후 최신순.
- `GET /api/admin/blog/posts/{id}` → 모든 필드 + `adminNote, publishedAt, createdAt, updatedAt, categoryId, tagIds[], skillIds[], sections[]`
- `POST` → `201`, `PUT /{id}` → `200`, `DELETE /{id}` → `204`(연결·섹션도 삭제)

```json
{"slug":"websocket-binary-video","title":"...","summary":null,"thumbnailUrl":null,
 "published":false,"adminNote":null,
 "categoryId":1,"tagIds":[2,3],"skillIds":[4],"sections":[{"title":"...","bodyMarkdown":"..."}],
 "references":[{"type":"PROJECT","id":1}]}
```

- slug 규칙·중복 `409`와 발행일 규칙은 Project와 같다.
- `categoryId`는 필수(없으면 `400`). `categoryId`·`tagIds`·`skillIds`에 없는 ID나 중복이 있으면 `400`.

### Profile 관리

- `GET /api/admin/profile` → 프로필이 없으면 `404`
- `PUT /api/admin/profile` → 첫 호출이 프로필을 만들고 이후에는 같은 행을 교체한다(항상 1건). `200` + 상세

```json
{"headline":"...","shortBio":"...","imageUrl":null,"githubUrl":"https://github.com/sonic0506","email":null,
 "careers":[{"company":"...","role":"...","periodStart":"2021-02-01","periodEnd":null,"description":null}],
 "skills":[{"skillId":1,"group":"PRIMARY"}],
 "sections":[{"title":"소개","bodyMarkdown":"..."}]}
```

- 응답은 위 요청 모양에 `id, updatedAt`을 더한 것이다.
- `headline`·`shortBio` 필수. `email` 형식 검증.
- 경력 기간 역전 `400`. `group`은 `PRIMARY | PROJECT_EXPERIENCE | LEARNING | COLLABORATION`만 허용. 없는 기술 ID나 같은 기술 중복은 `400`.
- 배열 순서가 경력·스킬(그룹 안)·섹션의 표시 순서다.

검증: `BlogPostAdminApiTest`, `ProfileAdminApiTest` (2026-09-16)

### RAG 색인 관리

색인 규칙은 [DOCUMENT_INDEX_IMPLEMENTATION](../04-plans/DOCUMENT_INDEX_IMPLEMENTATION.md)을 따른다.

- `GET /api/admin/rag/documents` → `[{id, type, sourceId, title, visible, indexStatus, indexError, indexedAt, chunkCount}]`
  - `type`: `PROJECT | BLOG | PROFILE`, `indexStatus`: `PENDING | INDEXING | READY | FAILED`
- `POST /api/admin/rag/reindex` → `{embeddingEnabled, indexed, failed, skipped, documents[]}`
  - `PENDING`/`FAILED` 문서를 색인한다. `?rebuild=true`면 모든 원본을 다시 투영하고 전부 다시 색인한다.
  - 임베딩이 꺼져 있으면(`embeddingEnabled: false`) 투영만 하고 색인은 하지 않는다.
  - 동기 실행이다(현재 문서 수십 건 규모).
- 관리 API로 콘텐츠를 생성·수정·삭제하면 같은 트랜잭션에서 문서가 갱신되고, 커밋 후 임베딩이 켜져 있으면 백그라운드로 색인된다.

검증: `DocumentProjectionTest`, `DocumentIndexerTest`, `SampleIndexTest` (2026-09-16)

### 채팅 세션 (ADR-0011)

인증 없음, CSRF 제외. 비밀키는 헤더 `X-Chat-Session-Key`. 없는 세션·만료·키 불일치는 모두 `404`.

- `POST /api/chat/sessions` → `201 {sessionId, sessionKey, expiresAt}` — 키는 이때만 받는다. 클라이언트는 localStorage에 둘 다 저장한다.
- `GET /api/chat/sessions/{sessionId}` → `{sessionId, expiresAt, messages:[{role: USER|ASSISTANT, content, sources:[{type, slug, title, url}], createdAt}]}` — 출처는 현재 공개 문서만
- `DELETE /api/chat/sessions/{sessionId}` → `204`
- `POST /api/chat/sessions/{sessionId}/messages` `{question}` → SSE(단일 질문과 같은 이벤트). `400` → `503` → `404` → `409`(질문 30개) → `429`
- 만료: 마지막 질문 후 24시간. `404`를 받으면 새 세션을 만든다. 1시간마다 만료 세션 삭제.
- 후속 질문: 검색 질의에 직전 질문을 붙이고, 최근 3턴을 `<이전 대화>`로 프롬프트에 넣는다(이력은 질문 해석에만 사용).

검증: `ChatSessionApiTest` (2026-09-16)

### 답하지 못한 질문 관리 (ADR-0013)

- `GET /api/admin/chat/unanswered?status=OPEN|RESOLVED|IGNORED&page=0&size=20` → `{items, page, size, totalElements}` 최신순. 항목: `id, question, answer, reason(NO_EVIDENCE|NO_CITATION), retrieved[{type, slug, title, distance}], status, adminNote, inActiveSession, createdAt, handledAt`
- `PUT /api/admin/chat/unanswered/{id}` `{status, adminNote}` → 항목. RESOLVED/IGNORED로 바꾸면 `handledAt` 기록, OPEN이면 비움
- `DELETE /api/admin/chat/unanswered/{id}` → `204`
- 90일 지난 기록은 자동 삭제(`CHAT_UNANSWERED_RETENTION_DAYS`). `retrieved.distance`는 코사인 거리(작을수록 가까움)로, 자료가 있는데 못 찾았는지 판단하는 데 쓴다.

검증: `UnansweredQuestionTest`, `NoAnswerMarkerTest` (2026-09-17)

### FAQ 관리 (ADR-0014)

- `GET /api/admin/faqs` → `[{id, question, answer, published, displayOrder, indexStatus, createdAt, updatedAt}]`(순서, id 순)
- `POST /api/admin/faqs` → `201`, `PUT /api/admin/faqs/{id}` → `200`, `DELETE /api/admin/faqs/{id}` → `204`
- 본문 `{question(1~300자), answer(1~3000자), published, displayOrder, fromUnansweredId?}`. `fromUnansweredId`가 있으면 그 미답변 질문을 RESOLVED로 바꾸고 메모에 "FAQ #n 등록"을 남긴다(없는 ID면 `400`).
- 저장 시 RAG 문서(`FAQ`, 제목 "자주 묻는 질문: {질문}")로 투영되고 색인된다. 채팅 검색에 FAQ가 걸리면 먼저 같은 질문인지 판정하고(ADR-0014 후속 결정 2), 같으면 생성 없이 등록 답변을 `answer_delta` 한 번으로 보낸다. 출처는 `{type: "FAQ", slug: "faq-{id}", url: null}`이다.

검증: `FaqAdminApiTest` (2026-09-17), RAG_MEASUREMENTS 측정 6
