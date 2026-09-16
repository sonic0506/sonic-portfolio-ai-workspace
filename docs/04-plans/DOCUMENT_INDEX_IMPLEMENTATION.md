# Document Index Implementation

Status: Active — 구현·테스트 완료(2026-09-16), 실제 OpenAI 색인 1회 남음
Date: 2026-09-16

**Goal:** 원본 콘텐츠(Project / Blog / Profile)를 RAG Document Layer(`document`, `document_chunk`, `document_relation`)로 변환·색인하고, 관리 변경과 공개 상태가 색인에 정확히 반영되는 것을 실제 DB에서 검증한다. 검색·답변(채팅)은 다음 계획이다.

**Spec:** [RAG_DESIGN](../02-design/RAG_DESIGN.md), [DATA_MODEL](../02-design/DATA_MODEL.md) 3절, [ADR-0005](../03-decisions/ADR-0005-content-and-document-model.md), [ADR-0006](../03-decisions/ADR-0006-embedding-model-and-retrieval.md), `poc/rag_eval.py`, [RAG_MEASUREMENTS](../06-testing/RAG_MEASUREMENTS.md).

## 설계

### 1. Document 투영 (관리 트랜잭션 안)

- 대상: 프로젝트 → `PROJECT`, 블로그 → `BLOG`, 프로필 → `PROFILE`. `CAREER` 타입은 쓰지 않는다(경력은 프로필 섹션에 포함).
- `(document_type, source_id)` upsert. 관리 서비스의 생성·수정·삭제에서 **같은 트랜잭션으로** 호출한다(ADR-0005 결정 3).
- `content`: 섹션을 `## 제목\n\n본문`으로 이어 붙인 Markdown. `:::questions` 블록은 제거한다(PoC와 같은 정규식). `admin_note`는 넣지 않는다.
- `visible`: 프로젝트·블로그는 `published`, 프로필은 항상 `true`.
- `metadata`: `slug`, `skills`(code 목록), `contentHash`(title+content의 SHA-256).
- 상태 규칙:
  - 내용(hash)이 바뀌면 `index_status = PENDING`. 기존 청크는 재색인이 성공할 때까지 유지한다(상태로 구분).
  - 공개 여부만 바뀌면 청크·상태를 그대로 두고 `visible`만 바꾼다(재임베딩 없음, ADR-0005).
  - 원본 삭제 시 `document` 삭제(청크·Relation은 FK cascade).
- 원본 내용은 PoC와 같게 섹션 본문만 쓴다(요약·하이라이트·기술명은 청크에 넣지 않음). 기술명 조회 품질은 ADR-0006 결정 5(Hybrid search 검토)에서 다시 본다.

### 2. 청킹 (PoC 이식)

- `poc/rag_eval.py`의 `chunk_bounded`를 그대로 옮긴다: `## ` 기준 분할, 1200자 초과 시 빈 줄 기준 분할, 200자 미만 조각이나 직전 청크가 200자 미만이면 병합, 병합된 섹션 제목은 `section_titles` 배열로 보존.
- 길이는 Python과 같게 코드 포인트 수로 센다.
- **대조 기준:** 샘플 6건 → 문서별 5/6/5/4/8/7, 합계 35청크(`poc/results/2026-09-10-chunks.json`).

### 3. 임베딩과 색인 실행 (트랜잭션 밖)

- `EmbeddingClient` 인터페이스 뒤에 Spring AI `EmbeddingModel`(OpenAI `text-embedding-3-small`)을 둔다. 테스트는 가짜 구현을 쓴다.
- 기본값은 **꺼짐**: `EMBEDDING_PROVIDER`(기본 `none`). `openai`로 바꾸고 `OPENAI_API_KEY`를 넣었을 때만 호출한다(유료, 사용자 확인 후).
- 색인 1건: ① `PENDING/FAILED → INDEXING`으로 선점(동시 실행 방지) ② 트랜잭션 밖에서 임베딩 ③ hash가 그대로면 청크 교체·`READY`·`indexed_at`, 그사이 내용이 바뀌었으면 `PENDING` 유지 ④ 실패 시 `FAILED` + `index_error`.
- 실행 경로: 관리 변경 커밋 후 비동기로 해당 문서 색인(임베딩이 켜져 있을 때만), 관리자 수동 실행 API.

