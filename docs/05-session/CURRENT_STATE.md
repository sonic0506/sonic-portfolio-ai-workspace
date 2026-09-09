# Current State

Last Updated: 2026-09-09

## Current Phase

프로젝트 정의 및 요구사항 초안이 완료되었고, 개발 설계에 들어가기 직전이다.

## Confirmed

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

## Not Yet Decided

- Authentication session details / allowed GitHub account identifier
- Specific AWS services / region / deployment
- LLM model / Embedding provider and model / RAG integration
- Expected traffic / usage limit thresholds and counting rules
- Dependency versions / build tools / S3 policy / Markdown storage
- Graph visualization library
- Exact DB schema
- Exact API contract

## Implementation State

- Application code: Not started
- Project documentation bootstrap: Created
- Sample portfolio content: Not yet organized
- RAG PoC: Not started

## Important Notes

새 세션에서는 기술 스택을 기존 결정처럼 가정하지 말고 ADR 여부를 먼저 확인한다.

## Latest Analysis — 2026-09-09

- 저장소 파일과 요구사항/설계/계획/테스트 문서를 대조했다. 애플리케이션 코드와 실행 가능한 테스트는 없다. 이후 사용자 기술 선택을 ADR-0001에 기록했다.
- 구현 전 검토할 설계 공백: Draft/비공개 데이터의 검색·Graph·Relation 확장 제외 정책, 삭제/발행 취소와 색인의 동기화 및 실패 복구, Relation 기준 ID와 방향/중복 정책.
- Graph의 Skill/Category 노드 후보와 Document type 후보 사이의 매핑은 미정이다.
- 초기 분석 이후 사용자 결정으로 MVP 전체 기능 포함과 핵심 기술 스택을 확정했다. 배포/인증 등 상세 결정은 남아 있다. 상세 이력은 SESSION_LOG를 참고한다.
