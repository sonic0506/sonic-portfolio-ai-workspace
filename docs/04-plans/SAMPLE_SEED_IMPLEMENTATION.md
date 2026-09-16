# Sample Seed Implementation

Status: Done (2026-09-16)

**Goal:** `samples/`의 콘텐츠를 로컬 DB에 넣어 공개 API·Swagger를 실데이터로 확인하고, Document 색인의 입력을 만든다.

## 결정 (2026-09-16 사용자)

- 프로필: 한 줄 소개 A(기본형), 짧은 소개글 기본 4문장, 고객사명 실명 표기
- 기존 샘플 프로젝트 3건(비오라·유진로봇·싱크마스터)은 프리랜서 프로젝트
- 시드 방식: local 전용 시드 명령(관리 서비스 경유) — Claude 추천안

## 작업

- [x] `samples/profile-draft.md`: 사용자 제공 프로필 초안 원문 보관
- [x] `samples/profile.md`: 시드용 프로필(front matter + 섹션). 사실 충돌·미확정은 `open_questions`(관리자 전용)에 기록
- [x] `samples/taxonomy.md`: 블로그 카테고리·태그 표시명 → code 표. 표에 없는 이름은 시드 실패
- [x] `samples/skills.md`: 프로필 기술 17개 추가
- [x] `seed/SampleMarkdown`(front matter + `## ` 섹션 분리), `seed/SampleSeeder`(관리 서비스로 upsert), `seed/SampleSeedRunner`(`local` + `app.seed.samples-dir`일 때만)
- [x] 테스트 전용 DB 분리: `test` 프로필 → `portfolio_test`, `docker/init-test-db.sql`
- [x] `SampleSeederTest` 2건: 실제 `samples/` 등록 후 공개 API 확인, 재실행 시 행 수 불변

## 매핑 규칙

- 프로젝트 `id` → slug, `period_start`/`period_end` `YYYY-MM` → 월 1일, `open_questions` → `admin_note`, 파일 이름순 → `display_order`
- 블로그 `sample_note`·`draft_note` → `admin_note`, `created_at`/`updated_at` → 발행일·생성일·수정일(시드 전용 JDBC 보정)
- `skills`(표시명)는 `skills.md`의 name으로, 프로필 `skills`는 code로 찾는다
- `related_*`(Relation)는 넣지 않는다 — Document 색인 이후
- `:::questions` 블록은 본문 그대로

## 발견·수정한 문제

- `samples/projects/viora.md` front matter YAML 오류(따옴표 뒤 텍스트) → 「」로 교체. 파싱 오류 메시지에 파일 경로 추가
- `CASE WHEN ... THEN ? END` 파라미터를 PostgreSQL이 text로 추론 → `cast(? as timestamptz)`
- JDBC 날짜 보정 후 같은 트랜잭션의 JPA 조회가 캐시된 옛 값 반환 → 보정 후 flush·clear
- 테스트가 개발 DB를 공유해 시드 데이터의 FK 때문에 실패 → 테스트 전용 DB `portfolio_test`로 분리

## 결과

- 사용자 로컬 실행(16:17 KST): 전체 54건 통과, 테스트가 `portfolio_test`를 사용함을 확인
- 사용자가 개발 DB에 시드를 실행했다(테스트 실패 원인에서 확인)

## 사용자 확인이 필요한 사실 (profile.md `open_questions`)

1. 초안의 「백엔드 코드 작성 경험 없음」 문구가 프리랜서 유진로봇(NestJS 중앙 관제 서버 단독 개발)과 충돌 → 시드 본문에서 제외. 초안도 수정 필요
2. 프리랜서 기간(2024/11~2025/04)과 SK 쉴더스(2024/08~2026/03) 겹침
3. 비오라 샘플의 소속(사내 프로덕트)·기간(2026/07~ 진행 중)이 「프리랜서」 답변·퇴사 시점과 맞지 않음 → 데이터는 샘플 그대로
4. 연차(6년차 vs 기록 4년 7개월), SI 회사명·공개 여부, 이메일 공개 여부
5. 스킬 그룹 배치(Spring Boot=LEARNING, Claude Code·Codex=COLLABORATION)와 프로필 추천 질문 2개는 Claude 제안
