# Session Log

세션별 주요 작업 이력을 누적 기록한다. 최신 기록은 위쪽에 추가한다.

---

## 2026-09-09 — Uncommitted Documents Organized

- 워킹 트리에만 있던 문서 변경을 주제별 커밋으로 정리했다: 배포/비용(ADR-0003, ADR-0002, AWS_COST_PROPOSAL, ARCHITECTURE), RAG 정책/콘텐츠 스펙(ADR-0004, RAG_DESIGN, RAG_TEST_CASES, CONTENT_SPEC, REQUIREMENTS, DATA_MODEL), 세션 인계 문서.
- `.DS_Store` 추적을 해제하고 `.gitignore`를 추가했다.
- 문서 내용 변경은 없다. 기존 결정/미확정 상태를 그대로 커밋했다.
- 다음: NEXT_ACTIONS의 Priority 1~2(RAG 모델 채택, 샘플 콘텐츠 기반 데이터 모델 검증)를 진행한다.

## 2026-09-09 — Content Follow-up Decisions

- 사용자 답변 4개를 반영했다: 상태 배지 미노출, 추천 질문 새 세션 즉시 전송, Blog 섹션형 Markdown/추천 질문 지원, Profile 짧은 소개글 분리.
- CONTENT_SPEC, REQUIREMENTS, DATA_MODEL, CURRENT_STATE, NEXT_ACTIONS, SESSION_LOG를 동기화했다.
- 문서 대조 및 diff 공백 검사만 수행했다. 실행 기능은 미구현이다.
- 다음: 이 요구사항으로 데이터 사전/ERD를 작성하고 추천 질문 원문 맥락 전달 등 구현 세부를 정의한다.

## 2026-09-09 — Content Fields and Presentation Refined

- 사용자 텍스트와 첨부 이미지의 표시 구조를 바탕으로 CONTENT_SPEC을 작성했다.
- Project 기본/대표·비대표 목록/상세 섹션, 공통 Skill 관리, Blog 메타정보, Profile 소개 섹션/스킬 그룹을 정리했다.
- 이미지의 예시 기술 선택/경력 내용은 결정이나 실제 데이터로 취급하지 않았다. 미언급 기존 기능과 추천 질문 동작 등은 확인 대상으로 남겼다.
- 변경: CONTENT_SPEC.md, REQUIREMENTS.md, DATA_MODEL.md, CURRENT_STATE.md, NEXT_ACTIONS.md, SESSION_LOG.md.
- 검증: 요청 항목과 문서 대조 및 diff 공백 검사. 코드/DB 구현과 실행 테스트는 수행하지 않았다.
- 다음: 확인 항목 해소 후 데이터 사전/ERD 초안 작성.

## 2026-09-09 — RAG Implementation Recommendation Explained

- OpenAI 모델 및 Spring AI ChatClient/PGvector/Chat Memory 공식 문서를 조회했다.
- RAG_DESIGN에 초기 조합 후보와 라이브러리/애플리케이션 책임, 세션 맥락 비용 조건을 기록했다. CURRENT_STATE/NEXT_ACTIONS도 동기화했다.
- 새 Accepted 결정이나 구현 없음. 실제 품질/버전 호환성은 미검증이며 문서 변경만 검증했다.
- 다음: 추천안 채택 후 실제 콘텐츠 기반 PoC 기준 확정.

## 2026-09-09 — RAG Grounding and Session Memory Confirmed

- 공개 콘텐츠만 사용, 출처 표시, 근거 부족 명시와 세션별 대화 기억을 ADR-0004에 Accepted로 기록했다.
- Requirements, RAG Design, Data Model, RAG Test Cases 및 세션 인계 문서를 동기화했다.
- 후속 질문/세션 분리/비공개 제외/이력 오정보/타인 접근/원문 발행 취소 평가 사례를 Planned로 추가했다.
- 검증: 문서 정책 대조 및 diff 공백 검사. 실행 가능한 앱은 없으므로 실제 동작 테스트는 수행하지 않았다.
- 다음: 생성/임베딩 모델과 세션 보관·복원·컨텍스트 상한 설계. 저장 기술은 미확정이다.

## 2026-09-09 — Initial Deployment Selected

