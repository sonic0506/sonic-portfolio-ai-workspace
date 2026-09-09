# Developer Blog & Portfolio — AI Collaboration Workspace

개발자 블로그 & 포트폴리오 프로젝트를 Codex와 Claude Code에서 동일한 규칙으로 이어서 개발하기 위한 초기 문서 구조입니다.

## 핵심 원칙

- `docs/`를 프로젝트의 단일 진실 공급원(SSOT)으로 사용합니다.
- `AGENTS.md`와 `CLAUDE.md`는 동일한 공통 규칙을 참조하는 진입점입니다.
- 프로젝트 정의, 설계, 의사결정, 작업 계획, 테스트, 세션 인계를 모두 파일로 추적합니다.
- 새 세션은 이전 대화 기억이 아니라 `CURRENT_STATE.md`와 `NEXT_ACTIONS.md`를 기준으로 이어갑니다.

## 새 세션 시작 방법

AI에게 다음처럼 요청하면 됩니다.

> 이 저장소의 AGENTS.md 또는 CLAUDE.md와 docs의 세션 인계 문서를 먼저 읽고, 현재 상태와 다음 작업을 요약한 뒤 진행해줘.

## 주요 문서

- `docs/00-project/PROJECT_OVERVIEW.md`: 프로젝트 정의
- `docs/00-project/REQUIREMENTS.md`: 기능/비기능 요구사항
- `docs/00-project/ROADMAP.md`: 전체 진행 순서
- `docs/01-rules/COMMON_RULES.md`: Codex/Claude 공통 규칙
- `docs/01-rules/AI_WORKFLOW.md`: 세션별 작업 프로세스
- `docs/02-design/`: 개발 설계 문서
- `docs/03-decisions/`: ADR(Architecture Decision Record)
- `docs/04-plans/`: 현재 계획과 백로그
- `docs/05-session/`: 세션 상태/인계/로그
- `docs/06-testing/`: 테스트 전략, RAG 테스트, QA

## 권장 운영 방식

1. 요구사항 또는 설계 변경 시 관련 `docs/`를 먼저 또는 구현과 동시에 갱신합니다.
2. 중요한 기술 결정은 ADR로 남깁니다.
3. 실제 구현 작업은 `CURRENT_PLAN.md`의 작업 단위로 진행합니다.
4. 작업 종료 전 세션 문서 3종을 반드시 갱신합니다.
5. 다음 세션은 문서만 읽어도 이어서 진행할 수 있어야 합니다.
