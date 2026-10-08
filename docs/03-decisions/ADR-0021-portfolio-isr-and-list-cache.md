# ADR-0021: 포트폴리오 ISR과 목록 클라이언트 캐시

- Status: Accepted
- Date: 2026-10-08

## Context

포트폴리오(Next.js 16)는 루트 레이아웃과 모든 페이지가 `force-dynamic`이어서 방문마다 서버가 렌더하고 백엔드를 불렀다. 캐시 정책은 배포 때 정하기로 미뤄 두었다(FRONTEND_IMPLEMENTATION, DEPLOYMENT_PLAN). 콘텐츠는 어드민에서만 바뀌고 자주 바뀌지 않는다.

사용자 요청(2026-10-08):
- 전부 ISR로 바꾸되 어드민 저장 시 즉시 재검증(on-demand revalidation)은 하지 않는다.
- 목록 페이지는 목록 영역을 뺀 나머지가 바로 보이고, 목록은 스켈레톤으로 로딩한다.
- 목록에 다시 들어오면 기존 데이터를 쓰도록 클라이언트 캐시(React Query)를 둔다.

## Decision

1. **ISR 5분.** 루트 레이아웃에 `export const revalidate = 300` 한 곳만 둔다. 경로 전체의 주기는 레이아웃·페이지 중 가장 짧은 값이 정하므로 페이지마다 두지 않는다. `force-dynamic`은 모두 제거한다.
2. **상세 페이지는 첫 방문 때 생성한다.** `/projects/[slug]`, `/blog/[slug]`은 `generateStaticParams`가 빈 배열을 돌려준다. 빌드 때 만들지 않고 첫 요청 때 만들어 캐시한다.
3. **실패를 빈 값으로 삼키지 않는다.** ISR은 렌더 중 예외가 나면 이전 페이지를 계속 내보내지만, 빈 값을 돌려주면 그 값을 5분 동안 캐시한다. 그래서 `getCategoriesOrEmpty`를 `getCategories`(실패 시 예외)로 바꾸고, `getProfileOrNull`은 404만 null로 처리한다.
4. **목록 페이지는 정적 셸 + 브라우저 목록이다.** `/projects`와 `/blog`는 제목·검색·질문 칸을 정적 HTML로 내보내고, 목록은 클라이언트 컴포넌트(`ProjectsView`, `BlogView`)가 React Query로 받는다. 받는 동안 목록 자리는 스켈레톤이다. `/blog`는 조건(category, tag, page)을 `useSearchParams`로 읽으므로 Suspense로 감싸고, 대체 화면 `BlogSkeleton`이 정적 HTML이 된다. 서버가 `searchParams`를 읽지 않으므로 `/blog`도 ISR이 된다.
5. **클라이언트 캐시 정책**(`src/lib/queries.ts`):
   - `staleTime` 5분: 5분 안에 다시 오면 요청 없이 캐시를 그린다. 서버 ISR 주기와 같은 값이다.
   - 5분이 지나면 캐시를 먼저 그리고 뒤에서 새로 받는다.
   - `gcTime` 30분, 창 포커스 때 다시 받지 않음, 재시도 1회.
   - 키는 `["projects"]`, `["posts", 조건]`. 블로그 검색 창(`size=50`)도 같은 캐시를 쓴다.
6. 브라우저의 목록 요청은 같은 출처의 `/api/*`를 쓰고, `next.config` rewrites가 이를 백엔드로 넘긴다(블로그 검색이 이미 쓰던 경로). 백엔드 CORS는 바꾸지 않는다. 채팅은 IP별 질문 제한 때문에 지금처럼 api 도메인을 직접 부른다(ADR-0017).

## Alternatives Considered

### 모든 페이지 서버 렌더 + 페이지별 `revalidate`
- 장점: 목록 HTML이 처음부터 완성되어 있다.
- 단점: `/blog`는 `searchParams` 때문에 동적 렌더로 남는다. 다시 들어올 때 서버 왕복을 피할 수 없어 클라이언트 캐시 요구를 채우지 못한다.

### 서버 prefetch + `HydrationBoundary`
- 장점: 목록 HTML과 클라이언트 캐시를 함께 얻는다.
- 단점: 정적 셸에서는 조건별 목록을 미리 받을 수 없고, 구조가 복잡하다.

### 어드민 저장 시 즉시 재검증
- 이번에는 사용자 요청으로 제외했다. 필요해지면 비밀 키로 보호한 재검증 라우트를 두고 백엔드가 저장 후 호출하게 한다. `/api/*`는 rewrite 대상이므로 이 라우트는 다른 경로에 둔다.

## Consequences

- 어드민 수정은 최대 5분 뒤에 반영된다. 정확히는 5분이 지난 뒤 첫 요청이 다시 생성을 시작하고, 그다음 요청부터 새 내용이 보인다. 클라이언트 캐시 때문에 같은 탭에서는 목록이 최대 5분 더 늦을 수 있다.
- 없는 slug에 대한 404도 캐시된다. 같은 slug로 나중에 발행하면 최대 5분 동안 404가 보일 수 있다.
- **빌드할 때 백엔드가 필요하다.** `/`, `/profile`, `/graph`, `/blog`(카테고리), 레이아웃이 빌드 때 렌더된다. Vercel에서는 `API_BASE_URL`(api 도메인)로 접근할 수 있다. 로컬에서 `pnpm build`를 하려면 백엔드를 먼저 띄운다.
- 목록 페이지 HTML에는 목록 항목이 없다(SEO). 상세 페이지는 완성된 HTML이라 색인할 수 있다. 목록 링크가 검색에 필요하면 sitemap을 추가한다.
- 그래프 화면은 `useSearchParams` 때문에 Suspense 안에서 브라우저가 그린다(캔버스라 원래 클라이언트에서 그렸다).
- 포트폴리오에 `@tanstack/react-query`를 추가했다(어드민과 같은 5.102, ADR-0012).
- 기존 문제(이번 변경과 무관): 루트 `loading.tsx` 때문에 응답이 스트리밍되어 없는 slug가 200 + `noindex`로 응답한다(soft 404). 진짜 404 상태 코드가 필요하면 `loading.tsx`를 지우거나 범위를 좁힌다.

## Related Documents

- `docs/04-plans/FRONTEND_IMPLEMENTATION.md`
- `docs/04-plans/DEPLOYMENT_PLAN.md`
- ADR-0012(프론트 도구), ADR-0017(배포 구성)
