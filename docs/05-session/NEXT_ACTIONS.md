# Next Actions

Last Updated: 2026-09-16

## 현재 기준

전체 MVP 및 월 10만 원 예산은 유지한다. ADR-0001~0009는 Accepted다. 콘텐츠 모델·ERD 초안과 샘플 RAG 평가는 완료되어 다시 선정하지 않는다.

## Priority 1 — 샘플 콘텐츠 시드

관리 CRUD(Project, Blog, Profile, Category/Tag, Skill)는 2026-09-16 완료·커밋했다. 이제 실데이터로 공개 API를 확인하고, 다음 단계(Document 색인)의 입력을 만든다.

1. `samples/`(프로젝트 3, 블로그 3, `skills.md`)를 읽어 관리 API 요청으로 바꾸는 시드 도구를 만든다. 후보: `backend/`의 local 전용 커맨드(예: `--seed-samples`) 또는 테스트용 SQL. 결정은 사용자에게 확인한다.
2. front matter → 요청 매핑: `skills`(표시명) → `skill.code`(kebab-case), `categories`/`tags` 생성, `period_start` `YYYY-MM` → 월 1일, `:::questions` 블록은 본문 그대로.
3. `offline-first-boundary`는 비공개로 등록되는지 확인한다. `related_*`(Relation)는 Document 색인 이후에 연결한다.
4. 확인: `bootRun` 후 `/api/projects`, `/api/blog/posts`, Swagger 화면. Profile 샘플은 없으므로 필요하면 사용자에게 받는다.

## Priority 2 — Document 색인

- RAG_DESIGN·ADR-0005/0006을 읽고 구현 계획을 쓴다: 원본(Project/Blog/Profile) → `document` upsert, PoC 청킹 규칙 이식, 임베딩(Spring AI, 기존 OpenAI 키), 발행 토글과 `document.visible` 같은 트랜잭션 갱신(관리 서비스의 create/update/delete에 연결), 색인 실패 상태.

## 해당 기능 착수 시

- Admin 화면: 도메인이 정해지면 ADR-0010 4절(CORS 허용 출처, 쿠키 SameSite)을 갱신한다.
- Chat: 질문 제한 집계 기준/기간/수치/해제 설정, 이력 보관·복원·만료·삭제 및 컨텍스트 상한. 정책 결정 후 관련 스키마를 확정한다.
- Graph: 라이브러리와 Skill/Category 노드 매핑. Document Relation 기준 ID·방향성은 ADR-0005를 유지한다.
- 이미지 업로드: S3 접근 정책과 리전. Markdown 본문 저장 위치는 이미 content_section.body_markdown으로 정했다.
- 색인: 원본 변경/삭제 시 동기화, 실패 재시도 및 중복 실행을 검증한다. 공개 범위는 ADR-0005의 조회 시점 필터를 유지한다.
- 배포: Vercel 무료 조건과 저장소 연결, Lightsail/RDS 사설 연결, 메모리 부하와 실제 비용을 검증한다.

## 남은 검증과 콘텐츠 확인

- pgvector HNSW 검색은 PoC의 메모리 코사인 검색과 별도로 검증한다.
- 세션 평가 RAG-005/006/008/009/010은 구현 후 측정한다.
- 콘텐츠 변경 시 --save로 재측정하고 RAG_MEASUREMENTS에 기록한다. Hybrid search는 도입 확정이 아니다.
- 샘플 front matter의 open_questions와 AI 블로그 초안의 사실·문체를 사용자에게 확인한다.
- OpenAI API 키는 기존 키를 사용한다(2026-09-16 사용자 결정). 사용량 이상 시 재발급을 검토한다.

## Recommended Next Session Prompt

> 공통 규칙과 세션 문서를 읽고, samples/의 콘텐츠를 로컬 DB에 등록하는 시드 방식을 사용자와 정한 뒤 구현하자. 이어서 Document 색인 계획을 작성하자.
