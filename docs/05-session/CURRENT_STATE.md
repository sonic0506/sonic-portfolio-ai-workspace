# Current State

Last Updated: 2026-09-17

## Current Phase

Roadmap Phase 5(핵심 기능 개발) 진행 중. 백엔드 기반([FIRST_BACKEND_IMPLEMENTATION](../04-plans/FIRST_BACKEND_IMPLEMENTATION.md))과 공개 조회 API([PUBLIC_READ_API_IMPLEMENTATION](../04-plans/PUBLIC_READ_API_IMPLEMENTATION.md))를 로컬에서 검증하고 커밋했다. 관리자 인증(ADR-0010)과 Skill 관리 API도 완료했다. 콘텐츠 관리 CRUD(Project, Blog, Profile, Category/Tag)도 완료했다. 샘플 콘텐츠 시드와 Document 색인(가짜 임베딩으로 검증)도 완료했다. 실제 OpenAI 임베딩으로 개발 DB 샘플 7건 READY를 확인했다(사용자 보고). 검색·답변(채팅) 1차(단일 질문, SSE, 질문 제한)도 구현했다. 실제 OpenAI로 PoC 질문 7개를 재현해 기대 출처 7/7, 근거 부족 거부, 비공개 미노출을 확인했다(RAG_MEASUREMENTS 측정 4). 프로필 slug 결함도 수정했다(77건 통과). 채팅 세션(ADR-0011)도 구현했다(89건 통과). 답하지 못한 질문 보관·안내 문구(ADR-0013)도 구현했다(101건 통과). FAQ(ADR-0014)도 구현하고 실제 모델로 확인했다(측정 6·7, 108건 통과). 백엔드 기능은 여기서 일단락했다. 프론트엔드(ADR-0012) 1단계(pnpm workspace, 포트폴리오 조회·채팅, 어드민 미답변·FAQ·색인)를 완료했다. 같은 날 SSE 버퍼링 방지 헤더, FAQ 판정 단계 분리(ADR-0014 후속 2), 질문 제한 제외 IP를 추가했다(백엔드 111건 통과). 2단계(어드민 콘텐츠 관리)도 사용자 확인을 마쳤다. 같은 날 참고 문서 기능(프로젝트·블로그 연결, 상세의 "참고 문서"/"이 문서를 참고한 문서")을 구현하고 사용자 확인을 마쳤다(백엔드 116건). 다음은 프론트 3단계(디자인·SEO·캐시).

## Confirmed

- 2026-09-17 참고 문서(사용자 결정, ADR-0005 후속 결정): `document_relation`의 `RELATED_TO` 한 종류를 "source가 target을 참고한다"로 정의(스키마 변경 없음). 대상은 프로젝트·블로그만, 비공개는 공개 화면 두 목록에서 제외. 구현: `content/DocumentReferences`, 관리 요청 `references`(필수·전체 교체), 관리 상세 `references`/`referencedBy`, 공개 상세 `references`/`referencedBy`(`{type, slug, title, url}`), 시드는 방향 그대로 저장하고 샘플 상호 중복 기재를 한 방향으로 정리(관계 4건). 어드민 참고 문서 선택기·역참조 목록, 포트폴리오 상세 하단 두 목록. 사용자 Mac 확인: 백엔드 116건 통과, 프론트 test·lint·build 통과(포트폴리오 테스트에 `afterEach(cleanup)` 누락 수정), 어드민·포트폴리오 화면 정상. 개발 DB 샘플 시드 재실행은 미확인.

- 2026-09-17 프론트 1단계(사용자 Mac에서 설치·빌드·테스트, 조회·채팅·어드민 수동 확인 완료): 루트 pnpm workspace, `frontend/portfolio`(Next.js 16.3.5)·`frontend/admin`(Vite 8.3 + React Router 8.4 + TanStack Query + RHF + Zod), Tailwind 4 + shadcn 방식 컴포넌트(레지스트리 차단으로 수동), 개발 서버 프록시, Node ≥22.22. 컨테이너에서 설치·빌드·lint·테스트(4+5건)와 가짜 백엔드 연동(SSE 스트리밍 포함)을 확인했다. 상세는 FRONTEND_IMPLEMENTATION.

