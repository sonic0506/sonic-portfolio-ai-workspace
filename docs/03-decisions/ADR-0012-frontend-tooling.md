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

### 후속 결정 2 — 2026-09-29 (포트폴리오 디자인: sonic-portfolio 적용)

사용자가 별도 저장소 `sonic-portfolio`(같은 Next 16 + Tailwind 4 + shadcn, 목업 데이터)의 UI/UX를 포트폴리오에 적용하기로 했다. 검토 후 사용자 결정:

- **URL은 현재 것을 유지한다**(`/projects`, `/blog`, `/profile`). 새 경로는 채팅 `/chat`, `/chat/[id]`뿐이다. 블로그 카테고리 목록은 `/blog?category=code`.
- **톤앤매너만 맞추고 데이터에 없는 UI는 뺀다**: 프로젝트 태그·상태·NDA·지표·케이스 스터디 카드, 이어서 생성, 다시 생성 등.
- **다크·라이트 모두 지원**: sonic 원본은 다크 전용이라 라이트 토큰을 새로 정의했다. 기본은 시스템 설정, 사이드바 하단 버튼으로 시스템 → 라이트 → 다크 순환(`next-themes`, `<html class="dark">`).
- 블로그 카테고리 단일 선택(ADR-0005 후속 3), 대화 여러 개(ADR-0011 후속)도 같은 검토에서 정했다.
- 그래프 화면은 다른 작업 뒤에 한다. 노드는 프로젝트·블로그·스킬·카테고리, 노드 UI 확장(GRAPH_DESIGN). 라이브러리는 그때 ADR로 정한다(sonic은 `react-force-graph-2d` + `d3-force`).
- 추가 의존성(portfolio-web): `radix-ui`, `next-themes`, `simple-icons`, `lottie-react`(2.x — 3.x는 API가 달라 고정), `tw-animate-css`, `shadcn`(CSS import용). Storybook·React Compiler는 가져오지 않았다.
- 폰트는 sonic과 같이 CDN(`Wanted Sans`, `Pretendard`, `JetBrains Mono`)에서 불러온다. `next/font` 전환은 SEO·성능 작업 때 검토한다.

## Alternatives Considered

- npm / yarn: 사용자가 pnpm을 선택했다.
- 어드민도 Next.js: 서버 렌더링이 필요 없는 로그인 전용 화면이라 SPA가 단순하다.

## Consequences

- 로컬에 pnpm(Corepack)이 필요하다.
- 어드민을 정적 배포할지, 어디에 둘지는 도메인 결정과 함께 정한다(ADR-0010 4절: 세션 쿠키 때문에 API와 같은 사이트 권장).
