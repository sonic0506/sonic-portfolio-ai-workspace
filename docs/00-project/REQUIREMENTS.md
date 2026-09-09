# Requirements

## MVP Scope — Confirmed 2026-09-09

사용자 결정에 따라 아래 Public, Admin, Data / RAG 기능 전체를 1차 배포에 포함한다. Graph View, Relation 관리/확장, RAG Playground도 포함하며, 비기능 요구사항도 적용한다.

- Public Profile, Project List / Detail, Blog List / Detail
- Admin CRUD, Markdown Editor / Preview, Category / Tag 및 Relation 관리
- Document Pipeline, Vector Search, RAG Chatbot
- Graph View, RAG Index 상태 / Re-index, RAG Playground

기능별 상세 정책과 수용 기준은 설계 단계에서 구체화한다. 전체 포함은 이 문서의 요구사항 범위를 뜻하며, 별도 Backlog의 검토 후보까지 자동 확정하지 않는다. 아래 Out of Scope는 유지한다.

## 1. Public Requirements

### Profile
- 프로필 이미지, 이름, 직무, 소개, 이메일 및 외부 링크를 표시한다.
- 경력, 학력, 자격, 기술 스택 등 정형화된 항목을 표시할 수 있다.

### Projects
- 프로젝트 목록을 제공한다.
- 일반 프로젝트는 프로젝트명, 기간, 포지션, 기여도, 기술 스택 중심으로 간략히 노출한다.
- 대표 프로젝트는 Case Study 형태의 상세 내용을 제공한다.
- 프로젝트 상세에서 관련 블로그/문서를 확인할 수 있다.

### Blog
- Markdown 기반 블로그 글을 렌더링한다.
- 하나의 글은 여러 Category에 속할 수 있다.
- Tag를 별도로 관리한다.
- Category/Tag 기반 탐색 또는 필터링을 지원한다.

### Graph View
- Project, Blog, Skill 등 연결 가능한 콘텐츠를 Node로 표현한다.
- 문서 Relation을 Edge로 표현한다.
- Node Type 기반 필터를 지원한다.

### RAG Chatbot
- Profile, Career, Project, Blog, Skill 등 등록 데이터에 근거해 답변한다.
- 데이터에 없는 사실을 임의로 생성하지 않는다.
- 검색에 사용한 출처를 사용자에게 연결할 수 있는 구조를 고려한다.
- 문서 Relation을 활용해 관련 Context를 확장할 수 있어야 한다.

## 2. Admin Requirements

### Profile Management
- 정형화된 Form으로 기본 정보, 경력, 기술, 학력 등을 관리한다.
- 표시 순서를 관리할 수 있는 구조를 고려한다.

### Project Management
- 프로젝트 기본 정보, 기간, 역할, 기여도, 설명, 기술 스택을 관리한다.
- 대표 프로젝트 여부를 설정할 수 있다.
- 대표 프로젝트는 Problem, Role, Architecture, Key Features, Challenges, Troubleshooting, Result 등 상세 내용을 관리할 수 있다.
- 관련 문서를 선택할 수 있다.

### Blog Management
- Markdown Editor와 Preview를 제공한다.
- Draft / Published 등의 상태를 관리한다.
- Category와 Tag를 복수 선택할 수 있다.
- 관련 Project/Document를 연결할 수 있다.

### Knowledge Management
- Document 목록을 조회할 수 있다.
- Document Relation을 관리할 수 있다.
- Graph 형태로 관계를 확인할 수 있다.

### RAG Management
- Document Index 상태를 확인할 수 있다.
- Re-index를 수행할 수 있다.
- RAG Playground에서 검색된 Chunk, Score, Relation 확장 결과, 최종 Context, 답변을 확인할 수 있다.

## 3. Data / RAG Requirements

- 원본 Business Data와 RAG용 Document 데이터를 분리한다.
- 서로 다른 원본 데이터를 공통 Document 모델로 변환한다.
- Document를 Chunk 단위로 나누고 Embedding을 관리한다.
- 원본 변경 시 관련 Document/Chunk/Embedding이 재생성 가능해야 한다.
- Relation은 Graph View와 RAG Relation Expansion 양쪽에서 활용한다.

## 4. Non-functional Requirements

- Public 페이지는 모바일/데스크톱 반응형을 고려한다.
- SEO를 고려한다.
- Admin은 GitHub으로 인증된 운영자 본인 계정만 접근할 수 있어야 한다. 다른 GitHub 계정은 관리자 접근을 거부한다.
- 월 운영비는 서버·DB·S3·OpenAI API·도메인·세금 등 전부 포함하여 100,000원을 예산으로 한다.
- AWS와 AWS 관리형 DB를 우선 검토한다.
- 챗봇 질문 횟수 제한을 적용한다. 제한 활성화 여부와 수치를 설정으로 변경할 수 있어야 하며, 제한 해제는 관리자 인증/권한 검사에 영향을 주지 않는다. 구체적인 제한 기준과 수치는 설계에서 정한다.
- 비밀키와 운영 환경 설정은 저장소에 직접 커밋하지 않는다.
- 중요한 변경은 테스트 가능해야 한다.
- 문서와 구현의 일관성을 유지한다.

## 5. Out of Scope — Initial MVP

- 다중 사용자 포트폴리오 생성 SaaS
- 공개 회원가입
- 댓글 / 좋아요 / 팔로우
- 결제
- 실시간 협업 편집