- 2026-09-17 FAQ: V3 `faq`·`faq_alias`, FAQ를 RAG 문서로 색인하고 같은 뜻 판단은 모델이 함(측정 5에서 거리 기준 불가 확인), `/api/admin/faqs`, 미답변 질문에서 등록 시 처리됨. 측정 6: 같은 뜻 3개 등록 답변, 다른 뜻·근거 없음 3개 안내 문구.

- 2026-09-17 답하지 못한 질문: 모델 `[[NO_ANSWER]]` 표시(스트림에서 제거) 또는 인용 없음이면 V2 `chat_unanswered_question`에 기록, 부드러운 안내 문구(주제는 모델이 채움), `done.unanswered`, 관리자 목록·처리·삭제, 90일 자동 삭제. 프롬프트가 바뀌어 실제 모델 재측정 필요.

- 2026-09-16 채팅 세션: `/api/chat/sessions`(발급·복원·삭제·질문), 서버 발급 ID+비밀키 해시, 마지막 활동 후 24시간 만료·1시간 정리, 질문 30개, 최근 3턴 전달, 직전 질문을 검색 질의에 추가, 복원 시 공개 출처만. 전체 89건 통과.

- 2026-09-16 채팅 1차: `POST /api/chat`(익명, SSE status/documents/answer_delta/done/error). 공개 문서만 검색·확장, ADR-0007 프롬프트, 인용 번호 기준 출처. 사용자 결정으로 세션 없이 단일 질문, 질문 제한 IP당 하루 20·전체 300(메모리, ADR-0002 후속). 답변 모델은 `CHAT_PROVIDER=openai`일 때만. 전체 77건 통과. 실제 생성 호출은 사용자 로컬에서 7/7 확인.

- 2026-09-16 Document 색인: 관리 변경과 같은 트랜잭션에서 `document` 투영(비공개는 visible=false, 관리자 메모·추천 질문 제외), PoC 청킹 Java 이식(샘플 35청크 일치), 임베딩은 트랜잭션 밖·content hash 확인 후 반영, 실패는 FAILED로 기록, `/api/admin/rag/documents`·`/reindex`. 시드가 Relation 4건을 넣는다. 임베딩 기본 꺼짐(`EMBEDDING_PROVIDER`). 전체 68건 통과. 실제 OpenAI 임베딩은 사용자 로컬에서 7건 READY 확인.

- 2026-09-16 샘플 시드: `bootRun --args='--spring.profiles.active=local --app.seed.samples-dir=../samples'`로 기술·카테고리/태그·프로젝트 3·블로그 3·프로필을 관리 서비스 경유로 upsert. 프로필은 사용자 초안(`samples/profile-draft.md`)에서 `samples/profile.md`로 정리(한 줄 소개 A, 기본 소개글, 고객사 실명). 테스트는 별도 DB `portfolio_test`를 쓴다. 전체 54건 통과. 사용자 확인이 필요한 사실 충돌은 SAMPLE_SEED_IMPLEMENTATION 참고.

- 2026-09-16 콘텐츠 관리 2단계: `/api/admin/blog/posts`(카테고리·태그·기술·섹션 전체 교체), `GET/PUT /api/admin/profile`(단일 행 upsert, 경력·스킬 그룹·섹션). 참조 ID 검사 공용화(`IdChecks`). 전체 52건 통과.

- 2026-09-16 콘텐츠 관리 1단계: `/api/admin/projects`(비공개 포함 목록·상세·생성·전체 교체 수정·삭제), `/api/admin/categories`, `/api/admin/tags`. 첫 공개 시 발행일 기록·공개 해제 후 유지, 하위 목록 전체 교체, slug/code 중복·사용 중 카테고리 삭제 409. 전체 44건 통과. 발행 토글의 `document.visible` 동기화는 색인 단계로 미뤘다.

- 2026-09-16 관리자 인증: GitHub OAuth + 서버 세션 + 쿠키 CSRF(ADR-0010). 허용 계정은 GitHub 숫자 ID `159202139`(login `sonic0506`). 로그인 실패는 403. Skill 관리 `POST/PUT/DELETE /api/admin/skills`. 전체 테스트 34건 통과, 본인 로그인·타 계정 거부를 수동 확인. DevTools 추가.

