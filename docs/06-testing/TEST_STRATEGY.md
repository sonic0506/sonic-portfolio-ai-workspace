# Test Strategy

Status: Draft

## 1. Test Layers

### Unit
- Domain validation
- Document conversion
- Chunk generation
- Relation logic

### Integration
- Database
- Storage
- Indexing pipeline
- Vector search
- Authentication

### E2E
- Admin 콘텐츠 등록 → Public 노출
- Blog 작성 → Publish → 조회
- Project 수정 → RAG Re-index
- 질문 → Retrieval → 답변

### RAG Evaluation
일반 테스트와 별도의 평가 질문 세트를 유지한다.

## 2. Completion Principle

기능 완료 선언 전 해당 작업 수준에서 가능한 테스트 또는 검증을 수행하고 결과를 Session Log에 남긴다.
