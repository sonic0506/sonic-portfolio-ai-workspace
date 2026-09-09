# RAG Design

Status: Draft

답변 및 세션 정책은 [ADR-0004](../03-decisions/ADR-0004-rag-answer-and-session-policy.md)로 확정했다. 모델/저장 방식/상세 검색 구현은 Draft이다.

## 1. Objective

### 초기 구현 조합 제안 — 미확정

- 생성 gpt-4.1-mini, 임베딩 text-embedding-3-small, Spring AI와 기존 RDS pgvector 조합을 PoC 기준안으로 제안한다. 실제 한국어 검색/근거 준수/후속 질문 평가 전 품질을 보장하지 않는다.
- Spring AI는 모델 호출, 임베딩, pgvector 연결과 대화 메모리 지원에 활용한다. 공개 필터, Relation 확장, 출처 검증, 세션 접근 제어, 재색인 및 Playground 검색 추적은 애플리케이션 책임으로 명시한다.
- 별도 Python 서비스 없이 Spring Boot에서 흐름을 제어한다. JPA/QueryDSL은 비즈니스 데이터에 사용하며 벡터 검색은 Spring AI PGvector 지원 또는 필요한 SQL로 처리한다. 모델/라이브러리 버전과 테이블 매핑은 후속 검증한다.
- 질문 해석 → 공개 문서 검색 → 제한된 관계 확장 → 근거/세션 이력 조립 → 답변/출처 반환 흐름을 제안한다. 복잡한 자율 에이전트나 추가 모델 호출은 필요성이 평가로 확인되면 도입한다.
- 세션 이력은 기존 PostgreSQL에 저장하는 후보를 제안한다. 전체 보관 이력과 모델에 보내는 최근 맥락은 구분하며, 보관 기간·상한·복원 정책은 미정이다. 메모리 라이브러리가 방문자별 접근 제어를 대신하지 않는다.
- 기존 1,000회/$2.88 생성 추정은 총 입력 4,000·출력 800토큰 가정이다. 세션 이력과 질문 재작성 호출이 늘면 비용을 다시 계산한다.
- 공식 근거(2026-09-09 조회): [생성 모델](https://developers.openai.com/api/docs/models/gpt-4.1-mini), [임베딩 모델](https://developers.openai.com/api/docs/models/text-embedding-3-small), [Spring AI PGvector](https://docs.spring.io/spring-ai/reference/api/vectordbs/pgvector.html), [Chat Memory](https://docs.spring.io/spring-ai/reference/api/chat-memory.html), [ChatClient](https://docs.spring.io/spring-ai/reference/api/chatclient.html).

Profile, Career, Project, Blog 등 서로 다른 원본 데이터를 공통 검색 가능한 Document로 변환하고, Vector Search와 Relation Expansion을 결합해 답변 Context를 구성한다.

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

Public 검색과 Relation 확장은 현재 공개 상태를 적용한다. Context Assembly에서는 허용된 세션 이력과 공개 근거를 구분하고 토큰 상한을 적용한다. 답변에는 사용한 출처를 표시하며 근거 부족 시 명시한다. 대화 이력이나 이전 모델 답변이 공개 필터를 우회하지 않아야 한다.

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