- 2026-09-16 공개 조회 API: `GET /api/projects`, `/api/projects/{slug}`, `/api/blog/posts`, `/api/blog/posts/{slug}`, `/api/profile`. 비공개 제외·관리자 필드 미노출·정렬·페이지·필터를 테스트했다. 전체 18건 통과. 계약은 API_DESIGN. Relation(관련 문서) 표시는 Document 색인 이후로 미뤘다.

- 2026-09-16 사용자 결정: 개발(local 프로필)에서 Swagger 공개, 로컬 DB는 Docker 유지, OpenAI API 키는 기존 키 사용(이전 대화 노출 이력은 인지된 상태).

- 2026-09-16 Task 2 검증: 로컬 DB에서 `./gradlew clean test bootJar` 성공, 전체 테스트 6건 통과. Hibernate 7 `validate`가 `skill` 엔티티(`Instant` ↔ `timestamptz` 포함)를 실제 스키마와 대조했고, QueryDSL 5.1.0 Jakarta 조회가 Hibernate 7에서 동작했다. 응답 계약은 API_DESIGN의 Implemented Endpoints.

- 2026-09-16 Task 1 검증: 로컬 compose DB(PostgreSQL 17.10/pgvector 0.8.2)에서 전체 테스트 2건 성공. 컨텍스트 기동(API 키 없음), Flyway V1 적용, 테이블 20개·HNSW 1개·`vector(1536)`, 재실행 migrate 0건, bootJar 생성. V1은 DATA_MODEL SQL 10블록과 동일함을 대조했다. 상세는 ADR-0009 마지막 절.

- 현재 서버 기준: 사용자 생성 backend/, Boot 4.1.1 + Gradle Groovy Wrapper 9.7.1 + Java 21 + Spring AI 2.0.1. Swagger 3.1.1 및 QueryDSL 5.1.0 Jakarta 설정. 기존 Maven 검증과 구분한다.

- 2026-09-16: ADR-0009 백엔드 버전 기준 확정. Java 21/Maven 3.9.11/Boot 3.5.16/AI 1.1.8/QueryDSL 5.1.0 컴파일 및 Q 타입 생성 성공. PostgreSQL 17.10/pgvector 0.8.2에서 설계 SQL 20테이블·HNSW 생성 성공. 제품 기동·JPA/AI 실행·RDS 배포는 미검증. 이전 재현용 poc/java-compat는 사용자 요청으로 제거되었다. 이 항목은 Boot 3.5 검증 이력이다.

- 2026-09-16: REST + JSON 및 채팅 SSE를 확정했다(ADR-0008). SSE로 실제 처리 상태, 공개 문서 제목 목록, 답변 조각 및 완료를 표시한다. 상세 API 계약은 Draft다.

- 2026-09-16: 학습 목적으로 Spring AI를 채택하고 Java 21 호환 버전을 사용한다(ADR-0001 추가 결정). Boot 3.5.x / AI 1.1.x를 초기 검토 기준으로 두며 패치 고정과 실제 빌드는 남아 있다.

- 콘텐츠 후속 확인 완료: 공개 상태/대표 여부는 방문자 미노출, 추천 질문은 새 채팅에서 즉시 전송, Blog도 제목+Markdown/추천 질문 블록 사용, Profile 소개글은 별도 짧은 문구로 관리한다.

- 콘텐츠 상세 요구사항을 CONTENT_SPEC에 정리했다: 대표/비대표 목록 구분, Project/Profile 제목+Markdown 섹션, 추천 질문 블록, 공통 기술 목록, Blog 메타정보/내부 글 연결, Profile 스킬 그룹. 추가 확인 항목은 같은 문서에 분리했다.

- RAG 답변 정책은 ADR-0004로 확정했다: 공개 콘텐츠만 사용, 출처 표시, 근거 부족 명시, 세션별 이전 질문/답변 기억 및 세션 간 분리. 저장/보관/복원 방식은 미정이다.

- 배포 구성은 ADR-0003으로 확정했다: Vercel Hobby(Next.js/React), 서울 Lightsail 2GB(Spring Boot), RDS PostgreSQL micro Single-AZ/gp3 20GB. 실제 배포는 시작하지 않았다.

