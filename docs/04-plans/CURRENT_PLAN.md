# Current Plan

Status: Active

## Current Phase

**Phase 3: 개발 설계**

데이터 모델과 RAG 파이프라인은 샘플·PoC 측정 근거와 함께 확정했다(ADR-0005~0007). API Style은 ADR-0008로 확정했다. 백엔드 빌드·버전 기준은 ADR-0009로 확정했고 컴파일 및 스키마 생성 검증을 완료했다. 프론트 도구는 해당 기능 착수 시 정한다. 인증·Graph 상세는 해당 기능 착수 시 결정한다.

## Work Items

- [x] 프로젝트 개요 정리
- [x] 주요 Public / Admin 요구사항 정리
- [x] 권장 전체 Roadmap 정리
- [x] Codex / Claude 공통 문서 운영 체계 생성
- [x] MVP 범위 최종 확정 — REQUIREMENTS의 전체 기능 포함, Graph View 및 RAG Playground 포함
- [x] 핵심 기술 스택 결정 — 사용자 선택을 ADR-0001에 기록
- [ ] 배포/인증/모델 등 남은 기술 결정 및 비용·호환성 검증
  - [x] 배포 — ADR-0003, ADR-0017(2026-10-04 단일 서버 Docker로 변경). 실행 계획은 DEPLOYMENT_PLAN
  - [x] 모델 — ADR-0006 / ADR-0007
  - [x] 인증 상세 — ADR-0010 (Admin 도메인/CORS 값은 도메인 결정 시)
  - [ ] 비용 검증 — 계산만 완료. 실제 배포·청구 미검증
  - [ ] 호환성 검증 — 컴파일·컨텍스트 기동·Flyway·JPA/QueryDSL 조회 완료(ADR-0009), AI 연동·pgvector 검색 성능은 남음
- [x] 초기 백엔드 아키텍처 기준 확정 — ADR-0008/0009. 전체 ARCHITECTURE는 프론트 도구 및 기능별 상세가 남아 Draft 유지
- [x] DB ERD 초안 작성 — DATA_MODEL.md (샘플 콘텐츠 기준, 공백 8건 반영)
- [x] Document / Relation 상세 모델 확정 — ADR-0005 Accepted (2026-09-09 사용자 채택)
- [x] RAG PoC 검색 품질 측정 — 기대 출처 7/7, ADR-0006 Accepted
- [x] RAG PoC 답변 생성 측정 — 7/7 기대 동작, ADR-0007 Accepted
- [x] RAG PoC용 샘플 데이터 선정 — 프로젝트 3건 + 블로그 3편 + Skill 목록 (`samples/`)
- [x] API Style 확정 — ADR-0008, REST + JSON 및 채팅 진행 상태/문서 목록/답변 SSE
- [x] 첫 구현 계획 작성 — FIRST_BACKEND_IMPLEMENTATION.md
- [x] 첫 백엔드 Task 1 — 로컬 PostgreSQL에서 컨텍스트 기동·V1 마이그레이션·재실행 미적용 검증 (2026-09-16)
- [x] 첫 백엔드 Task 2 — `GET /api/skills`로 JPA/QueryDSL 실제 조회 검증 (2026-09-16)
- [x] 공개 조회 API — PUBLIC_READ_API_IMPLEMENTATION.md (2026-09-16, 테스트 18건)
- [x] 관리자 인증 + Skill 관리 — ADMIN_AUTH_IMPLEMENTATION.md (2026-09-16, 테스트 34건)
- [x] 콘텐츠 관리 CRUD — ADMIN_CONTENT_CRUD_IMPLEMENTATION.md (테스트 52건)
  - [x] 1단계: Project, Category/Tag 관리 (2026-09-16, 테스트 44건)
  - [x] 2단계: Blog, Profile 관리 (2026-09-16)
- [x] 샘플 콘텐츠 시드 — SAMPLE_SEED_IMPLEMENTATION.md (2026-09-16, 테스트 54건, 테스트 DB 분리)
- [x] Document 색인 — DOCUMENT_INDEX_IMPLEMENTATION.md (2026-09-16, 테스트 68건, PoC 청킹 일치)
  - [x] 실제 OpenAI 임베딩으로 샘플 색인 1회 — 7건 READY (사용자 보고)
- [x] 검색·답변(채팅) 1차 — CHAT_IMPLEMENTATION.md (2026-09-16, 단일 질문, 테스트 77건)
  - [x] 실제 OpenAI로 PoC 질문 7개 재현 — 7/7 (RAG_MEASUREMENTS 측정 4)
- [x] 채팅 세션(대화 이력) — ADR-0011, CHAT_SESSION_IMPLEMENTATION.md (2026-09-16, 테스트 89건)
- [x] 답하지 못한 질문 보관·안내 문구 — ADR-0013, UNANSWERED_QUESTIONS_IMPLEMENTATION.md (2026-09-17, 테스트 101건)
  - [x] 실제 모델 확인 — 측정 6(근거 없음·다른 뜻 질문 안내)
  - [x] 바뀐 프롬프트로 PoC 근거 있는 질문 6개 재확인 — 측정 7, 10/10
- [x] 고정 질문·답변(FAQ) — ADR-0014, FAQ_IMPLEMENTATION.md (2026-09-17, 테스트 107건, 측정 6 6/6)
- [x] 참고 문서(프로젝트·블로그 연결, 상세의 참고/역참조 목록) — ADR-0005 후속 결정, REFERENCE_DOCUMENTS_IMPLEMENTATION.md (2026-09-17, 테스트 116건)
- [ ] 프론트엔드 — ADR-0012(Next.js, React+Vite, pnpm), FRONTEND_IMPLEMENTATION.md
  - [x] 1단계: workspace, 포트폴리오 조회·채팅, 어드민 미답변·FAQ·색인 (2026-09-17, 사용자 로컬 검증 완료)
  - [x] 2단계: 어드민 콘텐츠 관리 (2026-09-17, 사용자 확인 완료)
  - [ ] 3단계: 디자인 다듬기, SEO, 캐시·재검증 정책

## Definition of Done for Current Phase

- 주요 기술 스택 ADR이 존재한다. — 완료 (ADR-0001~0009)
- Data Model / RAG Design이 실제 콘텐츠와 측정으로 뒷받침된다. — 완료 (samples/, RAG_MEASUREMENTS)
- Architecture의 **구현 착수 전 필요 항목**이 해소된다. Graph 라이브러리·S3 정책·인증 세션처럼 코드 없이 정하면 추측이 되는 항목은 해당 기능 구현 시로 미룬다(2026-09-10 사용자 결정, ARCHITECTURE 4절).
- 샘플 프로젝트/블로그 데이터를 이용해 모델이 실제 콘텐츠를 표현할 수 있는지 검증한다. — 완료
- 구현 시작에 필요한 첫 작업 계획이 작성된다.
