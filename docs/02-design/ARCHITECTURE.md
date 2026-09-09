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

## 3. Pending Decisions

아래 항목은 ADR로 확정해야 한다.

- Frontend framework
- Backend framework
- DB / Vector extension or service
- Storage
- Authentication
- Hosting / Deployment
- LLM / Embedding provider