- 핵심 기술 스택: Next.js(Public), React(Admin), Spring Boot(Java 21), JPA/QueryDSL, PostgreSQL/pgvector, OpenAI(LLM), S3. 기준은 ADR-0001이다.
- 구현의 핵심은 RAG이며 콘텐츠는 프론트엔드·백엔드·AI 경험을 모두 전달한다. 프론트엔드는 익숙한 기술, 백엔드는 학습 목적이다.
- 월 운영비 예산은 모든 비용을 포함한 100,000원이다. AWS와 AWS 관리형 DB를 선호한다(ADR-0002).
- 관리자 로그인은 GitHub 본인 계정만 허용한다. 챗봇 질문 횟수 제한을 적용하되 설정으로 쉽게 비활성화하고 수치를 변경할 수 있게 한다.

- MVP는 REQUIREMENTS의 전체 기능을 1차 배포에 포함한다(2026-09-09 사용자 결정). Graph View, Relation 관리/확장, RAG Playground도 포함한다. 기존 Out of Scope는 유지한다.

- Public 블로그 & 포트폴리오와 Admin 페이지로 구성한다.
- Public 핵심 기능은 Profile, Projects, Blog, Graph View, RAG Chatbot이다.
- Admin에서 모든 콘텐츠와 Relation, RAG Index를 관리한다.
- Blog는 Markdown 기반을 지향한다.
- 하나의 Blog는 여러 Category에 속할 수 있다.
- Project/Blog 작성 시 연관 문서를 선택해 연결 관계를 관리한다.
- 서로 다른 Business Data를 공통 Document Layer로 변환해 RAG에서 사용한다.
- Vector Search + Document Relation 기반 Context 확장 구조를 지향한다.
- Codex와 Claude Code 모두 `docs/`를 SSOT로 사용한다.

## Sample Content — 2026-09-09

- 사용자가 대표 프로젝트 3건(비오라 / 유진로봇 / 싱크마스터)의 상세 기술서를 제공했다. `samples/projects/`에 CONTENT_SPEC 형식으로 저장했다.
- 블로그 3편은 프로젝트 내용에서 파생한 AI 작성 샘플 초안이다(`sample: true`). 사용자 문체와 사실 확인 전이며 실제 발행분이 아니다.
- `blog/offline-first-boundary.md`는 RAG 공개 범위 필터 검증(RAG-007)을 위해 의도적으로 비공개(Draft)로 뒀다. 공개 글이 이 글을 Relation으로 참조한다.
- 추천 질문 블록은 `:::questions` 본문 인라인 문법으로 확정했다(ADR-0005).
- 샘플로 확인된 데이터 모델 공백 8건은 `samples/README.md`에 정리했다. 소속 필드, 기여도 주석, 진행 중 상태, 목록 정렬 키, 관리자 전용 메모, 공개→비공개 링크 필터 시점, 섹션-청크 불일치, Skill 참조 키 분리이다.

## Data Model — 2026-09-09

- 샘플 콘텐츠 기준 ERD 초안을 DATA_MODEL에 작성했다. 테이블 구성에 샘플에서 식별한 공백 8건을 모두 반영했다.
- 두지 않기로 한 테이블과 이유를 함께 기록했다: `admin_user`(허용 계정 1개는 설정값), `suggested_question`(본문 인라인), `chat_usage`(집계 규칙 미정), `document_index_job`(상태 컬럼으로 충분).
- `TROUBLESHOOTING`을 document_type에서 제외했다. 샘플에서 독립 원본이 아니라 프로젝트의 한 섹션이었다.
- ADR-0005(Accepted)에 세 결정을 기록했다: 섹션 단일 테이블 + 추천 질문 본문 인라인, Relation 기준 = Document ID, 공개 범위 필터 = 조회 시점.
- ADR-0005는 2026-09-09 사용자가 그대로 채택해 **Accepted**다.
- `vector(1536)`과 `text-embedding-3-small`은 ADR-0006으로 확정했다.

## RAG PoC — 2026-09-09

