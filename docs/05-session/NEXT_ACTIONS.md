# Next Actions

Last Updated: 2026-09-16

## 현재 기준

전체 MVP 및 월 10만 원 예산은 유지한다. ADR-0001~0009는 Accepted다. 콘텐츠 모델·ERD 초안과 샘플 RAG 평가는 완료되어 다시 선정하지 않는다.

## Priority 1 — Project / Blog / Profile 관리 CRUD

관리자 인증과 Skill 관리(ADMIN_AUTH_IMPLEMENTATION)는 2026-09-16 완료·커밋했다.

1. `docs/04-plans/`에 관리 CRUD 구현 계획을 작성한다. 대상: Project(기본 정보·하이라이트·기술·섹션), Blog(카테고리·태그·기술·섹션), Profile(경력·스킬 그룹·섹션), Category/Tag.
2. 수용 기준에 넣을 것:
   - 관리자 조회는 비공개 항목과 `adminNote`를 포함한다(공개 API와 분리된 `/api/admin/...` 응답).
   - 섹션·하이라이트·기술 연결은 "목록 전체 교체" 방식으로 순서(display_order)까지 저장한다.
   - `updated_at` 갱신, slug 중복 409, 발행 토글 시 `published_at` 설정 규칙.
   - 발행 토글과 `document.visible` 동기화(ADR-0005)는 Document 색인 계획과 연결 지점만 적는다.
3. `SkillAdminService`·`SkillAdminApiTest` 방식(서비스 사전 검사 + `ApiExceptionHandler`, `admin()` + `csrf()`)을 따른다.
4. 로컬: DB는 Docker, 개발 중 자동 반영은 `compileJava --continuous` + `bootRun`(README).

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

> 공통 규칙과 세션 문서를 읽고, ADR-0005·DATA_MODEL·API_DESIGN(Admin API)을 참고해 Project/Blog/Profile 관리 CRUD 구현 계획을 작성하고 진행하자.
