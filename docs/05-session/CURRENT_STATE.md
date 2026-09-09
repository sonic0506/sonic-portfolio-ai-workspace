# Current State

Last Updated: 2026-09-09

## Current Phase

프로젝트 정의 및 요구사항 초안이 완료되었고, 개발 설계에 들어가기 직전이다.

## Confirmed

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

- Frontend framework
- Backend framework
- Database / Vector search implementation
- Authentication
- Hosting / deployment
- LLM / Embedding provider
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