- `poc/rag_eval.py`로 청킹 경계를 실측했다. 의존성 없는 표준 라이브러리 스크립트이며 `chunks` / `selftest`는 API 키 없이 실행된다.
- **측정 결과 기존 가정이 틀렸다.** 가장 긴 섹션이 647자라 섹션을 길이 때문에 쪼갤 일은 없었다. 실제 문제는 200자 미만 짧은 섹션 11개였다.
- 짧은 섹션을 병합하면 46 → 35청크(최소 205 / 중앙 367 / 최대 821자)가 되고, 이 중 9개가 두 개 이상 섹션에 걸친다.
- 이에 따라 DATA_MODEL의 `document_chunk.section_title`을 `section_titles text[]`로 수정했다.
- selftest가 관리자 필드 제외, 추천 질문 블록 제거, 비공개 문서 검색 제외(RAG-007)를 assert로 확인한다.
- 사용자가 제공한 키로 검색 평가를 실행했다. **기대 출처 포함 7/7**, 임베딩 차원 실측 1536이다.
- 비공개 문서가 7개 질문의 상위 결과에 한 번도 등장하지 않았다. ADR-0005의 조회 시점 필터가 검색 단계에서 검증됐다(RAG-007).
- **근거 부족은 유사도 임계값으로 판정할 수 없다.** 근거 있는 질문 최저 0.372 대 근거 없는 질문 0.342로 간격이 0.030이다. 생성 단계가 판단해야 한다.
- 기술명 조회("React Native" 0.372)가 가장 약해 Hybrid search를 검토 대상으로 올렸다.
- 위 내용은 ADR-0006(Accepted)에 기록했다.
- 2026-09-10 답변 생성까지 측정했다. `gpt-4.1-mini` / `temperature 0` / 상위 5건 전달로 질문 7개 모두 기대대로 동작했다.
- OAuth 질문에서 근거 5건을 받고도 "근거에 등록되어 있지 않습니다"로 거부했다. ADR-0006 결정 3(임계값 대신 생성 단계 판정)의 전제가 검증됐다.
- 비공개 글 주제와 거의 같은 질문에서도 답변이 공개 원본만 사용했다. RAG-007이 생성 단계까지 통과했다.
- viora 원문의 "단독 담당" / "논의 참여" 구분이 답변에서 보존됐다.
- 생성 모델과 프롬프트 정책은 ADR-0007(Accepted)에 기록했다.
- **ADR-0006과 ADR-0007은 2026-09-10 사용자가 채택해 Accepted다.** RAG 파이프라인의 모델·검색·답변 정책이 모두 측정 근거와 함께 확정됐다.
- ADR-0001~0007이 모두 Accepted다. 다만 **이것이 개발 설계 완료를 뜻하지는 않는다.**
- ARCHITECTURE / DATA_MODEL / RAG_DESIGN / API_DESIGN / GRAPH_DESIGN이 모두 아직 `Draft`다. CURRENT_PLAN은 구현 착수 전 남은 빌드/버전 해소를 요구하며 인증·Graph·S3 상세는 해당 기능 착수 시 정한다.
- 미확정으로 남은 것: Admin 도메인/CORS 값, Graph 라이브러리, S3 이미지 정책, Spring AI 연동 검증. 백엔드 버전·빌드 도구는 ADR-0009로 확정했다.
- 비용은 계산만 했고 실제 배포·청구는 미검증이다. Spring AI/pgvector 버전 호환성도 미검증이다.
- 다만 Hybrid search는 검토 대상 승격까지이며 도입 확정이 아니다. Spring AI 채택은 확정되었고 버전 호환성은 실제 빌드에서 검증해야 한다.
- 실측값은 `docs/06-testing/RAG_MEASUREMENTS.md`가 기준 문서다. 다른 문서는 수치를 복제하지 않고 링크한다.
- 하네스에 `--save`를 추가해 이후 실행은 `poc/results/<날짜>-<명령>.json`에 원본을 남긴다. 측정 2·3은 도입 전 실행이라 로그에서 옮긴 값이다.

## Not Yet Decided

- Admin 프론트 도메인과 CORS 허용 출처(ADR-0010 4절)
- Deployment implementation / domains / engine versions
- Spring AI 버전·연동 검증 및 제품 RAG 통합 방식(생성·임베딩 모델은 확정)
- Expected traffic (질문 제한 초기값은 ADR-0002 후속 결정)
- 프론트 캐시·재검증 정책과 어드민 배포 위치 / S3 policy (백엔드 버전은 ADR-0009, Markdown은 content_section.body_markdown)
- Graph visualization library
- Exact DB schema — 초기 스키마는 V1 마이그레이션으로 적용. 세션·사용량 관련 테이블은 정책 결정 후 새 마이그레이션으로 추가
- Exact API contract

## Implementation State

