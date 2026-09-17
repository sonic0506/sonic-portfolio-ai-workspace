# Frontend Implementation

Status: In Progress (1단계 작성, 사용자 로컬 검증 대기)
Last Updated: 2026-09-17

기준: [ADR-0012](../03-decisions/ADR-0012-frontend-tooling.md), API 계약은 [API_DESIGN](../02-design/API_DESIGN.md).

## 사용자 결정 (2026-09-17)

| 항목 | 선택 |
|---|---|
| 스타일 | Tailwind CSS + shadcn/ui |
| 어드민 데이터·폼 | TanStack Query + React Hook Form + Zod, 라우터는 React Router |
| 개발 중 API 호출 | 개발 서버 프록시(Next rewrites / Vite proxy). CORS는 쓰지 않는다 |
| Node | 22.22 이상 또는 24 |

## 구조와 버전 (컨테이너에서 설치·빌드로 확인)

```
package.json            # 루트 스크립트, packageManager pnpm@12.4.2, engines node >=22.22.0
pnpm-workspace.yaml     # packages: frontend/*
pnpm-lock.yaml
frontend/portfolio      # portfolio-web — Next.js 16.3.5 (App Router, src/), React 19.2.8
frontend/admin          # portfolio-admin — Vite 8.3 + React 19.2.8 + React Router 8.4 (SPA)
```

- 공통: Tailwind 4.3, TypeScript(Next 5.x / Admin 6.0), Vitest 5.0.1(jsdom), lucide-react, clsx·tailwind-merge·class-variance-authority.
- Portfolio: react-markdown 10 + remark-gfm + remark-directive(`:::questions`), ESLint 9(eslint-config-next).
- Admin: TanStack Query 5.102, React Hook Form 7.88, Zod 4.6, @hookform/resolvers 5.9, oxlint.
- Next 16 주의: `params`/`searchParams`는 Promise, `PageProps<'/route'>` 전역 타입(`next typegen`/빌드 시 생성), fetch는 기본 캐시 없음. 생성된 `frontend/portfolio/AGENTS.md`가 `node_modules/next/dist/docs`를 먼저 읽으라고 안내한다.

### shadcn/ui 적용 방식

레지스트리(ui.shadcn.com)가 작업 환경 프록시에서 막혀(403) `shadcn add`를 실행하지 못했다. 같은 구조(new-york, neutral, CSS 변수)로 Button·Badge·Card·Textarea(+ Admin Input·Label)를 `components/ui/`에 직접 옮겼고 `components.json`을 두었다. 사용자 Mac 터미널에서는 `pnpm dlx shadcn@latest add <컴포넌트>`로 이어서 추가할 수 있다(미검증).

## 개발 실행

```bash
corepack enable              # pnpm 12.4.2 (packageManager)
pnpm install                 # 루트에서
pnpm test && pnpm lint && pnpm build
pnpm dev:portfolio           # http://localhost:3000
pnpm dev:admin               # http://localhost:5173
```

- 백엔드는 `http://127.0.0.1:8080`(local 프로필은 127.0.0.1에만 바인딩). 바꾸려면 `API_BASE_URL` 환경 변수. `localhost`로 두면 Node가 `::1`(IPv6)로 먼저 연결해 실패할 수 있다(2026-09-17 사용자 Mac에서 포트폴리오 오류 화면 발생).
- Portfolio: 서버 컴포넌트 조회는 `API_BASE_URL`로 직접, 브라우저의 채팅 `/api/*`는 `next.config.ts` rewrites로 전달. 모든 페이지는 `force-dynamic`(빌드 시 백엔드 불필요, 캐시 정책은 배포 때 정한다).
- Admin: `vite.config.ts` 프록시가 `/api`를 8080으로 전달. 로그인은 `http://localhost:8080/oauth2/authorization/github`로 이동(`VITE_LOGIN_URL`로 변경). 백엔드 `.env`에 `ADMIN_LOGIN_SUCCESS_URL=http://localhost:5173/`을 두면 로그인 후 어드민으로 돌아온다. 쿠키는 포트를 구분하지 않고 localhost끼리는 same-site라 세션(`SameSite=Lax`)과 `XSRF-TOKEN`이 공유된다.

