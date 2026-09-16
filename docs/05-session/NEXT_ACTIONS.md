# Next Actions

Last Updated: 2026-09-16

## 현재 기준

전체 MVP 및 월 10만 원 예산은 유지한다. ADR-0001~0008은 Accepted다. 콘텐츠 모델·ERD 초안과 샘플 RAG 평가는 완료되어 다시 선정하지 않는다.

## Priority 1 — 첫 백엔드 구현

ADR-0009 버전 기준과 FIRST_BACKEND_IMPLEMENTATION.md를 따른다.

Task 1(서버 기동·Flyway V1)은 2026-09-16 완료·커밋했다. 다음은 **Task 2**다.

1. `cd backend && docker compose up -d --wait`로 로컬 DB를 띄운다(`.env`는 `.env.example` 참고). 실행 방법은 backend/README.
2. `SkillApiTest`를 먼저 작성해 `GET /api/skills`가 404로 실패하는지 확인한다. `java`, `react` 삽입 후 code 오름차순·`createdAt` 미노출, 빈 목록 `200 []`, 중복 code 거부까지 검증한다.
3. DATA_MODEL의 `skill` 테이블(id/code/name/icon_key/created_at)에 맞춘 `Skill` 엔티티와 `SkillController`를 만든다. 생성된 `QSkill`로 조회하고 `SkillResponse` record로 매핑한다. `ddl-auto=validate`가 엔티티 매핑을 실제 스키마와 대조한다.
4. Spring Security가 기본으로 요청을 막을 수 있다. 익명 조회 허용 범위는 이번 API에 한정하고, 관리자 인증 정책은 정하지 않는다(해당 기능 착수 시 결정).
5. `./gradlew clean test bootJar` 통과 후 API_DESIGN에 응답 계약을 기록하고 `feat: expose skill catalog with QueryDSL`로 커밋한다.
6. 가능하면 `bootRun`으로 서버를 띄워 `/api/skills`와 Swagger 접근을 한 번 확인하고 결과를 기록한다.

이전 Boot 3.5의 컴파일 및 임시 DB 스키마 생성 이력은 ADR-0009를 참고한다. OpenAI 호출, Spring AI의 기존 document_chunk 연동, RDS 배포는 별도 검증 대상이다. 프론트 패키지 관리/빌드 도구는 프론트 착수 시 정한다.

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

> 공통 규칙과 세션 문서를 읽고, ARCHITECTURE 4절의 ADR-0009와 FIRST_BACKEND_IMPLEMENTATION을 읽고 첫 백엔드 구현을 진행하자. ADR-0001~0008의 확정 사항을 유지하고 실제 호환성을 확인한 뒤 첫 구현 계획으로 이어가자.
