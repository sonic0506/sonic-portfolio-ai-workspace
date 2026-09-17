# ADR-0012: Frontend Apps and Tooling

- Status: Accepted
- Date: 2026-09-16

## Context

ADR-0001은 Public은 Next.js, Admin은 React로 정했고, 패키지 관리·빌드 도구는 프론트 착수 시 정하기로 했다(ARCHITECTURE). 백엔드가 공개 조회·관리·채팅 API를 갖췄다.

## Decision

- 포트폴리오(Public) 사이트: **Next.js** (사용자 확인, 2026-09-16). 배포는 Vercel Hobby(ADR-0003).
- 어드민: **React + Vite** (사용자 선택).
- 패키지 매니저: **pnpm** (사용자 선택). 두 앱을 같은 저장소에서 pnpm workspace로 관리한다.
- 버전 고정·디렉터리 구조·라우팅·상태 관리 등 세부는 프론트 구현 계획에서 정하고 실제 설치로 검증한다.

### 후속 결정 — 2026-09-17 (사용자 선택)

- 스타일: Tailwind CSS + shadcn/ui.
- 어드민: React Router + TanStack Query + React Hook Form + Zod.
- 개발 중 API 호출: 개발 서버 프록시(Next rewrites, Vite proxy). 배포 시 경로는 도메인 결정 때 정한다.
- Node 22.22 이상 또는 24, pnpm 12.4.2(Corepack).
- 구조: 루트 workspace의 `frontend/portfolio`, `frontend/admin`. 버전과 검증 결과는 [FRONTEND_IMPLEMENTATION](../04-plans/FRONTEND_IMPLEMENTATION.md).

## Alternatives Considered

- npm / yarn: 사용자가 pnpm을 선택했다.
- 어드민도 Next.js: 서버 렌더링이 필요 없는 로그인 전용 화면이라 SPA가 단순하다.

## Consequences

- 로컬에 pnpm(Corepack)이 필요하다.
- 어드민을 정적 배포할지, 어디에 둘지는 도메인 결정과 함께 정한다(ADR-0010 4절: 세션 쿠키 때문에 API와 같은 사이트 권장).
