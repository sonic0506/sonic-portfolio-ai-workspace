# Admin Auth Implementation

Status: Done (2026-09-16)

**Goal:** GitHub 로그인으로 운영자 본인만 관리자 API를 쓰게 하고, 첫 관리자 쓰기 기능으로 Skill 관리를 연다.

**Spec:** [ADR-0002](../03-decisions/ADR-0002-operating-budget-auth-and-limits.md), [ADR-0010](../03-decisions/ADR-0010-admin-authentication.md), [API_DESIGN](../02-design/API_DESIGN.md) Admin API.

## Tasks

- [x] ADR-0010 작성 — 사용자 답변(계정 sonic0506, 세션 추천안, 도메인 미정) 반영
- [x] `admin` 패키지: `AdminAccessPolicy`(숫자 ID 우선, login 대체, 미설정 시 거부), `AdminOAuth2UserService`(허용 계정만 `ROLE_ADMIN`), `GET /api/admin/me`
- [x] `SecurityConfig`: `oauth2Login`, `/api/**` 401 진입점, 쿠키 CSRF, `POST /api/admin/logout` 204, 설정값 기반 CORS(기본 꺼짐), 로그인 실패 403
- [x] 설정: GitHub OAuth 등록값은 `.env`(`GITHUB_CLIENT_ID/SECRET`), 허용 ID 기본 `159202139`, 세션 쿠키 HttpOnly·SameSite=Lax·Secure(local은 false)·8시간
- [x] Skill 관리 `POST/PUT/DELETE /api/admin/skills` — 형식 검증 400, 중복 409, 참조 중 삭제 409, 경쟁 조건의 DB 제약 위반도 409(`ApiExceptionHandler`)
- [x] 개발 편의: `spring-boot-devtools`(developmentOnly), README 실행 방법

## 결과

- 사용자 로컬 실행(14:39 KST): `./gradlew clean test bootJar` 성공, 전체 34건 통과. 추가 테스트: AdminAccessPolicyTest 3, AdminSecurityTest 6, CsrfCookieTest 1, SkillAdminApiTest 6.
- 수동 확인: 본인 계정 로그인 → `/api/admin/me` 응답 확인. 다른 계정 → `403` 오류 페이지에서 멈춤.
- 발견·수정한 문제:
  - 로그인 실패 시 무한 리다이렉트 루프 → 실패 시 403.
  - `HttpStatusReturningLogoutSuccessHandler` 기본값이 200 → 204 명시.
  - 테스트 트랜잭션에서 삭제가 flush되지 않음 → 삭제 후 flush.
  - spring-security-test의 `csrf()`가 공유 CsrfFilter 저장소를 세션 방식으로 바꿔 쿠키 검증이 순서에 따라 실패 → `CsrfCookieTest`를 새 컨텍스트(`@DirtiesContext`)로 분리.
- 미검증: 숫자 ID 기준 전환 후 본인 계정 재로그인(다른 계정 거부는 확인), 실제 Admin 화면에서의 CSRF 헤더 전송, 운영 HTTPS 쿠키.
