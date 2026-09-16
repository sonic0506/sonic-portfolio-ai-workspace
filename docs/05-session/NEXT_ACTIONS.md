# Next Actions

Last Updated: 2026-09-16

## 현재 기준

전체 MVP 및 월 10만 원 예산은 유지한다. ADR-0001~0009는 Accepted다. 콘텐츠 모델·ERD 초안과 샘플 RAG 평가는 완료되어 다시 선정하지 않는다.

## Priority 1 — 실제 OpenAI로 채팅 확인 (사용자 확인 필요)

채팅 1차(CHAT_IMPLEMENTATION)는 2026-09-16 구현·커밋했다. 테스트는 가짜 모델이다.

1. 사용자 동의 후 `.env`에 `CHAT_PROVIDER=openai`(임베딩도 openai) → `bootRun`(local).
2. `curl -N -X POST localhost:8080/api/chat -H 'Content-Type: application/json' -d '{"question":"..."}'`로 PoC 질문 7개(poc/rag_eval.py EVAL)를 확인한다. 비용은 질문당 1센트 미만 예상.
3. 기대: 출처가 PoC 기대 출처를 포함, OAuth 질문은 근거 부족 답변, 오프라인 동기화 질문에 비공개 글(`offline-first-boundary`) 미노출. 결과를 RAG_MEASUREMENTS에 "측정 4 — 제품 파이프라인"으로 기록한다.

## Priority 2 — 다음 기능 선택 (사용자에게 확인)

- **프론트엔드(Public Next.js / Admin React):** 백엔드 API가 공개 조회·관리·채팅까지 갖춰졌다. 프론트 도구(패키지 매니저·빌드) 결정이 먼저 필요하다(ARCHITECTURE).
- **채팅 세션:** RAG-005/006/008/009. 보관 기간·새로고침 복원·만료 결정 필요.
- **Relation 편집 API와 공개 상세의 관련 문서 표시**, RAG Playground, Graph API.

## 사용자 확인 대기 (콘텐츠 사실)

`samples/profile.md`의 `open_questions`와 SAMPLE_SEED_IMPLEMENTATION "사용자 확인이 필요한 사실" 5건. 답을 받으면 샘플을 고치고 시드를 다시 실행한다.

## 해당 기능 착수 시

- Admin 화면: 도메인이 정해지면 ADR-0010 4절(CORS 허용 출처, 쿠키 SameSite)을 갱신한다.
- Chat: 질문 제한 집계 기준/기간/수치/해제 설정, 이력 보관·복원·만료·삭제 및 컨텍스트 상한. 정책 결정 후 관련 스키마를 확정한다.
- Graph: 라이브러리와 Skill/Category 노드 매핑. Document Relation 기준 ID·방향성은 ADR-0005를 유지한다.
- 이미지 업로드: S3 접근 정책과 리전. Markdown 본문 저장 위치는 이미 content_section.body_markdown으로 정했다.
- 색인: 원본 변경/삭제 시 동기화, 실패 재시도 및 중복 실행을 검증한다. 공개 범위는 ADR-0005의 조회 시점 필터를 유지한다.
- 배포: Vercel 무료 조건과 저장소 연결, Lightsail/RDS 사설 연결, 메모리 부하와 실제 비용을 검증한다.

## 남은 검증과 콘텐츠 확인

- pgvector HNSW 검색은 PoC의 메모리 코사인 검색과 별도로 검증한다.
- 세션 평가 RAG-005/006/008/009/010은 구현 후 측정한다.
- 콘텐츠 변경 시 --save로 재측정하고 RAG_MEASUREMENTS에 기록한다. Hybrid search는 도입 확정이 아니다.
- 샘플 front matter의 open_questions와 AI 블로그 초안의 사실·문체를 사용자에게 확인한다.
- OpenAI API 키는 기존 키를 사용한다(2026-09-16 사용자 결정). 사용량 이상 시 재발급을 검토한다.

## Recommended Next Session Prompt

> 공통 규칙과 세션 문서를 읽고, 실제 OpenAI로 채팅 PoC 질문을 재현해 RAG_MEASUREMENTS에 기록한 뒤, 다음 기능(프론트엔드 또는 채팅 세션)을 사용자와 정하자.
