# Deployment Plan

Status: Draft
Last Updated: 2026-10-04

## 목표 구성

[ADR-0017](../03-decisions/ADR-0017-single-server-docker-deployment.md) 기준이다.

```
www.sonic-portfolio.com   → Vercel (portfolio, Next.js)
admin.sonic-portfolio.com → Vercel (admin, Vite 정적 빌드)
api.sonic-portfolio.com   → Lightsail 4GB: caddy → api(Spring) → db(pgvector)   [Docker Compose]
```

## 결정 상태

| 항목 | 상태 |
|---|---|
| 서버: Lightsail 4GB, Docker Compose(api·db·caddy), RDS 미사용 | 확정 (ADR-0017) |
| 프론트: Vercel Hobby 2개 프로젝트 | 확정 (ADR-0003) |
| 도메인 | 확정 (2026-10-04): `sonic-portfolio.com` — `www`·`admin`·`api` 서브도메인 |
| admin의 API 경로 | 확정 (2026-10-04, ADR-0017): Vercel rewrite로 `/api`, `/oauth2`, `/login/oauth2`를 `api.sonic-portfolio.com`에 전달 |
| 포트폴리오 채팅 경로 | 확정 (2026-10-04, ADR-0017): 브라우저가 `api.sonic-portfolio.com`을 직접 호출하고 공개 API에만 CORS 허용 |
| 백업 | 확정 (2026-10-04): 우선 Lightsail 자동 스냅샷만. `pg_dump` 외부 보관은 나중에 |

### 경로 결정 근거

- **admin rewrite**: 세션 쿠키와 `XSRF-TOKEN`이 `admin.sonic-portfolio.com` 한 호스트에 붙는다. 그래서 admin 코드(`api.ts`의 상대 경로, `readCookie`)와 ADR-0010의 `SameSite=Lax`를 그대로 쓸 수 있다. 콜백 주소는 `spring.security.oauth2.client.registration.github.redirect-uri`로 고정해 프록시 헤더에 의존하지 않는다. 성공 URL(`ADMIN_LOGIN_SUCCESS_URL`)은 전체 주소로 두고, 로그인 링크(`VITE_LOGIN_URL`)는 상대 경로로 둔다.
- **채팅 직접 호출**: Vercel rewrite를 거치면 백엔드가 보는 IP가 Vercel IP가 되어 IP당 질문 제한이 전체 공용이 된다. 채팅은 로그인 쿠키를 쓰지 않으므로(ADR-0011, ADR-0016) 자격 증명 없는 CORS로 충분하다.
- 미검증: Vercel 외부 rewrite의 `Set-Cookie`/`Location` 전달, 오래 걸리는 관리 요청(재색인)의 Vercel 프록시 시간 제한.

## 작업 순서

### 0. 브랜치 정리
- [ ] `feat/graph` 화면 확인 후 `main` 병합. 배포 기준은 `main`.

### 1. 코드 준비
- [x] `application-prod.properties`: DB 환경변수, OpenAI 켜기, `server.forward-headers-strategy=native`(Caddy는 Docker 사설망이라 Tomcat 기본 신뢰 대역), GitHub `redirect-uri` 고정, 성공 URL·CORS 출처. health는 익명 허용(`SecurityConfig`).
- [x] `backend/Dockerfile`(로컬 빌드 jar 실행, amd64), `deploy/compose.prod.yaml`(메모리 상한 db 1g·api 1.5g·caddy 256m, 로그 10MB×3, db 포트는 서버 127.0.0.1에만), `deploy/Caddyfile`(SSE는 Caddy 기본 동작으로 즉시 전달). 절차는 `deploy/README.md`.
- [x] 포트폴리오: 채팅 호출에 `NEXT_PUBLIC_API_BASE_URL` 적용(`lib/chat-api.ts`, 비어 있으면 개발용 상대 경로). CORS는 `/api/chat/**`에만, 자격 증명 없이.
- [x] admin: `vercel.json`(rewrite + SPA fallback), `.env.production`(`VITE_LOGIN_URL` 상대 경로).
- [ ] (선택) `force-dynamic` → `revalidate` (FRONTEND_IMPLEMENTATION 3단계).
- [x] **로컬 메모리 측정** (2026-10-04, 아래 "메모리 실측" 참고).
- 검증: `./gradlew test`, `pnpm test && pnpm lint && pnpm build`.

### 2. AWS·외부 서비스 (사용자가 콘솔에서 직접)
- [ ] 루트 MFA, IAM 사용자, AWS Budgets 알림(예: 7만·10만 원).
- [ ] Lightsail 서울 4GB 생성, 고정 IP, 방화벽 22(본인 IP)/80/443.
- [ ] 도메인 DNS: `api` → 고정 IP, `www`·`admin` → Vercel.
- [ ] GitHub OAuth App(운영): 콜백 `https://admin.sonic-portfolio.com/login/oauth2/code/github`.
- [ ] OpenAI 사용량 한도 설정.

