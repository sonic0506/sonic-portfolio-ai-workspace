# Next Actions

Last Updated: 2026-09-09

## MVP 범위 — 확정

REQUIREMENTS의 전체 기능을 1차 배포에 포함한다. Graph View와 RAG Playground도 포함하며 기존 Out of Scope는 유지한다. 범위를 다시 축소하지 않고 기능별 상세 정책과 수용 기준을 구체화한다.

## Priority 1 — 남은 운영 조건 및 기술 결정

핵심 스택은 ADR-0001, 운영 조건은 ADR-0002로 확정했다. 모든 비용을 포함한 월 10만 원, AWS 및 AWS 관리형 DB 선호, GitHub 본인 계정 인증, 설정으로 해제 가능한 챗봇 제한을 기준으로 설계한다. 예상 트래픽이 미정이면 비용 계산 시 가정을 명시한다.

- AWS 서비스/리전별 비용과 관리형 PostgreSQL의 pgvector 지원을 공식 자료로 검증한다.
- 로그인 구현 시 허용할 GitHub 계정 식별자를 확인한다.
- 질문 제한의 기준, 기간, 수치와 비활성화 설정을 정의한다. 제한 해제가 인증/권한 검사를 해제하지 않도록 한다.

결정 대상:
- Auth session details
- API style
- LLM model / Embedding provider and model / RAG integration
- Graph library
- Specific AWS hosting / DB service / cost estimate and usage thresholds
- Dependency versions / build tools / S3 policy / Markdown storage

## Priority 2 — 데이터 설계

- 실제 프로젝트 1~2개를 샘플로 선정한다.
- 실제 블로그 글 2~3개를 샘플로 선정한다.
- Project / Blog / Skill / Relation 모델이 샘플을 충분히 표현하는지 검증한다.
- Document와 DocumentChunk 상세 필드를 확정한다.

## 분석에서 확인한 설계 검토 항목 — 미확정

- 전체 MVP 기능의 수용 기준과 구현 순서를 정한다. Graph View와 RAG Playground의 1차 배포 포함은 확정되었다.
- 공개/비공개/Draft 정책을 Public 조회, Vector Search, Relation 확장, Graph에 공통 적용하도록 정의한다.
- 원본 수정/삭제/발행 취소 시 색인 무효화 시점, 재색인 실패 상태, 재시도 및 중복 실행 정책을 정한다.
- Relation 기준 ID, 방향성, 중복/자기 연결 정책과 Skill/Category의 Document 매핑 여부를 확정한다.
- 샘플 콘텐츠별 기대 출처를 지정하고, 근거 없음·비공개 제외·수정/삭제 반영을 검증할 RAG 평가 사례를 구체화한다.

## Recommended Next Session Prompt

> `AGENTS.md` 또는 `CLAUDE.md`와 `docs/05-session` 문서를 먼저 읽고, ADR-0001의 확정 스택과 모든 비용 포함 월 10만 원 예산을 기준으로 남은 배포/인증/모델 결정을 진행하자. 미확인 운영 조건은 임의 확정하지 말아줘.
