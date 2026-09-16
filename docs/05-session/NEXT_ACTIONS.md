# Next Actions

Last Updated: 2026-09-16

## 현재 기준

전체 MVP 및 월 10만 원 예산은 유지한다. ADR-0001~0009는 Accepted다. 콘텐츠 모델·ERD 초안과 샘플 RAG 평가는 완료되어 다시 선정하지 않는다.

## Priority 1 — Document 색인

샘플 시드(SAMPLE_SEED_IMPLEMENTATION)는 2026-09-16 완료·커밋했다. 개발 DB에 샘플이 들어가 있다.

1. RAG_DESIGN, ADR-0005/0006/0007, `poc/rag_eval.py`(청킹 규칙), RAG_MEASUREMENTS를 읽고 `docs/04-plans/`에 색인 구현 계획을 쓴다.
2. 계획에 넣을 것:
   - 원본(Project/Blog/Profile) → `document` upsert(`(document_type, source_id)`), `admin_note`·추천 질문 블록 제외(PoC selftest 규칙)
   - PoC의 짧은 섹션 병합 청킹을 Java로 이식하고 PoC 결과(46 → 35청크)와 대조
   - 임베딩: Spring AI + `text-embedding-3-small`, 기존 OpenAI 키(`.env`, 사용자 결정). 테스트는 임베딩을 가짜로 대체
   - 관리 서비스 create/update/delete와 `document.visible`·색인 상태를 같은 트랜잭션에서 갱신(ADR-0005)
   - 시드의 `related_*`를 `document_relation`으로 연결
3. 실제 OpenAI 호출(유료)은 사용자 확인 후 실행한다.

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

> 공통 규칙과 세션 문서를 읽고, RAG_DESIGN·ADR-0005~0007·poc/를 참고해 Document 색인 구현 계획을 작성하자.
