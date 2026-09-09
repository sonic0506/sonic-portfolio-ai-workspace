# Project Overview

## 1. 프로젝트 정의

개발자의 프로필, 경력, 프로젝트, 기술 블로그를 하나의 Knowledge Base로 통합하고, 이를 기반으로 RAG 챗봇과 문서 관계 그래프 탐색 기능을 제공하는 개발자 블로그 & 포트폴리오 플랫폼이다.

## 2. 핵심 목표

- 일반적인 이력서/포트폴리오 형태로 개발자의 프로필과 경력을 공개한다.
- 프로젝트를 일반 프로젝트와 대표 프로젝트 형태로 구분해 보여준다.
- Markdown 기반 기술 블로그를 운영한다.
- 프로필, 프로젝트, 블로그 등 서로 다른 규격의 데이터를 공통 Document Layer로 변환해 RAG에서 활용한다.
- 프로젝트와 블로그 글 등 관련 문서를 명시적으로 연결한다.
- Vector Search와 Document Relation을 결합한 RAG 답변을 제공한다.
- 문서 연결 관계를 Graph View로 시각화한다.
- 모든 콘텐츠는 Admin에서 등록/수정/삭제/관리한다.

## 3. 서비스 영역

### Public
- Home
- Profile / About
- Projects
- Blog
- Graph View
- RAG Chatbot

### Admin
- Profile Management
- Career / Skill Management
- Project Management
- Markdown Blog Management
- Category / Tag Management
- Document / Relation Management
- RAG Index Management
- RAG Playground

## 4. 핵심 차별점

단순히 정보를 나열하는 포트폴리오가 아니라, 개발자의 경험을 연결된 지식 구조로 구성한다.

```text
Profile / Career / Project / Blog / Skill
                  ↓
             Document Layer
                  ↓
          Chunk / Embedding
                  ↓
      Vector Search + Relations
                  ↓
              RAG Chatbot
```

## 5. 대표 질문 예시

- React Native 프로젝트 경험이 있나요?
- NestJS를 사용한 프로젝트를 알려주세요.
- OAuth 인증과 관련된 트러블슈팅 경험을 설명해주세요.
- AI 관련 프로젝트 경험을 정리해주세요.
- 특정 프로젝트에서 어떤 역할을 담당했나요?
- 프로젝트와 연결된 기술 블로그 글을 알려주세요.

## 6. 프로젝트 한 줄 설명

**RAG와 Knowledge Graph를 활용한 AI 기반 개발자 블로그 & 포트폴리오 플랫폼**

## 7. 현재 범위 원칙

- MVP에서는 개인 1명의 포트폴리오 운영을 기준으로 한다.
- 멀티테넌시, 공개 회원가입, 소셜 기능은 우선 범위에 포함하지 않는다.
- 핵심 기술 스택은 [ADR-0001](../03-decisions/ADR-0001-core-technology-stack.md)을 따른다.

## 8. 개발 목적과 운영 조건

- 구현으로 보여줄 핵심 역량은 AI를 활용한 RAG이다.
- 포트폴리오 콘텐츠에서는 프론트엔드, 백엔드, AI 역량을 모두 전달한다.
- 프론트엔드는 익숙한 기술 중심으로, 백엔드는 학습을 병행하며 개발한다.
- 월 운영비 예산은 서버·DB·스토리지·OpenAI API·도메인·세금 등 전부 포함하여 100,000원이다. AWS와 AWS 관리형 DB를 선호하며 구체 구성은 비용 검증 후 결정한다.
