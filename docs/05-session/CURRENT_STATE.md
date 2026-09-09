# Current State

Last Updated: 2026-09-09

## Current Phase

프로젝트 정의 및 요구사항 초안이 완료되었고, 개발 설계에 들어가기 직전이다.

## Confirmed

- 콘텐츠 후속 확인 완료: 공개 상태/대표 여부는 방문자 미노출, 추천 질문은 새 채팅에서 즉시 전송, Blog도 제목+Markdown/추천 질문 블록 사용, Profile 소개글은 별도 짧은 문구로 관리한다.

- 콘텐츠 상세 요구사항을 CONTENT_SPEC에 정리했다: 대표/비대표 목록 구분, Project/Profile 제목+Markdown 섹션, 추천 질문 블록, 공통 기술 목록, Blog 메타정보/내부 글 연결, Profile 스킬 그룹. 추가 확인 항목은 같은 문서에 분리했다.

- RAG 답변 정책은 ADR-0004로 확정했다: 공개 콘텐츠만 사용, 출처 표시, 근거 부족 명시, 세션별 이전 질문/답변 기억 및 세션 간 분리. 저장/보관/복원 방식은 미정이다.

- 배포 구성은 ADR-0003으로 확정했다: Vercel Hobby(Next.js/React), 서울 Lightsail 2GB(Spring Boot), RDS PostgreSQL micro Single-AZ/gp3 20GB. 실제 배포는 시작하지 않았다.

- 핵심 기술 스택: Next.js(Public), React(Admin), Spring Boot(Java 21), JPA/QueryDSL, PostgreSQL/pgvector, OpenAI(LLM), S3. 기준은 ADR-0001이다.
- 구현의 핵심은 RAG이며 콘텐츠는 프론트엔드·백엔드·AI 경험을 모두 전달한다. 프론트엔드는 익숙한 기술, 백엔드는 학습 목적이다.
- 월 운영비 예산은 모든 비용을 포함한 100,000원이다. AWS와 AWS 관리형 DB를 선호한다(ADR-0002).
- 관리자 로그인은 GitHub 본인 계정만 허용한다. 챗봇 질문 횟수 제한을 적용하되 설정으로 쉽게 비활성화하고 수치를 변경할 수 있게 한다.

- MVP는 REQUIREMENTS의 전체 기능을 1차 배포에 포함한다(2026-09-09 사용자 결정). Graph View, Relation 관리/확장, RAG Playground도 포함한다. 기존 Out of Scope는 유지한다.

- Public 블로그 & 포트폴리오와 Admin 페이지로 구성한다.
- Public 핵심 기능은 Profile, Projects, Blog, Graph View, RAG Chatbot이다.
- Admin에서 모든 콘텐츠와 Relation, RAG Index를 관리한다.
- Blog는 Markdown 기반을 지향한다.
- 하나의 Blog는 여러 Category에 속할 수 있다.
- Project/Blog 작성 시 연관 문서를 선택해 연결 관계를 관리한다.
- 서로 다른 Business Data를 공통 Document Layer로 변환해 RAG에서 사용한다.
- Vector Search + Document Relation 기반 Context 확장 구조를 지향한다.
- Codex와 Claude Code 모두 `docs/`를 SSOT로 사용한다.

## Sample Content — 2026-09-09

- 사용자가 대표 프로젝트 3건(비오라 / 유진로봇 / 싱크마스터)의 상세 기술서를 제공했다. `samples/projects/`에 CONTENT_SPEC 형식으로 저장했다.
- 블로그 3편은 프로젝트 내용에서 파생한 AI 작성 샘플 초안이다(`sample: true`). 사용자 문체와 사실 확인 전이며 실제 발행분이 아니다.
- `blog/offline-first-boundary.md`는 RAG 공개 범위 필터 검증(RAG-007)을 위해 의도적으로 비공개(Draft)로 뒀다. 공개 글이 이 글을 Relation으로 참조한다.
- 추천 질문 블록 저장 문법은 remark-directive 컨테이너(`:::questions`)를 후보로 사용했다. 확정 아님.
- 샘플로 확인된 데이터 모델 공백 8건은 `samples/README.md`에 정리했다. 소속 필드, 기여도 주석, 진행 중 상태, 목록 정렬 키, 관리자 전용 메모, 공개→비공개 링크 필터 시점, 섹션-청크 불일치, Skill 참조 키 분리이다.

## Data Model — 2026-09-09

- 샘플 콘텐츠 기준 ERD 초안을 DATA_MODEL에 작성했다. 17개 테이블이며 샘플에서 식별한 공백 8건을 모두 반영했다.
- 두지 않기로 한 테이블과 이유를 함께 기록했다: `admin_user`(허용 계정 1개는 설정값), `suggested_question`(본문 인라인), `chat_usage`(집계 규칙 미정), `document_index_job`(상태 컬럼으로 충분).
- `TROUBLESHOOTING`을 document_type에서 제외했다. 샘플에서 독립 원본이 아니라 프로젝트의 한 섹션이었다.
- ADR-0005(Proposed)에 세 결정을 분리했다: 섹션 단일 테이블 + 추천 질문 본문 인라인, Relation 기준 = Document ID, 공개 범위 필터 = 조회 시점.
- ADR-0005는 2026-09-09 사용자가 그대로 채택해 **Accepted**다.
- `vector(1536)`은 text-embedding-3-small 후보 기준값이며 모델 확정 전까지 고정이 아니다.

