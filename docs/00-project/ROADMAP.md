# Project Roadmap

## 권장 전체 진행 순서

### Phase 1. 프로젝트 정의
- 프로젝트 목적/범위 확정
- 핵심 기능 정의
- MVP / 이후 범위 구분

### Phase 2. 요구사항 및 정책 정의
- Profile / Project / Blog 항목 정의
- Category / Tag 정책
- Relation 정책
- 공개/비공개 정책
- 챗봇 답변 정책
- Admin 인증/권한 정책

### Phase 3. 개발 설계
- 기술 스택 결정
- 시스템 아키텍처
- DB ERD
- API
- Document 추상화
- RAG Pipeline
- Graph / Relation
- 인증
- 배포 구조

### Phase 4. 샘플 데이터 + PoC
- 실제 Project 1~2개
- Blog 2~3개
- Profile 일부
- Relation 샘플
- 설계가 실제 콘텐츠에 적합한지 검증

### Phase 5. 핵심 기능 개발
권장 구현 순서:
1. 기반 프로젝트 / 인증
2. Admin CRUD
3. Public Portfolio
4. Blog
5. Document Pipeline
6. Vector Search
7. RAG Chatbot
8. Graph View

### Phase 6. RAG Pipeline 검증
- Chunking
- Metadata
- Top-K
- Relation Expansion
- Reranking
- Context 구성

### Phase 7. 실제 포트폴리오 데이터 정리
- 전체 경력
- 실제 프로젝트
- 기술 스택
- 대표 프로젝트 상세
- Troubleshooting
- 블로그 원고
- Relation

### Phase 8. 실제 콘텐츠 등록
- 직접 만든 Admin을 사용해 등록
- Admin UX 검증 병행

### Phase 9. 챗봇 품질 테스트
- 사실 확인형
- 프로젝트 검색형
- 기술 경험형
- 비교형
- 복합 질문
- 정보 없음 질문
- 애매한 질문

### Phase 10. 통합 QA
- Public
- Admin
- Markdown
- Graph
- RAG
- Responsive
- SEO
- Auth
- Data Sync / Re-index

### Phase 11. 배포 준비
- Production 환경 변수
- Migration
- Storage
- Vector Index
- Domain / HTTPS
- Analytics / Monitoring
- Backup
- SEO Metadata / Sitemap / robots.txt

### Phase 12. Production 배포

### Phase 13. 배포 후 검증 및 운영
- RAG 답변 품질
- 실제 기기 UI
- SEO
- Analytics
- 에러 로그
- 성능
- 운영 비용

## 반복 개선 루프

RAG는 마지막 단계에서 한 번 검증하는 기능이 아니라 개발 중 계속 반복한다.

```text
콘텐츠 등록
  ↓
RAG Index
  ↓
챗봇 테스트
  ↓
문제 발견
  ↓
Document / Chunk / Relation / Prompt 개선
  ↓
Re-index
  ↺
```