## 1단계 범위 (이번 작업)

### Portfolio
- [x] 레이아웃·헤더, 홈(프로필 한 줄 소개 + 대표 프로젝트), 프로젝트 목록/상세, 블로그 목록(페이지·카테고리·태그 필터)/상세, 소개(경력·스킬 그룹·섹션), 404·오류 화면
- [x] Markdown 렌더링, `:::questions` 블록 → "이 내용에 대해 물어보기" 버튼(누르면 채팅으로 바로 질문). 다른 지시문 문법은 원문 유지
- [x] 채팅 위젯: 세션 발급·localStorage 저장·새로고침 복원, 404면 새 세션으로 1회 재시도, SSE(fetch 스트림) 단계 표시·답변 조각·출처(FAQ는 링크 없음)·`unanswered` 안내, 400/409/429/503 문구, 새 대화(서버 세션 삭제), "24시간 뒤 삭제" 안내
- [x] 테스트: SSE 파서(분할 수신, Spring 형식·표준 형식), `:::questions` 변환

### Admin
- [x] 로그인 확인(`/api/admin/me`, 401이면 로그인 화면), 로그아웃, 세션 만료(401) 시 로그인 화면 복귀, 변경 요청 CSRF 헤더
- [x] 답하지 못한 질문: 상태별 목록·페이지, 당시 답변·검색 문서 거리, 해결/무시/다시 열기·메모, 삭제, "FAQ로 등록"
- [x] FAQ: 목록·생성·수정·삭제(RHF+Zod), 미답변에서 넘어오면 `fromUnansweredId` 전송
- [x] 색인 상태: 문서 목록(진행 중이면 3초마다 갱신), 대기·실패 색인, 전체 재색인(확인창)
- [x] 테스트: API 래퍼(CSRF 헤더·Problem Detail), FAQ 스키마

### 컨테이너 검증 (2026-09-17)
- `pnpm install`, 두 앱 `build`·`lint`·`test`(Portfolio 4건, Admin 5건) 통과.
- 가짜 백엔드(8080)로 `next dev` 확인: 페이지 200, 없는 slug 404, rewrites를 거친 SSE가 0.5초 간격 그대로 도착(버퍼링 없음), 브라우저에서 추천 질문 클릭 → 답변 표시·localStorage 저장, 콘솔 오류 없음. Admin은 401 시 로그인 화면·로그인 링크 확인.
- 사용자 Mac 첫 실행(2026-09-17)에서 두 결함을 고쳤다: ① 백엔드 주소 `localhost` → `127.0.0.1`(IPv6 연결 실패), ② `skills`가 문자열이 아니라 `SkillResponse{id, code, name, iconKey}` 배열인데 문자열로 가정해 렌더링 오류. 가짜 백엔드가 잘못된 가정을 그대로 따라 컨테이너 검증에서 놓쳤다. 이후 응답 타입은 백엔드 record와 대조한다.
- 수정 후 사용자 Mac에서 포트폴리오 조회 화면 정상 노출, 루트 `pnpm test && pnpm lint && pnpm build` 통과(2026-09-17).
- 사용자 확인 대기: 실제 모델 채팅(스트리밍·복원·새 대화), 어드민 GitHub 로그인 복귀·FAQ 등록(CSRF)·색인 화면.
- 미검증: 위 사용자 확인 대기 항목.

## 2단계 이후

1. 어드민 콘텐츠 관리: 프로젝트·블로그(섹션 편집, 카테고리·태그·기술 선택)·프로필·기술·카테고리/태그.
2. 공개 상세의 관련 문서 표시(Relation API 이후), Graph View, RAG Playground.
3. 디자인 다듬기(타이포그래피, 다크 모드 점검, 이미지·썸네일), SEO 메타데이터.
4. 배포: Vercel(Portfolio), 어드민 정적 배포 위치와 도메인(ADR-0010 4절), 캐시/재검증 정책.
