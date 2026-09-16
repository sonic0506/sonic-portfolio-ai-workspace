# Next Actions

Last Updated: 2026-09-16

## 현재 기준

전체 MVP 및 월 10만 원 예산은 유지한다. ADR-0001~0009는 Accepted다. 콘텐츠 모델·ERD 초안과 샘플 RAG 평가는 완료되어 다시 선정하지 않는다.

## Priority 1 — 공개 조회 API 구현 계획

첫 백엔드 계획(FIRST_BACKEND_IMPLEMENTATION)의 Task 1·2는 2026-09-16 완료·커밋했다. 계획 문서의 후속 순서를 따른다.

1. DATA_MODEL, CONTENT_SPEC, ADR-0005와 `samples/`를 읽고 **프로젝트/블로그/프로필 공개 조회 API** 구현 계획을 `docs/04-plans/`에 새로 작성한다. 목록/상세 응답 필드, 대표 여부 구분, 정렬 키, 공개 범위 필터(비공개 제외, 공개→비공개 링크 필터)를 수용 기준으로 적는다.
2. 테스트 데이터는 `samples/`의 프로젝트·블로그를 SQL 또는 테스트 픽스처로 넣는다. 비공개 블로그(`offline-first-boundary`)가 목록·상세·연관 문서에 나오지 않는지 검증한다.
3. `skill` 구현 방식(엔티티 + QueryDSL + record 응답, `@Transactional` 테스트 격리)을 따르고 `SecurityConfig`의 익명 허용 목록에 공개 GET 경로만 추가한다.
4. 로컬 실행: DB가 5433에 떠 있는지 `docker ps`로 확인한 뒤 `./gradlew clean test bootJar`를 실행한다. 사용자 Mac에는 `docker compose`(v2)가 없으니 DB 기동 방법은 사용자에게 확인한다.
5. 선택: `bootRun` 기동 확인, Swagger 경로의 익명 허용 여부 결정(현재 차단).

## 해당 기능 착수 시

- Admin 인증: 허용 GitHub 계정 식별자와 세션/CORS/CSRF 정책. 계정은 그때 확인한다.
- Chat: 질문 제한 집계 기준/기간/수치/해제 설정, 이력 보관·복원·만료·삭제 및 컨텍스트 상한. 정책 결정 후 관련 스키마를 확정한다.
- Graph: 라이브러리와 Skill/Category 노드 매핑. Document Relation 기준 ID·방향성은 ADR-0005를 유지한다.
- 이미지 업로드: S3 접근 정책과 리전. Markdown 본문 저장 위치는 이미 content_section.body_markdown으로 정했다.
- 색인: 원본 변경/삭제 시 동기화, 실패 재시도 및 중복 실행을 검증한다. 공개 범위는 ADR-0005의 조회 시점 필터를 유지한다.
- 배포: Vercel 무료 조건과 저장소 연결, Lightsail/RDS 사설 연결, 메모리 부하와 실제 비용을 검증한다.

## 남은 검증과 콘텐츠 확인

- pgvector HNSW 검색은 PoC의 메모리 코사인 검색과 별도로 검증한다.
- 세션 평가 RAG-005/006/008/009/010은 구현 후 측정한다.
- 콘텐츠 변경 시 --save로 재측정하고 RAG_MEASUREMENTS에 기록한다. Hybrid search는 도입 확정이 아니다.
- 샘플 front matter의 open_questions와 AI 블로그 초안의 사실·문체를 사용자에게 확인한다.
- 이전 PoC 대화에 노출된 OpenAI API 키의 폐기·재발급 여부는 확인되지 않았다. API 재실행 전 확인한다.

## Recommended Next Session Prompt

> 공통 규칙과 세션 문서를 읽고, DATA_MODEL·CONTENT_SPEC·ADR-0005와 backend/의 skill 구현을 참고해 프로젝트/블로그/프로필 공개 조회 API 구현 계획을 작성하고 진행하자.
