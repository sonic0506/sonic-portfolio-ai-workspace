# Frontend Implementation

Status: In Progress (1·2단계 완료, 3단계 디자인 적용 구현 — 사용자 확인 대기)
Last Updated: 2026-09-29

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
- Portfolio: 서버 컴포넌트 조회는 `API_BASE_URL`로 직접, 브라우저의 채팅 `/api/*`는 `next.config.ts` rewrites로 전달. 운영에서는 채팅도 `NEXT_PUBLIC_API_BASE_URL`로 api 도메인을 직접 부른다(ADR-0017, 2026-10-04). 모든 페이지는 `force-dynamic`(빌드 시 백엔드 불필요, 캐시 정책은 배포 때 정한다).
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
- 사용자 확인(2026-09-17): 새로고침 복원, FAQ 등록 → 해결 처리(CSRF 포함)·채팅 반영, 색인 화면 정상.
  - 답변이 한꺼번에 표시됨 → Next 개발 서버가 브라우저 요청에 gzip을 적용하며 SSE를 모아 보냄(가짜 백엔드로 재현). 백엔드 SSE 응답에 `Cache-Control: no-cache, no-transform`, `X-Accel-Buffering: no` 추가 → 실제 환경에서 조각별 표시 확인(백엔드 테스트 통과).
  - 로그인 후 `/api/admin/me`로 이동 → 사용자 `.env`에 `ADMIN_LOGIN_SUCCESS_URL`이 없었음. `.env`·`.env.example`에 추가, 5173 복귀 확인.
  - 로그인 버튼을 눌러도 반응이 없음 → GitHub로 이동하는 동안 버튼 잠금·"GitHub로 이동 중…" 표시(뒤로 가기 시 해제). 사용자 확인 완료.
  - 답변 본문의 근거 번호([1] 등)를 화면에서 제거(사용자 선택). 서버는 번호로 출처를 계산하고 저장 내용도 그대로이며, 출처는 답변 아래 목록으로만 보인다. 사용자 확인 완료.
  - 로딩 표시가 없어 멈춘 것처럼 보임 → 어드민 로그인 확인·목록·저장·재색인·로그아웃에 스피너, 포트폴리오 `loading.tsx` 추가(사용자 확인 완료).
- 미검증: 위 사용자 확인 대기 항목.

## 2단계 — 어드민 콘텐츠 관리 (2026-09-17 작성)

- [x] 메뉴: 프로젝트 · 블로그 · 프로필 · 기술·분류 추가
- [x] 프로젝트: 목록(공개·대표 표시), 생성·수정·삭제. 기본 정보·기간·기여도·링크·하이라이트·사용 기술(선택 순서 = 표시 순서)·본문 섹션(추가·순서 변경·삭제)·관리자 메모
- [x] 블로그: 목록(초안 표시), 생성·수정·삭제. 카테고리·태그·기술 선택, 본문 섹션
- [x] 프로필: 없으면(404) 빈 폼, 저장 시 생성·교체. 경력(순서 변경), 스킬 그룹 4개(한 기술은 한 그룹만 — 다른 그룹에서 쓰는 기술은 선택 불가), 본문 섹션
- [x] 기술·카테고리·태그: 한 화면에서 추가·수정·삭제
- 폼 값은 입력 문자열 그대로 두고 저장할 때 요청 모양으로 변환(`features/content-schemas.ts`). 검증 규칙은 백엔드 `*AdminRequest` record와 맞춤(slug·code 형식, 길이, URL, 기여도 0~100, 기간 역전, 이메일).
- 오류 문구: 400·403·404·409를 한국어로 안내하고 서버 detail을 괄호로 덧붙임.
- 저장하면 색인 상태 목록을 새로 읽는다(서버가 저장과 함께 재색인).
- 검증(컨테이너): 빌드·lint·테스트 13건. 가짜 백엔드로 브라우저 확인 — 프로젝트 수정 저장(PUT 본문의 기술 순서·섹션·null 변환·CSRF 헤더), 새 프로젝트 검증 문구, 프로필 최초 저장, 태그 추가. 프로필 첫 저장 후 폼이 다시 마운트되며 저장 표시가 사라지는 문제를 고쳤다.
- 사용자 확인(2026-09-17): 실제 백엔드로 프로젝트·블로그 저장·공개 반영·생성/삭제, 프로필 저장·불러오기, 기술·분류 편집, 중복 slug·사용 중 기술 삭제(409) 안내, 루트 test·lint·build 모두 정상.

## 3단계 — sonic-portfolio 디자인 적용 (2026-09-29)

결정은 [ADR-0012 후속 결정 2](../03-decisions/ADR-0012-frontend-tooling.md), [ADR-0011 후속](../03-decisions/ADR-0011-chat-session-retention.md), [ADR-0005 후속 3](../03-decisions/ADR-0005-content-and-document-model.md). 브랜치 `feat/sonic-ui`.

