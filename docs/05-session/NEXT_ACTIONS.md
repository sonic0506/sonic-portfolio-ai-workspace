# Next Actions

Last Updated: 2026-09-16

## 현재 기준

전체 MVP 및 월 10만 원 예산은 유지한다. ADR-0001~0009는 Accepted다. 콘텐츠 모델·ERD 초안과 샘플 RAG 평가는 완료되어 다시 선정하지 않는다.

## Priority 1 — 관리자 인증과 CRUD

공개 조회 API(PUBLIC_READ_API_IMPLEMENTATION)는 2026-09-16 완료·커밋했다. Roadmap Phase 5 순서상 다음은 "기반 프로젝트 / 인증 → Admin CRUD"다.

1. **먼저 사용자에게 확인한다:** 허용할 GitHub 계정 식별자(로그인 ID 또는 숫자 ID), 세션 방식(서버 세션 쿠키 권장 여부), Admin 프론트 도메인과 CORS/CSRF 정책. 결정은 ADR로 기록한다(COMMON_RULES 8절).
2. GitHub OAuth App 등록은 사용자가 직접 한다. Client ID/Secret은 `backend/.env`에만 둔다.
3. 결정 후 `docs/04-plans/`에 Admin 인증 + Skill/Project CRUD 구현 계획을 작성한다. 발행 토글 시 `document.visible` 동기화(ADR-0005)는 Document 색인 계획에서 다루되, CRUD 계획에 연결 지점을 적는다.
4. 대안(인증 결정이 늦어질 때): 샘플 콘텐츠(`samples/`)를 로컬 DB에 넣는 시드 스크립트를 만들어 공개 API와 Swagger 화면을 실데이터로 확인한다.

로컬 실행: DB는 Docker(`docker ps`로 5433 확인) → `./gradlew clean test bootJar`. Swagger는 `bootRun --args='--spring.profiles.active=local'` 후 `/swagger-ui.html`.

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
- OpenAI API 키는 기존 키를 사용한다(2026-09-16 사용자 결정). 사용량 이상 시 재발급을 검토한다.

## Recommended Next Session Prompt

> 공통 규칙과 세션 문서를 읽고, 관리자 인증 결정 사항을 사용자에게 확인한 뒤 Admin 인증 + CRUD 구현 계획을 작성하고 진행하자.
