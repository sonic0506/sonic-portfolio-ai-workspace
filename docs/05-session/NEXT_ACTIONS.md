# Next Actions

Last Updated: 2026-09-09

## MVP 범위 — 확정

REQUIREMENTS의 전체 기능을 1차 배포에 포함한다. Graph View와 RAG Playground도 포함하며 기존 Out of Scope는 유지한다. 범위를 다시 축소하지 않고 기능별 상세 정책과 수용 기준을 구체화한다.

## Priority 1 — RAG 모델과 상세 기술 설계

- RAG_DESIGN의 Spring AI 기반 초기 조합은 제안 상태다. 채택 시 ADR로 확정하고 실제 질문/출처 평가 및 Spring Boot 버전 호환성을 검증한다.

배포는 ADR-0003으로 확정했다. 전체 MVP와 기존 예산을 유지한다.

- RAG 답변/세션 정책은 ADR-0004로 확정했다. 이력 저장 위치·보관 기간·새로고침/재방문 복원·삭제/만료·컨텍스트 상한을 후속 설계한다.

- 생성 모델, Embedding 모델, RAG 통합 방식의 후보를 비교한다. 기존 비용 산정의 gpt-4.1-mini/text-embedding-3-small은 아직 후보이다.
- 실제 콘텐츠와 질문으로 기대 출처, 답변 품질, 지연, 비용 기준을 정한다.
- API/스트리밍, GitHub 세션, 도메인/CORS/CSRF 정책을 설계한다. 실제 허용 GitHub 계정은 인증 구현 전 확인한다.
- 챗봇 제한의 기준/기간/수치 및 해제 설정을 정의한다.
- PostgreSQL/pgvector 버전, Graph/Markdown 도구, 빌드 도구를 확정한다.
- 배포 시 Vercel 무료 조건/저장소 연결, Lightsail와 RDS 사설 연결 및 메모리 부하를 검증한다.

## Priority 2 — 데이터 설계

- CONTENT_SPEC의 최신 입력 항목으로 필드/관계 초안을 작성한다. 추천 질문은 새 세션 생성 후 즉시 전송, Blog는 섹션형 Markdown, 상태 배지는 방문자 미노출, Profile 소개글은 별도 짧은 문구로 확정했다. 추천 질문의 원문 맥락 전달과 기존 미언급 항목의 유지 여부를 후속 설계한다.

- [x] 실제 프로젝트 3건을 샘플로 확보했다(`samples/projects/`).
- [x] 블로그 3편 샘플을 작성했다(`samples/blog/`, AI 초안이며 사용자 확인 전).
- [x] 샘플로 Project / Blog / Skill / Relation 모델의 공백 8건을 식별했다(`samples/README.md`).
- 식별된 공백 8건을 해소하는 ERD 초안을 작성한다. 이것이 현재 최우선 작업이다.
- Document와 DocumentChunk 상세 필드를 확정한다. 섹션 1개 = 청크 1개가 성립하지 않음을 샘플에서 확인했다.
- 비오라의 측정 수치, 싱크마스터의 모델 불일치 검증 유무 등 각 샘플 front matter의 `open_questions`를 사용자에게 확인한다.
- 블로그 샘플을 사용자 문체와 사실 기준으로 검토하거나 실제 원고로 교체한다.

## 분석에서 확인한 설계 검토 항목 — 미확정

- 전체 MVP 기능의 수용 기준과 구현 순서를 정한다. Graph View와 RAG Playground의 1차 배포 포함은 확정되었다.
- 공개/비공개/Draft 정책을 Public 조회, Vector Search, Relation 확장, Graph에 공통 적용하도록 정의한다.
- 원본 수정/삭제/발행 취소 시 색인 무효화 시점, 재색인 실패 상태, 재시도 및 중복 실행 정책을 정한다.
- Relation 기준 ID, 방향성, 중복/자기 연결 정책과 Skill/Category의 Document 매핑 여부를 확정한다.
- 샘플 콘텐츠별 기대 출처를 지정하고, 근거 없음·비공개 제외·수정/삭제 반영을 검증할 RAG 평가 사례를 구체화한다.

## Recommended Next Session Prompt

> `AGENTS.md` 또는 `CLAUDE.md`와 `docs/05-session` 문서를 먼저 읽고, ADR-0001의 확정 스택과 모든 비용 포함 월 10만 원 예산을 기준으로 남은 배포/인증/모델 결정을 진행하자. 미확인 운영 조건은 임의 확정하지 말아줘.