### 3. 서버 구성
- [ ] Docker 설치, swap, `unattended-upgrades`.
- [ ] 비밀값은 서버의 env 파일(권한 600)에만 둔다. 저장소에 커밋하지 않는다.
- [ ] 이미지 전달 → `docker compose up -d` → Flyway V1~V5 적용 → `https://api.sonic-portfolio.com/actuator/health` 확인.
- [ ] 첫 배포 때 한 번만 `content/` 시드: 시드는 local 프로필 전용이라 Mac에서 SSH 터널로 운영 DB에 붙어 실행(`deploy/README.md` 3절) → 어드민에서 색인 확인.
- [ ] Lightsail 자동 스냅샷 활성화, **복원 1회 연습**.

### 4. 프론트 배포
- [ ] Vercel portfolio: Root `frontend/portfolio`, Node 22, `API_BASE_URL`, `NEXT_PUBLIC_API_BASE_URL`, 도메인 `www`.
- [ ] Vercel admin: Root `frontend/admin`, 도메인 `admin`.

### 5. 운영 확인
- [ ] QA_CHECKLIST: 조회, 그래프, 채팅 SSE, 관리자 로그인(본인 성공, 다른 계정 403), CSRF.
- [ ] 질문 제한: 서로 다른 네트워크 두 곳에서 따로 집계되는지, `CHAT_LIMIT_EXEMPT_IPS`가 동작하는지.
- [ ] 메모리·CPU 관찰, 1주 후 실제 청구액과 계산값(약 56,100원) 비교.

## 위험

| 위험 | 대응 |
|---|---|
| Vercel rewrite에서 로그인 쿠키 전달 실패 | 첫 배포 때 확인. 실패하면 admin 정적 파일을 Caddy에서 서비스(프론트 코드 변경 없음) |
| 스냅샷만으로는 마지막 스냅샷 이후 변경(최대 하루)을 잃음 | 수용(2026-10-04). 필요해지면 `pg_dump` 외부 보관 추가 |
| 메모리 부족 | 컨테이너별 상한, 로컬 실측, swap |
| OpenAI 비용 급증 | 전체 하루 300회 제한, OpenAI 사용량 한도, Budgets 알림 |
| 운영 DB 시드 실수 | 시드는 첫 배포 때 한 번만, 실행 전 스냅샷 |

## 코드 준비 검증 (2026-10-04)

- 백엔드 `./gradlew test` 124건 통과(신규 `DeploymentAccessTest` 4건: 채팅 preflight 허용·자격 증명 없음, 관리 API CORS 없음, 다른 출처 거부, health 익명).
- `prod` 프로필 jar를 로컬 개발 DB로 기동: health UP, `www` 출처 채팅 preflight 허용, 관리 API에는 CORS 헤더 없음, GitHub 인가 요청의 `redirect_uri=https://admin.sonic-portfolio.com/login/oauth2/code/github`, Swagger 닫힘.
- Spring Security 7.1.1 `OAuth2AuthorizationCodeAuthenticationProvider`는 콜백에서 state만 비교하고 redirect URI는 비교하지 않음을 바이트코드로 확인했다. 고정 redirect-uri가 Vercel rewrite 뒤에서도 동작하는 근거다.
- `docker build --platform linux/amd64` 성공(약 260MB). `docker-compose config` 통과(db 5432는 127.0.0.1에만 게시).
- 미검증: Caddyfile 문법(로컬에서 caddy 이미지 실행이 멈춰 확인 못 함), 실제 방문자 IP 판별(X-Forwarded-For), Vercel rewrite의 쿠키 전달.

## 메모리 실측 (2026-10-04)

운영과 같은 메모리 상한(api 1536m, db 1g, `shared_buffers=256MB`, `max_connections=30`, JVM `MaxRAMPercentage=60`)으로 로컬 Docker(arm64 네이티브 이미지, 새 DB)에서 측정했다. 시드와 색인이 컨테이너 안에서 돌도록 api는 local 프로필로 띄웠고 실제 OpenAI 임베딩·답변을 호출했다. `docker stats`를 약 1~2초 간격으로 기록했다.

| 구간 | api 최대 | db 최대 | 합계 |
|---|---:|---:|---:|
| 기동 + 시드 + 전체 색인(19건 READY, 약 10초) | 366 MiB | 73 MiB | 440 MiB |
| 채팅 5개 순차 | 400 MiB | 74 MiB | 474 MiB |
| 채팅 3개 동시 | 407 MiB | 74 MiB | 482 MiB |
| 유휴 20초 | 407 MiB | 75 MiB | 482 MiB |

- OOM이나 재시작은 없었다. api는 상한의 약 27%, db는 약 7%를 썼다.
- Caddy(측정 안 함, 보통 수십 MiB)와 OS·Docker(약 300MB 추정)를 더해도 4GB 서버에서 1GB 안팎이다. 2GB 서버로도 들어갈 수치지만 이번 결정(4GB)은 유지한다.
- 한계: 1~2초 간격이라 짧은 순간 최대치는 놓쳤을 수 있다. JVM은 힙을 천천히 늘리므로 오래 운영하면 api 사용량이 올라갈 수 있다(상한 1536m 안). 운영 서버에서 `docker stats`로 다시 본다.
