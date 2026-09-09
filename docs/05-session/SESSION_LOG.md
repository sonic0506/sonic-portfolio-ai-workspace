# Session Log

세션별 주요 작업 이력을 누적 기록한다. 최신 기록은 위쪽에 추가한다.

---

## 2026-09-09 — Operating Conditions Confirmed

### Completed / Decisions
- 모든 비용을 포함한 월 100,000원 예산으로 변경했다.
- AWS 및 AWS 관리형 DB 선호, GitHub 본인 계정만 관리자 로그인 허용, 설정으로 해제 가능한 챗봇 질문 제한을 ADR-0002에 기록했다.
- 구체 AWS 서비스, 계정 식별자, 제한 수치와 집계 방식은 미확정이다.

### Changed Files
- `docs/03-decisions/ADR-0001-core-technology-stack.md`
- `docs/03-decisions/ADR-0002-operating-budget-auth-and-limits.md`
- `docs/00-project/PROJECT_OVERVIEW.md`
- `docs/00-project/REQUIREMENTS.md`
- `docs/02-design/ARCHITECTURE.md`
- `docs/05-session/CURRENT_STATE.md`
- `docs/05-session/NEXT_ACTIONS.md`
- `docs/05-session/SESSION_LOG.md`

### Validation
- 현재 기준 문서의 예산·인증·운영 조건을 대조했다. 과거 세션 기록의 당시 예산은 이력으로 유지한다.
- 문서만 변경했으며 실제 인증/제한 기능 구현, 가격 및 예산 충족 검증은 수행하지 않았다.

### Next
- 확정 조건에 맞는 AWS 배포 구성과 비용을 검토하고, 모델/인증 세션/제한 상세 정책을 설계한다.

## 2026-09-09 — Core Stack and Development Goals Confirmed

### Completed / Decisions
- 사용자 지정 핵심 스택을 Accepted ADR-0001에 기록했다.
- RAG 중심의 구현 목표, 프론트엔드·백엔드·AI 전체를 다루는 콘텐츠 목표, 백엔드 학습 목적과 월 50,000원 예산을 기록했다.
- 예산 포함 범위, 배포/인증, 생성/Embedding 모델 등은 미확정으로 유지했다.

### Changed Files
- `docs/03-decisions/ADR-0001-core-technology-stack.md`
- `docs/00-project/PROJECT_OVERVIEW.md`
- `docs/02-design/ARCHITECTURE.md`
- `docs/04-plans/CURRENT_PLAN.md`
- `docs/05-session/CURRENT_STATE.md`
- `docs/05-session/NEXT_ACTIONS.md`
- `docs/05-session/SESSION_LOG.md`

### Validation
- 사용자 결정과 관련 문서의 확정/미확정 항목을 대조했다. 문서 변경만 수행했다.
- 가격, 버전 호환성, 예산 충족 여부 및 런타임은 미검증이다.

### Next
- 예산 포함 범위, 배포 선호/DB 운영 방식, Admin 로그인 선호 확인 후 후속 설계.

## 2026-09-09 — Full MVP Scope Confirmed

### Completed / Decisions
- 사용자 요청에 따라 REQUIREMENTS의 전체 기능을 MVP에 포함하도록 확정했다.
- Graph View, Relation 관리/확장, RAG Playground를 1차 배포에 포함한다.
- 기존 Out of Scope는 유지하며 별도 Backlog 후보는 자동 확정하지 않는다.
- 기술 스택이나 상세 정책은 이번 결정에 포함하지 않았다.

### Changed Files
- `docs/00-project/REQUIREMENTS.md`
- `docs/04-plans/CURRENT_PLAN.md`
- `docs/05-session/CURRENT_STATE.md`
- `docs/05-session/NEXT_ACTIONS.md`
- `docs/05-session/SESSION_LOG.md`

### Validation
- 요구사항, 현재 계획 및 인계 문서의 MVP 상태를 대조했다.
- 문서 변경만 수행했으며 애플리케이션 테스트는 해당하지 않는다.

### Next
- 전체 MVP에 맞춘 기술 스택 결정과 기능별 상세 정책/수용 기준 정의.

## 2026-09-09 — Project Analysis

### Goal
프로젝트 목적, 현재 구현 상태, 설계 방향과 구현 전 공백을 분석한다.

### Completed
- 프로젝트 정의, 요구사항, 전체 설계, 계획, ADR 현황 및 테스트 문서를 저장소 파일 목록과 대조했다.
- 원본 Business Data와 재생성 가능한 RAG Document Layer의 분리, Graph/RAG의 Relation 공유 방향을 확인했다.
- 공개 범위 필터링, 삭제/발행 취소 동기화, 재색인 실패 복구, Relation 식별자/방향/중복 정책의 상세 정의가 필요함을 확인했다.
- Graph Skill/Category 노드 후보에 대응하는 Document type 매핑이 미정임을 확인했다.

### Changed Files
- `docs/05-session/SESSION_LOG.md`
- `docs/05-session/CURRENT_STATE.md`
- `docs/05-session/NEXT_ACTIONS.md`

### Decisions
- 새 기술 또는 제품 범위 결정 없음. 검토 항목을 미확정 상태로 기록했다.

### Validation
- 파일 목록 기준 애플리케이션 코드와 실행 가능한 테스트가 없고, ADR 디렉터리에는 안내 문서만 있음을 확인했다.
- 요구사항/설계/계획/테스트 문서 정적 검토. 빌드, 런타임, 검색 품질 및 성능 검증은 구현 부재로 수행하지 않았다.

### Next
- NEXT_ACTIONS의 기존 우선순위에 따라 MVP를 확정하고, 샘플 콘텐츠로 설계 공백을 해소한다.

## 2026-09-09 — Initial Documentation Bootstrap

### Goal
Codex와 Claude Code가 동일한 프로젝트 규칙과 상태를 공유하며 새 세션에서도 이어서 개발할 수 있는 문서 체계를 생성한다.

### Completed
- 프로젝트 정의 문서 작성
- 요구사항 초안 작성
- 전체 Roadmap 작성
- Codex / Claude 공통 규칙 체계 작성
- Architecture / Data / RAG / Graph / API 설계 초안 생성
- ADR 구조 생성
- Current Plan / Backlog 생성
- Current State / Next Actions / Session Log 생성
- 테스트/QA 문서 템플릿 생성

### Decisions
- `docs/`를 SSOT로 사용한다.
- `AGENTS.md`와 `CLAUDE.md`는 별도 정책을 갖지 않고 공통 `docs/01-rules/`를 참조한다.
- 세션 연속성은 `CURRENT_STATE.md`, `NEXT_ACTIONS.md`, `SESSION_LOG.md`를 중심으로 관리한다.

### Validation
- 초기 문서 구조 생성 완료.
- 애플리케이션 구현은 아직 시작하지 않았다.

### Next
- MVP 범위 확정
- 기술 스택 비교 및 ADR 작성
- 실제 샘플 데이터를 이용한 데이터 모델 검증