### 4. 관리 API

- `GET /api/admin/rag/documents` — 문서별 `id, type, sourceId, title, visible, indexStatus, indexError, indexedAt, chunkCount`
- `POST /api/admin/rag/reindex` — `PENDING`/`FAILED` 문서 색인. `?rebuild=true`면 모든 원본을 다시 투영하고 전부 `PENDING`으로 만든 뒤 색인. 임베딩이 꺼져 있으면 투영만 하고 `embeddingEnabled: false`를 돌려준다.

### 5. Relation (시드)

- 샘플의 `related_projects`/`related_blogs`를 Document ID 기준 `document_relation`(`RELATED_TO`)으로 넣는다. 저장은 한 방향만, 이미 반대 방향이 있으면 넣지 않는다(ADR-0005). 샘플 기준 4건.
- 관리 화면의 Relation 편집 API와 공개 응답의 관련 문서 표시는 다음 계획.

## Tasks

- [x] `rag` 패키지: `DocumentProjector`(원본 → document upsert/삭제), `Chunker`, `EmbeddingClient`·`SpringAiEmbeddingClient`, `DocumentIndexer`, `RagAdminController`
- [x] 관리 서비스(Project/Blog/Profile) 생성·수정·삭제에 투영 연결
- [x] 설정: `spring.ai.model.embedding=${EMBEDDING_PROVIDER:none}`, OpenAI 키·모델, 비동기 실행
- [x] 시드: 투영 후 Relation 4건
- [x] 테스트: `ChunkerTest`(PoC 35청크 대조), `DocumentProjectionTest`(투영·상태·공개 토글·삭제·관리자 필드 제외), `DocumentIndexerTest`(가짜 임베딩으로 READY·1536차원·section_titles·실패 FAILED·rebuild), 시드 Relation
- [ ] (사용자 확인 후) 실제 OpenAI로 샘플 색인 1회 — 샘플 기준 청크 35개 수준, 비용은 1센트 미만 예상

## 범위 밖

검색(pgvector 질의)·답변 생성·SSE·세션(다음 계획), Relation 편집 API, 기술/카테고리 이름 변경 시 metadata 재투영, CAREER 문서.

## 결과 — 2026-09-16

- 사용자 로컬 실행(16:44 KST): 전체 68건 통과. 추가: ChunkerTest 4, SampleIndexTest 3, DocumentProjectionTest 2, DocumentIndexerTest 5.
- **PoC 대조 일치:** 샘플 6건 문서별 청크 5/6/5/4/8/7, 합계 35, 길이 최소 205·중앙 367·최대 821, 병합 청크 9. 구현 전 Python으로 "DB 섹션 → 조립한 content"를 PoC 청킹에 넣어 같은 결과가 나오는 것도 확인했다.
- 투영 결과: 문서 7건(프로젝트 3, 블로그 3, 프로필 1), 비공개 블로그는 `visible = false`, 관리자 메모·추천 질문 블록 미포함, Relation 4건.
- 구현 메모: `DocumentProjector`는 `Propagation.MANDATORY`(관리 트랜잭션 밖 호출 금지). 색인 완료는 content hash가 선점 시점과 같을 때만 반영한다. 백그라운드 색인은 커밋 후 `@Async`.
- 임베딩 기본값 꺼짐(`EMBEDDING_PROVIDER=none`). Spring AI OpenAI 실제 호출은 아직 검증하지 않았다.
- 계획과 다른 점: 추천 질문 블록 제거 결과는 PoC 정규식과 같게 빈 줄 하나가 남는다(테스트에 명시).
- 발견·수정: 편집 스크립트가 같은 선언문을 두 곳에서 지워 컴파일 실패, 테스트의 `status()` 헬퍼가 MockMvc `status()`를 가림 → `indexStatus()`로 변경.

## 실제 색인 실행 방법 (사용자 확인 후)

```sh
# backend/.env
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=sk-...

./gradlew bootRun --args='--spring.profiles.active=local'
# 로그인 후 브라우저 개발자 도구 또는 Swagger에서 (X-XSRF-TOKEN 헤더 필요)
POST /api/admin/rag/reindex?rebuild=true
GET  /api/admin/rag/documents
```
