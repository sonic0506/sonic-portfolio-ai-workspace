# Next Actions

Last Updated: 2026-09-16

## 현재 기준

전체 MVP 및 월 10만 원 예산은 유지한다. ADR-0001~0009는 Accepted다. 콘텐츠 모델·ERD 초안과 샘플 RAG 평가는 완료되어 다시 선정하지 않는다.

## Priority 1 — 콘텐츠 관리 CRUD 2단계 (Blog, Profile)

1단계(Project, Category/Tag)는 2026-09-16 완료·커밋했다. [ADMIN_CONTENT_CRUD_IMPLEMENTATION](../04-plans/ADMIN_CONTENT_CRUD_IMPLEMENTATION.md)의 "2단계 Tasks"를 진행한다.

1. Blog 관리: `ProjectAdminService` 구조(요청 검증 → JPA 본체 저장·flush → JDBC로 연결 목록 교체 → `SectionWriter`)를 그대로 따른다. `BlogPost.updated_at` 매핑을 쓰기 가능으로 바꾼다.
2. Profile 수정: 단일 행 upsert(`GET/PUT /api/admin/profile`), 경력·스킬 그룹·섹션 전체 교체. 그룹 값은 `SkillGroup` enum 이름만 허용.
3. 테스트는 `ProjectAdminApiTest` 방식(`admin()` + `csrf()`, 생성 후 공개 API 반영 확인).
4. 완료 후 다음 후보: 샘플 콘텐츠 시드(관리 API로 `samples/` 등록) → Document 색인 계획(발행 토글과 `document.visible` 동기화 연결).

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

> 공통 규칙과 세션 문서를 읽고, ADMIN_CONTENT_CRUD_IMPLEMENTATION의 2단계(Blog, Profile 관리)를 1단계 Project 관리 방식대로 진행하자.