## RAG PoC — 2026-09-09

- `poc/rag_eval.py`로 청킹 경계를 실측했다. 의존성 없는 표준 라이브러리 스크립트이며 `chunks` / `selftest`는 API 키 없이 실행된다.
- **측정 결과 기존 가정이 틀렸다.** 가장 긴 섹션이 647자라 섹션을 길이 때문에 쪼갤 일은 없었다. 실제 문제는 200자 미만 짧은 섹션 11개였다.
- 짧은 섹션을 병합하면 46 → 35청크(최소 205 / 중앙 367 / 최대 821자)가 되고, 이 중 9개가 두 개 이상 섹션에 걸친다.
- 이에 따라 DATA_MODEL의 `document_chunk.section_title`을 `section_titles text[]`로 수정했다.
- selftest가 관리자 필드 제외, 추천 질문 블록 제거, 비공개 문서 검색 제외(RAG-007)를 assert로 확인한다.
- 사용자가 제공한 키로 검색 평가를 실행했다. **기대 출처 포함 7/7**, 임베딩 차원 실측 1536이다.
- 비공개 문서가 7개 질문의 상위 결과에 한 번도 등장하지 않았다. ADR-0005의 조회 시점 필터가 검색 단계에서 검증됐다(RAG-007).
- **근거 부족은 유사도 임계값으로 판정할 수 없다.** 근거 있는 질문 최저 0.372 대 근거 없는 질문 0.342로 간격이 0.030이다. 생성 단계가 판단해야 한다.
- 기술명 조회("React Native" 0.372)가 가장 약해 Hybrid search를 검토 대상으로 올렸다.
- 위 내용을 ADR-0006에 **Proposed**로 기록했다. 사용자 확정 전이다.
- 2026-09-10 답변 생성까지 측정했다. `gpt-4.1-mini` / `temperature 0` / 상위 5건 전달로 질문 7개 모두 기대대로 동작했다.
- OAuth 질문에서 근거 5건을 받고도 "근거에 등록되어 있지 않습니다"로 거부했다. ADR-0006 결정 3(임계값 대신 생성 단계 판정)의 전제가 검증됐다.
- 비공개 글 주제와 거의 같은 질문에서도 답변이 공개 원본만 사용했다. RAG-007이 생성 단계까지 통과했다.
- viora 원문의 "단독 담당" / "논의 참여" 구분이 답변에서 보존됐다.
- 생성 모델과 프롬프트 정책을 ADR-0007에 **Proposed**로 기록했다. 사용자 확정 전이다.
- **ADR-0006과 ADR-0007 둘 다 Proposed다. 확정 없이 구현을 시작하지 않는다.**

## Not Yet Decided

- Authentication session details / allowed GitHub account identifier
- Deployment implementation / domains / engine versions
- LLM model / Embedding provider and model / RAG integration
- Expected traffic / usage limit thresholds and counting rules
- Dependency versions / build tools / S3 policy / Markdown storage
- Graph visualization library
- Exact DB schema
- Exact API contract

## Implementation State

- Application code: Not started
- Project documentation bootstrap: Created (모든 결정/설계 문서 커밋 완료)
- Sample portfolio content: 대표 프로젝트 3건(사용자 제공) + 블로그 3편(AI 샘플 초안, 1편 비공개) + 공통 Skill 목록을 `samples/`에 정리
- RAG PoC: Not started

## Important Notes

- RAG 구현 후보 설명을 RAG_DESIGN에 추가했다: gpt-4.1-mini + text-embedding-3-small + Spring AI/pgvector, PostgreSQL 세션 저장 후보. 사용자 채택 전이며 공식 API 지원만 확인했고 실제 품질/호환성은 미검증이다.

- DB 추가 절약 비교: Vercel + Lightsail 4GB 앱/DB 직접 운영 약 56,100원, 2GB 통합 약 36,300원(PoC 후보). 운영/백업 책임과 성능 미검증을 비용 제안서에 기록했으며 관리형 DB 선호는 변경하지 않았다.

- Vercel Hobby + Lightsail 2GB + RDS micro 구성을 채택했다. 비용 가정 기준 약 70,736원이며 개인 비상업적 이용/무료 한도 조건이 있다.

- 비용 비교 이력은 `docs/02-design/AWS_COST_PROPOSAL.md`, 최종 채택 구성은 ADR-0003을 따른다. 실제 배포/성능은 미검증이다.

새 세션에서는 기술 스택을 기존 결정처럼 가정하지 말고 ADR 여부를 먼저 확인한다.

## Latest Analysis — 2026-09-09

- 저장소 파일과 요구사항/설계/계획/테스트 문서를 대조했다. 애플리케이션 코드와 실행 가능한 테스트는 없다. 이후 사용자 기술 선택을 ADR-0001에 기록했다.
- 구현 전 검토할 설계 공백: Draft/비공개 데이터의 검색·Graph·Relation 확장 제외 정책, 삭제/발행 취소와 색인의 동기화 및 실패 복구, Relation 기준 ID와 방향/중복 정책.
- Graph의 Skill/Category 노드 후보와 Document type 후보 사이의 매핑은 미정이다.
- 초기 분석 이후 사용자 결정으로 MVP 전체 기능 포함과 핵심 기술 스택을 확정했다. 배포/인증 등 상세 결정은 남아 있다. 상세 이력은 SESSION_LOG를 참고한다.
