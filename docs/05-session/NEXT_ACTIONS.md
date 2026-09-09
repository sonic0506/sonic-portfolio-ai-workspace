# Next Actions

Last Updated: 2026-09-09

## Priority 1 — MVP 범위 확정

다음 항목 중 1차 배포에 반드시 포함할 범위를 확정한다.

- Public Profile
- Project List / Detail
- Blog List / Detail
- Admin CRUD
- Markdown Editor
- Document Pipeline
- Vector Search
- RAG Chatbot
- Graph View
- RAG Playground

## Priority 2 — 기술 스택 결정

후보를 비교하고 ADR로 남긴다.

결정 대상:
- Frontend
- Backend
- DB
- Vector Search
- Auth
- Storage
- LLM / Embedding
- Graph library
- Hosting

## Priority 3 — 데이터 설계

- 실제 프로젝트 1~2개를 샘플로 선정한다.
- 실제 블로그 글 2~3개를 샘플로 선정한다.
- Project / Blog / Skill / Relation 모델이 샘플을 충분히 표현하는지 검증한다.
- Document와 DocumentChunk 상세 필드를 확정한다.

## Recommended Next Session Prompt

> `AGENTS.md` 또는 `CLAUDE.md`와 `docs/05-session` 문서를 먼저 읽어 현재 상태를 확인해줘. 다음으로 MVP 범위를 확정하고 기술 스택 후보를 비교해서 ADR 작성까지 진행하자.
