# Common AI Rules

이 문서는 Codex와 Claude Code가 공통으로 따라야 하는 최상위 프로젝트 규칙이다.

## 1. Source of Truth

- 프로젝트 의도, 요구사항, 설계, 결정, 작업 상태의 기준은 `docs/`이다.
- 채팅 기록이나 AI의 기억을 문서보다 우선하지 않는다.
- 구현과 문서가 충돌하면 임의로 한쪽을 선택하지 말고 차이를 확인하고 정리한다.

## 2. Session Start

작업을 시작하기 전에 최소한 다음 파일을 읽는다.

1. `docs/05-session/CURRENT_STATE.md`
2. `docs/05-session/NEXT_ACTIONS.md`
3. 현재 작업과 관련된 Project / Design / Decision / Test 문서

프로젝트의 방향이 필요한 경우 `docs/00-project/PROJECT_OVERVIEW.md`와 `REQUIREMENTS.md`를 확인한다.

## 3. Do Not Guess Project Decisions

다음 항목이 문서에서 결정되지 않았다면 임의 확정하지 않는다.

- 프레임워크 / 라이브러리
- DB / Vector Store
- Hosting / Cloud
- 인증 방식
- API Style
- Embedding / LLM Provider
- Graph Library

필요한 결정을 내렸다면 `docs/03-decisions/`에 ADR을 작성하거나 기존 ADR을 수정한다.

## 4. Documentation Synchronization

다음 변경 시 관련 문서도 함께 갱신한다.

- Domain 또는 DB 구조 변경
- API Contract 변경
- RAG Pipeline 변경
- 주요 라이브러리/기술 스택 변경
- 사용자 기능/정책 변경
- 프로젝트 진행 상태 변경

코드만 변경하고 설계 문서를 오래된 상태로 방치하지 않는다.

## 5. Work Scope

- 요청된 작업 범위를 우선한다.
- 관련 없는 리팩터링을 한 번에 포함하지 않는다.
- 큰 작업은 작고 검증 가능한 단위로 나눈다.
- `docs/04-plans/CURRENT_PLAN.md`와 일치하는 작업 단위를 선호한다.

## 6. Implementation Quality

- 기존 코드 스타일과 구조가 있으면 우선 따른다.
- 명확한 책임 경계를 유지한다.
- 임시 하드코딩을 영구 설계처럼 남기지 않는다.
- 비밀키, Token, 운영 Credential을 저장소에 커밋하지 않는다.
- 새 기능이나 버그 수정은 가능한 범위에서 테스트를 함께 작성한다.

## 7. RAG-specific Rules

- Business Data와 RAG Document Layer를 구분한다.
- RAG 답변은 등록된 데이터에 근거한다.
- 정보가 없으면 없는 사실을 만들어내지 않는다.
- 검색 품질 문제는 답변 Prompt만 수정하기 전에 Retrieval 결과를 먼저 확인한다.
- Chunk, Metadata, Relation, Reranking, Prompt 중 어느 계층의 문제인지 구분한다.

## 8. Decision Records

다음은 ADR 대상으로 본다.

- 핵심 기술 스택 선택
- DB / Vector DB 선택
- 인증 전략
- Markdown 저장 전략
- Document / Chunk 모델 변경
- Relation 모델 변경
- RAG Retrieval 전략 변경
- 배포 구조 변경

## 9. Session End

의미 있는 작업을 마칠 때 다음을 갱신한다.

1. `docs/05-session/SESSION_LOG.md`
2. `docs/05-session/CURRENT_STATE.md`
3. `docs/05-session/NEXT_ACTIONS.md`
4. 영향을 받은 설계/결정/테스트 문서

다음 세션의 AI가 이전 대화를 전혀 모르더라도 문서만으로 이어갈 수 있어야 한다.

## 10. Completion Rule

- 테스트 또는 확인 없이 "완료"라고 단정하지 않는다.
- 검증하지 못한 항목은 `미검증` 또는 `추가 확인 필요`로 명시한다.
- `NEXT_ACTIONS.md`에 남은 작업이 있으면 완료 상태와 혼동하지 않는다.
