# RAG Design

Status: Draft

## 1. Objective

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
