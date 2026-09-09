# Architecture

Status: Draft

## 1. High-level Components

```text
Public Web
   │
   ├── Profile / Projects / Blog / Graph / Chat
   │
Backend / Application API
   │
   ├── Content Domain
   ├── Admin Domain
   ├── Knowledge / Document Domain
   └── RAG Service
   │
   ├── Relational Database
   ├── Vector Search
   └── File / Image Storage

Admin Web
   │
   └── Content / Relation / RAG Management
```

## 2. Architecture Principles

- Public과 Admin은 동일한 원본 콘텐츠를 사용한다.
- Business Data와 RAG 파생 데이터를 분리한다.
- RAG Index는 원본이 아니며 재생성 가능한 데이터로 취급한다.
- Graph View와 RAG Relation Expansion은 동일한 Relation Source를 사용한다.

## 3. Confirmed Technology Stack

[ADR-0001](../03-decisions/ADR-0001-core-technology-stack.md)에 따라 Public은 Next.js, Admin은 React, 서버는 Spring Boot(Java 21)와 JPA/QueryDSL을 사용한다. DB/검색은 PostgreSQL/pgvector, LLM 제공자는 OpenAI, 스토리지는 S3이다. 배포 토폴로지와 상세 설계는 아직 Draft이다.

운영 조건은 [ADR-0002](../03-decisions/ADR-0002-operating-budget-auth-and-limits.md)를 따른다. 모든 비용 포함 월 10만 원, AWS 및 AWS 관리형 DB 선호, GitHub 본인 계정만 관리자 접근 허용, 설정으로 해제 가능한 챗봇 질문 제한을 적용한다.

## 4. Pending Decisions

아래 항목은 ADR로 확정해야 한다.

- Authentication session details
- Specific AWS services / region / Deployment / cost verification
- API style
- LLM model / Embedding provider and model / RAG integration
- Graph library
- S3 region / access policy and Markdown storage strategy
- Dependency versions and build tools
