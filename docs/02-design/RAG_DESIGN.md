# RAG Design

Status: Draft — 모델과 검색·답변 정책은 확정(ADR-0006 / ADR-0007). 세션 저장과 Relation 확장 구현은 Draft

답변 및 세션 정책은 [ADR-0004](../03-decisions/ADR-0004-rag-answer-and-session-policy.md), 콘텐츠·Document 모델은 [ADR-0005](../03-decisions/ADR-0005-content-and-document-model.md), 임베딩·검색은 [ADR-0006](../03-decisions/ADR-0006-embedding-model-and-retrieval.md), 생성 모델·프롬프트는 [ADR-0007](../03-decisions/ADR-0007-generation-model-and-answer-prompt.md)로 확정했다. 세션 이력 저장 방식과 Relation 확장 구현은 Draft이다.

현재 구현된 구조를 다이어그램으로 정리한 개요는 [RAG_ARCHITECTURE_OVERVIEW](RAG_ARCHITECTURE_OVERVIEW.md)에 있다.

## 1. Objective

### 구현 조합 — 확정

- 생성 `gpt-4.1-mini`(temperature 0), 임베딩 `text-embedding-3-small`(차원 1536), 기존 RDS pgvector 조합을 사용한다. 2026-09-09~10 PoC에서 기대 출처 7/7 회수와 근거 부족 거부를 확인했다([RAG_MEASUREMENTS](../06-testing/RAG_MEASUREMENTS.md)).
- 청킹은 섹션 기준으로 하고 200자 미만 섹션은 인접 청크에 병합한다. 검색 상위 K는 5다.
- **근거 부족 판정은 유사도 임계값이 아니라 생성 단계에서 한다.** 측정에서 근거 있는 질문의 최저 상위 점수와 근거 없는 질문의 상위 점수 간격이 0.030에 불과했다.
- 출처 표시 단위는 문서다. 문장 단위 각주를 요구하지 않는다.
- Spring AI 사용 여부와 버전 호환성은 여전히 미검증이다. PoC는 표준 라이브러리 스크립트로 수행했다.
- Spring AI는 모델 호출, 임베딩, pgvector 연결과 대화 메모리 지원에 활용한다. 공개 필터, Relation 확장, 출처 검증, 세션 접근 제어, 재색인 및 Playground 검색 추적은 애플리케이션 책임으로 명시한다.
- 별도 Python 서비스 없이 Spring Boot에서 흐름을 제어한다. JPA/QueryDSL은 비즈니스 데이터에 사용하며 벡터 검색은 Spring AI PGvector 지원 또는 필요한 SQL로 처리한다. 모델/라이브러리 버전과 테이블 매핑은 후속 검증한다.
- 질문 해석 → 공개 문서 검색 → 제한된 관계 확장 → 근거/세션 이력 조립 → 답변/출처 반환 흐름을 제안한다. 복잡한 자율 에이전트나 추가 모델 호출은 필요성이 평가로 확인되면 도입한다.
- 세션 이력은 기존 PostgreSQL에 저장하는 후보를 제안한다. 전체 보관 이력과 모델에 보내는 최근 맥락은 구분하며, 보관 기간·상한·복원 정책은 미정이다. 메모리 라이브러리가 방문자별 접근 제어를 대신하지 않는다.
- 기존 1,000회/$2.88 생성 추정은 총 입력 4,000·출력 800토큰 가정이다. 세션 이력과 질문 재작성 호출이 늘면 비용을 다시 계산한다.
- 공식 근거(2026-09-09 조회): [생성 모델](https://developers.openai.com/api/docs/models/gpt-4.1-mini), [임베딩 모델](https://developers.openai.com/api/docs/models/text-embedding-3-small), [Spring AI PGvector](https://docs.spring.io/spring-ai/reference/api/vectordbs/pgvector.html), [Chat Memory](https://docs.spring.io/spring-ai/reference/api/chat-memory.html), [ChatClient](https://docs.spring.io/spring-ai/reference/api/chatclient.html).

Profile, Career, Project, Blog 등 서로 다른 원본 데이터를 공통 검색 가능한 Document로 변환하고, Vector Search와 Relation Expansion을 결합해 답변 Context를 구성한다.

## 1.1 색인 구현 현황 (2026-09-16)

- 투영·청킹·임베딩 저장·상태 관리는 구현했다([DOCUMENT_INDEX_IMPLEMENTATION](../04-plans/DOCUMENT_INDEX_IMPLEMENTATION.md)). Java 청킹이 PoC 측정(35청크)과 일치한다.
- Document 타입은 `PROJECT`, `BLOG`, `PROFILE`을 쓴다. 경력은 프로필 섹션에 포함하며 `CAREER` 문서는 만들지 않는다.
- metadata 실사용 필드: `slug`, `skills`(code 목록), `contentHash`. 아래 4절 후보 중 나머지는 검색 구현 때 필요에 따라 추가한다.
- 2026-09-16 단일 질문 검색·답변 구현: pgvector 코사인 상위 5, 공개 연관 문서 최대 2건 확장(문서당 최근접 청크 1개), ADR-0007 프롬프트, SSE([CHAT_IMPLEMENTATION](../04-plans/CHAT_IMPLEMENTATION.md)). 세션·후속 질문 해석·Reranking은 아직 없다.

## 2. Pipeline

```text
Business Data
   ↓
Document Generation
   ↓
Chunking
   ↓
Metadata Enrichment
   ↓
Embedding
   ↓
Vector Index
```

Query:

```text
Question
   ↓
Session Access Check / Session Context
   ↓
Follow-up Question Interpretation
   ↓
Query Embedding
   ↓
Vector Search
   ↓
Top Documents / Chunks
   ↓
Relation Expansion
   ↓
Optional Reranking
   ↓
Context Assembly
   ↓
LLM Answer
```

Public 검색과 Relation 확장은 현재 공개 상태를 적용한다. 같은 시점에 채팅 반영이 꺼진 카테고리(`category.rag_enabled = false`)의 블로그 글도 뺀다(ADR-0018, 2026-10-05: 경험 카테고리만 근거). Context Assembly에서는 허용된 세션 이력과 공개 근거를 구분하고 토큰 상한을 적용한다. 답변에는 사용한 출처를 표시하며 근거 부족 시 명시한다. 대화 이력이나 이전 모델 답변이 공개 필터를 우회하지 않아야 한다.

후속 질문 해석의 별도 모델 호출 여부, 최근 이력 범위/요약, 세션 저장/만료/복원 정책은 후속 설계 대상이다.

## 3. Data Synchronization

원본 콘텐츠 변경 시:

```text
Content Update
  ↓
Document Regeneration
  ↓
Chunk Regeneration
  ↓
Embedding Regeneration
  ↓
Index Update
```

RAG 데이터를 직접 편집하는 것을 기본 운영 방식으로 사용하지 않는다.

## 4. Metadata Candidates

- source_type
- source_id
- category
- tags
- project_id
- skills
- published_at
- visibility

실제 필드는 PoC 샘플 데이터로 검증 후 확정한다.

## 5. Evaluation Principle

검색 문제가 발생하면 아래 순서로 확인한다.

1. 원본 Document 생성 내용
2. Chunk 경계
3. Metadata
4. Vector Search 결과 / Score
5. Relation Expansion
6. Reranking
7. Context Assembly
8. Prompt / LLM Answer