- [x] 백엔드: 블로그 카테고리 단일화(V4), 공개 `GET /api/blog/categories`(글 수, 사이드바용). 어드민 글 편집은 카테고리 select(필수).
- [x] 디자인 기반: sonic 토큰 + 새 라이트 토큰(`globals.css`의 `--s-*`), 폰트, `next-themes`(시스템 기본), 사이드바 셸(240px / 태블릿 64px 레일 / 모바일 드로어), ui 컴포넌트(sidebar·dialog·dropdown·alert-dialog 등 radix).
- [x] 프로젝트: 목록(대표 카드 + 연도별 타임라인), 상세(메타 한 줄, GitHub·서비스 링크, 스택, 하이라이트, 섹션 Markdown, 목차 스크롤스파이, 스레드형 참고 문서, 이전·다음).
- [x] 블로그: 사이드바 카테고리(점 색 = code, 글 0건은 숨김), 목록(검색 다이얼로그 — 공개 글 최대 50건을 받아 브라우저에서 거름, 태그 필터, 페이지), 상세(읽는 시간, 태그, 정보 카드 "이 글 요약해줘", 같은 카테고리 이전·다음).
- [x] Markdown: react-markdown 유지, sonic 본문 스타일·코드 블록(복사, 간단 하이라이트), h2/h3 id, `:::questions`는 질문 칩(누르면 새 대화).
- [x] 소개(`/profile`): 헤드라인·소개, 경력 타임라인, 스킬 그룹, 본문 섹션, 연락처, 목차.
- [x] 홈·채팅: 떠 있는 채팅 패널을 없애고 홈(히어로 + 추천 질문 + 컴포저 + 바로가기)과 대화 화면(`/chat`, `/chat/[id]`)으로 교체. 대화 여러 개·만료 숨김은 ADR-0011 후속.
- [x] 카테고리 색(2026-09-29 추가 요청): 서버 `category.color`(HEX, V5)를 사이드바·목록·상세의 점에 쓴다. 참고 문서의 블로그 항목에 카테고리 칩(점 + 이름)을 붙였다. 어드민 기술·분류 화면에서 카테고리마다 색을 고른다(`<input type="color">`). 프론트의 code별 색 매핑은 없앴다.
- 레이아웃이 `force-dynamic`이라 모든 경로가 요청마다 렌더된다(사이드바 글 수). 캐시 정책은 배포 때 정한다.
- 검증(작업 Mac, 2026-09-29): 백엔드 118건, 포트폴리오 테스트 18건(헤딩·프로젝트·블로그·대화 저장소 추가), 어드민 15건, lint, `next build` 통과. 실제 백엔드로 브라우저 확인: 라이트·다크, 모바일 375px 가로 스크롤 없음, 질문 → 세션 발급·주소 `/chat/{id}`·스트리밍·출처, 새로고침 복원, 로컬 만료·서버 404 시 목록·본문 제거.
- 알려진 제약: 개발 모드(StrictMode)에서 홈 Lottie가 그려지지 않는다(프로덕션 빌드는 정상). 질문 칩·홈에서 넘기는 첫 질문은 메모리로 전달해 새로고침하면 사라진다.
- 미검증(사용자 확인 대기): 전체 화면 톤, 어드민 글 편집(카테고리 select) 저장, 태블릿 레일, 긴 대화·질문 30개 초과(409) 표시.

## 그래프 (2026-09-29, ADR-0015) — 브랜치 `feat/graph`

- [x] 백엔드 `GET /api/graph`(공개 문서만, 카테고리·스킬은 쓰는 것만, 간선 REFERENCE·SKILL·CATEGORY). `GraphApiTest` 2건, 전체 120건.
- [x] `/graph`: sonic 그래프 이식(`react-force-graph-2d` + `d3-force`). 노드 4종(프로젝트 악센트 사각·블로그 카테고리 색 원·카테고리 테두리 원·스킬 중립 마름모), 크기 = 연결 수, 참고 간선은 휜 악센트 선 + 옅은 화살표, 스킬·카테고리 간선은 옅은 직선. 필터 카드·검색 디밍·hover 이웃 강조·상세 패널(종류별 내용, 연결 목록, 열기·물어보기)·Esc 닫기. 테마 전환 시 캔버스 색 다시 읽음.
- [x] 기본 전체 보기, 선택·필터·검색을 URL 쿼리(`node`, `hide`, `q`)로 유지(replaceState). 새로고침·뒤로 가기·사이드바 재진입 확인(2026-09-29 사용자 요청).
- [x] 배치를 그리기 전에 계산하고 즉시 화면 맞춤(ADR-0015 후속 2). 진입·딥링크·필터 전환에서 점프 없음 확인. 이후 시뮬레이션은 켜 둬 진입 시 가볍게 튀고, 드래그하면 이웃이 따라오며 놓은 노드도 풀려 자리를 잡는다(브라우저 확인). 두 번째 드래그부터 물리가 멈추던 버그(`d3AlphaMin` 조건)를 고쳤고, 노드 클릭 시 부드럽게 가운데로 이동한다.
- [x] 768px 미만은 목록(프로젝트 → 카테고리별 블로그 → 스킬, 연결 수).
- [x] 진입점: 사이드바 "그래프", 프로젝트·블로그 상세 "연결 보기"(`/graph?node=`), 블로그 카테고리 목록 "그래프에서 보기".
- 검증(작업 Mac): 포트폴리오 테스트 22건(그래프 모델 3건 추가), lint, build. 실제 백엔드로 브라우저 확인 — 기본(스킬 숨김) 30노드·34간선, 스킬 켜면 65·131이 화면에 맞춰짐, 노드 선택·패널, 상세에서 딥링크, 다크, 모바일 목록.
- 미검증: 사용자 화면 확인, 태블릿 폭, reduced-motion 경로, 노드 드래그 감각.

## 2단계 이후

1. ~~공개 상세의 관련 문서 표시~~ — 2026-09-17 참고 문서로 구현(REFERENCE_DOCUMENTS_IMPLEMENTATION, 사용자 확인 완료). Graph View, RAG Playground.
3. ~~디자인 다듬기~~ — 3단계(sonic 적용)로 진행. 남은 것: SEO 메타데이터, 이미지·썸네일, `next/font`.
4. 배포: Vercel(Portfolio), 어드민 정적 배포 위치와 도메인(ADR-0010 4절), 캐시/재검증 정책.
