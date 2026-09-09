# Data Model

Status: Draft

## 1. Business Domains

초기 주요 Entity 후보:

- User / Admin
- Profile
- Career
- Education
- Skill
- Project
- ProjectSkill
- BlogPost
- Category
- BlogCategory
- Tag
- BlogTag

## 2. Knowledge / RAG Domains

- Document
- DocumentRelation
- DocumentChunk
- ChatSession
- ChatMessage

## 3. Document Abstraction

공통 Document 기본 필드 후보:

```text
id
document_type
source_id
title
content
metadata
created_at
updated_at
```

### document_type 후보
- PROFILE
- CAREER
- PROJECT
- BLOG
- TROUBLESHOOTING

## 4. Relation

```text
Document A
    │
DocumentRelation
    │
Document B
```

초기 relation_type은 `RELATED_TO` 하나로 시작 가능하며, 필요 시 다음을 검토한다.

- PART_OF
- USED_IN
- SOLVED_BY
- REFERENCES
- DEPENDS_ON

## 5. Important Rule

Relation의 기준 ID가 원본 Entity ID인지 Document ID인지 구현 전 확정해야 한다.
현재 방향은 Graph/RAG의 일관성을 위해 `Document` 중심 Relation을 우선 검토한다.