- 사용자 추천안 채택에 따라 Vercel Hobby + 서울 Lightsail 2GB + RDS micro 구성을 ADR-0003에 Accepted로 기록했다.
- Architecture, 비용 제안서 상태, Current State, Next Actions를 동기화했다. 모델 후보는 자동 확정하지 않았다.
- 검증: 문서 상태 대조 및 diff 공백 검사. 실제 배포/성능/청구금액은 미검증이다.
- 다음: RAG 모델/평가 기준, 데이터·발행 정책, API·인증 상세 설계.

## 2026-09-09 — RDS Retained and Compute Options Compared

- 사용자 결정으로 RDS 유지 확정. ADR-0002와 Architecture/Current State/Next Actions에 반영했다.
- AWS 서울 EC2 공식 가격표를 조회해 Lightsail 2GB와 EC2 t4g/t3a/t3 small을 비교했다. EBS 20GB/IPv4를 포함한 총예산은 각각 약 7.1만/8.5만/8.8만/9.1만 원이다.
- 비용 제안서에 단가/SKU, 가정, VPC/IAM/ARM 및 CPU 버스트 차이를 기록했다. Decimal 산술 확인, 실제 배포·성능 미검증.
- 변경: ADR-0002, ARCHITECTURE.md, AWS_COST_PROPOSAL.md, CURRENT_STATE.md, NEXT_ACTIONS.md, SESSION_LOG.md.
- 다음: 앱 서버 선택 후 상세 배포 구성 확정. 서버/Vercel 선택은 이번 비교로 자동 확정하지 않는다.

## 2026-09-09 — Database Cost Reduction Tradeoffs

- 서울 RDS 가격표의 Single-AZ PostgreSQL 최저 시간당 단가와 공식 최소 저장 공간/인스턴스 사양을 대조했다.
- Vercel + Lightsail 앱/DB 통합 4GB 약 56,100원, 2GB 약 36,300원을 계산했다. 메모리 경쟁, 백업/복구, 보안 업데이트 및 동시 장애 부담을 문서화했다.
- 변경: AWS_COST_PROPOSAL.md, CURRENT_STATE.md, NEXT_ACTIONS.md, SESSION_LOG.md. 공식 자료/산술 검증만 수행했으며 배포·성능은 미검증이다. 관리형 DB 선호 변경이나 새 기술 확정 없음.
- 다음: 비용 절감과 DB 직접 운영 책임 중 사용자 선호를 반영해 구성 채택.

## 2026-09-09 — Vercel Hybrid Cost Comparison

- Vercel 공식 Hobby/한도/이용 조건과 Lightsail 단가를 확인했다.
- Next.js/React는 Vercel, Spring Boot는 Lightsail 2GB로 분리하는 월 약 70,736원 후보를 비용 제안서와 현재 상태/다음 작업에 반영했다.
- 기존 2GB 통합안과 비용은 같고 백엔드 메모리 여유를 얻는다는 차이를 명시했다. 1GB 후보는 약 62,486원이지만 성능 미검증이다.
- 변경 파일: AWS_COST_PROPOSAL.md, CURRENT_STATE.md, NEXT_ACTIONS.md, SESSION_LOG.md. 공식 문서 및 산술 검토만 수행했고 새 Accepted 결정/배포는 없다.
- 다음 작업: 후보 채택 후 상세 배포/인증 도메인 설계와 부하 검증.

## 2026-09-09 — AWS Monthly Cost Proposal

### Completed
- AWS 공식 서울 RDS 가격표, Lightsail/피어링/pgvector 자료 및 OpenAI 공식 모델 단가를 확인했다.
- 전체 비용 포함 약 90,536원 추천안을 `AWS_COST_PROPOSAL.md`에 Proposed로 기록했다. 환율 1,500원, 730시간, 세금 여유 10%, 소규모 사용량 가정이다.
- 2GB 앱 서버 절약안과 RDS small 증설 비용, 환율 민감도 및 사용 제한 후보를 비교했다.

### Changed Files
- `docs/02-design/AWS_COST_PROPOSAL.md`
- `docs/05-session/CURRENT_STATE.md`
- `docs/05-session/NEXT_ACTIONS.md`
- `docs/05-session/SESSION_LOG.md`

### Decisions / Validation
- 사용자 채택 전 추천안이며 새 Accepted 결정은 없다. 배포/결제 작업 없음.
- 공식 가격표의 SKU/단가를 확인하고 Decimal 계산으로 월 합계와 환율 시나리오를 검증했다.
- 성능, 실제 사용량 및 청구금액은 미검증이다.

### Next
- 추천안 채택 후 상세 배포 설계 및 RAG PoC.

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