- Application code: `backend/` — 진입점, 설정(`application*.properties`), `compose.yaml`, Flyway V1, `skill`·`project`·`blog`·`profile`·`content` 패키지(엔티티는 연관관계 없이 FK id 매핑, QueryDSL 조회 서비스, record 응답), `admin` 패키지(허용 판정, OAuth 사용자 서비스, `/api/admin/me`), Skill 관리 서비스·컨트롤러, Project·Blog·Profile·Category/Tag 관리 서비스·컨트롤러, `content/SectionWriter`·`IdChecks`, `config/QuerydslConfig`, `config/SecurityConfig`(공개 GET·`/error` 익명, local Swagger, `/api/admin/**` 관리자, 쿠키 CSRF, CORS 설정값), `config/ApiExceptionHandler`. `seed` 패키지(local 전용), `rag` 패키지(투영·청킹·색인·관리 API), `chat` 패키지(검색·생성·SSE·질문 제한·세션). 테스트 116건(`portfolio_test` DB). 마이그레이션 V1~V3. `faq` 패키지 추가. OpenAI 모델 자동 구성은 꺼져 있다.
- Frontend: 루트 `package.json`·`pnpm-workspace.yaml`, `frontend/portfolio`(페이지·Markdown·채팅 위젯·상세 참고 문서 목록), `frontend/admin`(로그인 확인·미답변·FAQ·색인 상태·콘텐츠 관리·참고 문서 선택).
- 미검증: `bootRun` 서버 프로세스, Swagger UI 화면, 샘플 콘텐츠 실데이터 적재·조회, Spring AI 호출, RDS 배포.
- 로컬 환경 참고: 로컬 DB는 Docker로 운영한다(사용자 결정). 사용자 Mac의 docker에는 `docker compose`(v2) 명령이 없어 2026-09-16 테스트는 이미 떠 있던 5433 DB로 실행했다.
- Project documentation bootstrap: Created. 2026-09-16 기준 미커밋 변경 없음
- Sample portfolio content: 대표 프로젝트 3건(사용자 제공) + 블로그 3편(AI 샘플 초안, 1편 비공개) + 공통 Skill 목록을 `samples/`에 정리
- RAG PoC: 구현 및 샘플 평가 완료. 제품 색인은 구현 완료(가짜 임베딩). pgvector HNSW 검색과 세션 기능은 미구현·미검증.

## Important Notes

- 생성 모델 gpt-4.1-mini와 임베딩 text-embedding-3-small은 확정했다. Spring AI 버전·연동 검증, 제품 버전 호환성, 세션 보관 정책은 미정이다. 샘플 품질 측정은 RAG_MEASUREMENTS를 따른다.

- DB 추가 절약 비교: Vercel + Lightsail 4GB 앱/DB 직접 운영 약 56,100원, 2GB 통합 약 36,300원(PoC 후보). 운영/백업 책임과 성능 미검증을 비용 제안서에 기록했으며 관리형 DB 선호는 변경하지 않았다.

- Vercel Hobby + Lightsail 2GB + RDS micro 구성을 채택했다. 비용 가정 기준 약 70,736원이며 개인 비상업적 이용/무료 한도 조건이 있다.

- 비용 비교 이력은 `docs/02-design/AWS_COST_PROPOSAL.md`, 최종 채택 구성은 ADR-0003을 따른다. 실제 배포/성능은 미검증이다.

새 세션에서는 기술 스택을 기존 결정처럼 가정하지 말고 ADR 여부를 먼저 확인한다.

## Initial Analysis — 2026-09-09 (과거 이력)

- 저장소 파일과 요구사항/설계/계획/테스트 문서를 대조했다. 애플리케이션 코드와 실행 가능한 테스트는 없다. 이후 사용자 기술 선택을 ADR-0001에 기록했다.
- 구현 전 검토할 설계 공백: Draft/비공개 데이터의 검색·Graph·Relation 확장 제외 정책, 삭제/발행 취소와 색인의 동기화 및 실패 복구, Relation 기준 ID와 방향/중복 정책.
- Graph의 Skill/Category 노드 후보와 Document type 후보 사이의 매핑은 미정이다.
- 초기 분석 이후 사용자 결정으로 MVP 전체 기능 포함과 핵심 기술 스택을 확정했다. 배포/인증 등 상세 결정은 남아 있다. 상세 이력은 SESSION_LOG를 참고한다.
