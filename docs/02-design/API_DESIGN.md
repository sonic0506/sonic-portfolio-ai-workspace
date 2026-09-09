# API Design

Status: Draft

구체적인 API Style/Framework 결정 전이므로 Endpoint를 확정하지 않는다.

## API Domains

### Public
- Profile read
- Project list/detail
- Blog list/detail
- Category/Tag browse
- Graph read
- Chat

### Admin
- Authentication
- Profile CRUD
- Career/Skill CRUD
- Project CRUD
- Blog CRUD
- Category/Tag CRUD
- Relation CRUD
- RAG index/re-index
- RAG playground

## Contract Principle

- Public read model과 Admin write model을 필요에 따라 분리한다.
- RAG 내부 처리 모델을 Public API에 그대로 노출하지 않는다.
- API 변경 시 본 문서 및 관련 테스트를 함께 수정한다.
