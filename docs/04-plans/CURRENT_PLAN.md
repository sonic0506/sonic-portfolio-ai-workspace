# Current Plan

Status: Active

## Current Phase

**Phase 3: 개발 설계**

데이터 모델과 RAG 파이프라인은 샘플·PoC 측정 근거와 함께 확정했다(ADR-0005~0007). 인증 상세, API Style, Graph 라이브러리, 빌드 도구가 미확정이라 아키텍처는 아직 Draft다.

## Work Items

- [x] 프로젝트 개요 정리
- [x] 주요 Public / Admin 요구사항 정리
- [x] 권장 전체 Roadmap 정리
- [x] Codex / Claude 공통 문서 운영 체계 생성
- [x] MVP 범위 최종 확정 — REQUIREMENTS의 전체 기능 포함, Graph View 및 RAG Playground 포함
- [x] 핵심 기술 스택 결정 — 사용자 선택을 ADR-0001에 기록
- [ ] 배포/인증/모델 등 남은 기술 결정 및 비용·호환성 검증
  - [x] 배포 — ADR-0003
  - [x] 모델 — ADR-0006 / ADR-0007
  - [ ] 인증 상세 — 허용 GitHub 계정 식별자, 세션/CORS/CSRF 정책
  - [ ] 비용 검증 — 계산만 완료. 실제 배포·청구 미검증
  - [ ] 호환성 검증 — Spring AI / pgvector / Spring Boot 버전 미검증
- [ ] 시스템 아키텍처 확정 — ARCHITECTURE.md가 Draft. Pending Decisions 5건 잔여
- [x] DB ERD 초안 작성 — DATA_MODEL.md (샘플 콘텐츠 기준, 공백 8건 반영)
- [x] Document / Relation 상세 모델 확정 — ADR-0005 Accepted (2026-09-09 사용자 채택)
- [x] RAG PoC 검색 품질 측정 — 기대 출처 7/7, ADR-0006 Accepted
- [x] RAG PoC 답변 생성 측정 — 7/7 기대 동작, ADR-0007 Accepted
- [x] RAG PoC용 샘플 데이터 선정 — 프로젝트 3건 + 블로그 3편 + Skill 목록 (`samples/`)
- [ ] 첫 구현 계획 작성

## Definition of Done for Current Phase

- 주요 기술 스택 ADR이 존재한다.
- Architecture / Data Model / RAG Design이 `Accepted` 수준으로 정리된다.
- 샘플 프로젝트/블로그 데이터를 이용해 모델이 실제 콘텐츠를 표현할 수 있는지 검증한다.
- 구현 시작에 필요한 첫 작업 계획이 작성된다.
