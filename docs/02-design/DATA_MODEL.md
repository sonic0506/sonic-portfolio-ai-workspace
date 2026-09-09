# Data Model

Status: Draft

입력/표시 요구사항은 [CONTENT_SPEC](../00-project/CONTENT_SPEC.md)을 기준으로 한다. Project 기본 정보와 핵심 요약 리스트, Project/Blog/Profile 제목+Markdown 섹션 및 추천 질문 블록, 공통 Skill과 Blog/Profile 연결을 다음 ERD 초안에 반영한다. 섹션 저장 방식/Markdown 확장 문법/추가 테이블은 아직 확정하지 않는다.

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

ChatSession/ChatMessage는 세션별 대화 기억 요구사항(ADR-0004)을 표현한다. 메시지는 해당 세션에만 속하며 다른 방문자의 접근을 검증해야 한다. 저장 기술, 상세 필드, 보관/만료/삭제/재방문 복원 정책은 미정이다.

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
