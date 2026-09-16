# ADR-0010: Admin Authentication (GitHub OAuth + Server Session)

- Status: Accepted
- Date: 2026-09-16

## Context

ADR-0002는 관리자 로그인을 GitHub으로 하고 운영자 본인 계정만 허용한다고 정했지만 계정 식별자와 세션 방식은 남겨두었다. Admin CRUD를 시작하려면 이것이 필요하다.

2026-09-16 사용자 답변:

1. 허용 계정: GitHub `sonic0506` (계정 이메일 xonic0506@gmail.com)
2. 세션 방식: 추천안으로 진행
3. Admin 프론트 도메인: 미정

## Decision

### 1. 로그인과 허용 계정

- Spring Security `oauth2Login`으로 GitHub OAuth App을 사용한다. 요청 권한은 `read:user` 하나다.
- GitHub 인증 성공만으로 권한을 주지 않는다. 사용자 정보의 `login`이 설정값 `app.admin.github-login`(기본 `sonic0506`, 대소문자 무시)과 같을 때만 `ROLE_ADMIN`을 부여하고, 아니면 로그인을 실패 처리한다.
- `app.admin.github-id`(GitHub 숫자 ID)를 설정하면 login 대신 숫자 ID로 대조한다. GitHub login은 계정 이름 변경 후 다른 사람이 재사용할 수 있기 때문이다. 2026-09-16 실제 로그인으로 숫자 ID `159202139`를 확인해 기본값으로 설정했다(아바타 URL `/u/159202139`). 따라서 현재 판정 기준은 숫자 ID이며 login은 ID 미설정 시의 대체 기준이다.
- 이메일로는 대조하지 않는다. GitHub 이메일은 비공개 설정일 수 있고 `read:user`만으로는 받지 못할 수 있다. 이메일은 저장소에 기록하지 않는다.
- 두 값이 모두 비어 있으면 아무도 관리자가 될 수 없다(fail closed).

### 2. 세션: 서버 세션 쿠키 (추천안)

- 로그인 상태는 서버 메모리 세션(`JSESSIONID`)으로 유지한다. JWT를 쓰지 않는다. 관리자 1명·서버 1대(ADR-0003)라 무상태 토큰의 이점이 없고, 브라우저 저장소에 토큰을 두지 않아도 된다.
- 쿠키: `HttpOnly`, `SameSite=Lax`, 운영은 `Secure`. 세션 만료 8시간.
- 서버 재시작 시 다시 로그인해야 한다. 관리자 1명이므로 수용한다. 인스턴스를 늘리면 Spring Session JDBC를 검토한다.

### 3. CSRF와 API 응답

- 세션 쿠키를 쓰므로 CSRF 보호를 켠다. 토큰은 `XSRF-TOKEN` 쿠키(스크립트가 읽을 수 있음)로 내려주고, 변경 요청은 `X-XSRF-TOKEN` 헤더로 보낸다. `GET /api/admin/me`가 토큰 쿠키를 발급한다.
- `/api/**`에 인증 없이 접근하면 로그인 페이지로 리다이렉트하지 않고 `401`을 준다. 권한이 없으면 `403`.
- 로그아웃은 `POST /api/admin/logout`(CSRF 필요) → `204`.
- 로그인 실패(허용되지 않은 계정 포함)는 리다이렉트하지 않고 `403`이다.

### 4. CORS와 도메인 (미정 부분)

- 도메인이 정해지지 않았으므로 허용 출처는 설정값 `app.cors.allowed-origins`로만 두고 기본은 비워 둔다(CORS 비활성).
- 권장 배치: Admin 화면과 API를 **같은 사이트**(예: `admin.<도메인>`과 `api.<도메인>`, 또는 같은 호스트의 경로)로 둔다. 그래야 `SameSite=Lax` 세션 쿠키가 그대로 동작한다. 서로 다른 사이트로 두면 `SameSite=None`과 CORS 자격 증명 설정이 필요하고 CSRF 위험이 커진다.
- 도메인이 정해지면 이 절을 갱신한다.

## Alternatives Considered

- **JWT(액세스/리프레시 토큰):** 토큰 저장 위치, 만료·폐기 처리가 추가된다. 관리자 1명 규모에서는 비용만 늘어난다.
- **Spring Session JDBC:** 재시작 후에도 로그인이 유지되지만 테이블과 정리 작업이 추가된다. 인스턴스가 1대라 지금은 필요 없다.
- **이메일 대조:** 위 1절 이유로 채택하지 않았다.

## Consequences

- GitHub OAuth App(Client ID/Secret)은 사용자가 직접 등록한다. 로컬 콜백은 `http://localhost:8080/login/oauth2/code/github`. 값은 `backend/.env`의 `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`에만 둔다. 등록 전에는 서버가 기동되지만 실제 로그인은 실패한다.
- 실제 GitHub 로그인 흐름은 자동 테스트로 검증하지 않는다. 허용 판정 로직과 인가·CSRF·401/403 동작만 테스트한다.
- 2026-09-16 수동 확인: 로컬 `bootRun`에서 GitHub 로그인 후 `/api/admin/me`가 `login: sonic0506`을 반환했다(login 기준 판정 시점). 허용되지 않은 다른 계정으로 로그인하면 실패 후 `/login?error` 리다이렉트 → 재인증 → GitHub 즉시 승인이 반복되는 무한 루프가 있었다. 실패 시 리다이렉트하지 않고 `403`(Boot 기본 오류 페이지)을 주도록 고쳤고, 수동으로 루프가 멈추는 것을 확인했다(회귀 테스트 `failedLoginAnswers403InsteadOfRedirectLoop`).
- 로그인 실패 응답은 `403`이다. Admin 화면이 생기면 전용 안내 페이지로 바꿀 수 있다.
- 도메인 결정 시 CORS·쿠키 설정을 다시 확인해야 한다.

## Related Documents

- [ADR-0002](ADR-0002-operating-budget-auth-and-limits.md)
- [ADR-0003](ADR-0003-initial-deployment.md)
- [API Design](../02-design/API_DESIGN.md)
