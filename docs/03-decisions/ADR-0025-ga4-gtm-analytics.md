# ADR-0025: GA4 + GTM Analytics

- Status: Accepted (2026-10-17, 사용자 결정: GA4 + GTM)
- Date: 2026-10-17

## Context

방문자 추세와 블로그 글별로 얼마나 읽는지 보고 싶다(BACKLOG "Analytics", ROADMAP Phase 11·13). 사용자가 GA4와 GTM을 쓰기로 정했다.

포트폴리오 화면은 `window`가 아니라 내부 컨테이너가 스크롤한다(`<body>`는 `overflow-hidden`, 블로그·프로젝트 상세는 `DocLayout`의 `overflow-y-auto` 컨테이너). 그래서 GA4 향상된 측정의 스크롤과 GTM 기본 "스크롤 깊이" 트리거가 둘 다 동작하지 않는다(2026-10-17 로컬 확인).

## Decision

### 코드
- `layout.tsx`가 `NEXT_PUBLIC_GTM_ID`가 있을 때만 `Analytics`(`components/providers/analytics.tsx`, `next/script` `afterInteractive`로 GTM 스니펫)를 넣는다. 운영 Vercel에만 값을 두고 로컬·미리보기 배포는 비워 둔다. 새 의존성은 없다(`@next/third-parties`는 실험 단계라 쓰지 않음).
- `DocLayout`이 스크롤 컨테이너에서 25·50·75·90%를 처음 넘을 때 `dataLayer.push({event: 'scroll_depth', percent_scrolled})`를 한다(`lib/scroll-depth.ts`, 문서마다 다시 마운트되어 초기화). 어느 경로를 보낼지는 GTM이 정한다.
- page_view는 코드로 보내지 않는다. GA4 향상된 측정의 "브라우저 방문 기록 이벤트 기반 페이지 변경"이 App Router 이동마다 보낸다(직접 보내면 중복).

### GA4 (계정 `Sonic Portfolio` a412246016 / 속성 p559292770)
- 웹 스트림 `https://www.sonic-portfolio.com`, 측정 ID `G-9NK4H40L2Q`. 시간대 Asia/Seoul, 통화 KRW.
- 계정 데이터 공유 옵션 모두 끔. 약관은 대한민국, GDPR 추가 약관 미동의.
- 향상된 측정: 스크롤·양식 상호작용 끔(스크롤은 위 이유, 양식은 채팅 입력이 잡음), 나머지 기본값.
- 데이터 보관: 이벤트·사용자 14개월(기본 2개월이면 추세 탐색이 안 됨).
- 맞춤 측정기준 `스크롤 비율` = 이벤트 매개변수 `percent_scrolled`(이벤트 범위).
- 내부 트래픽 규칙 `Home`(사용자 집 공인 IP /32, `traffic_type=internal`, IP 값은 GA4 관리 화면에만 둔다)과 데이터 필터 `Internal Traffic` 활성. 집 IP가 바뀌면 규칙을 고친다.

### GTM (계정 6383060238 / 컨테이너 `GTM-5RSJ73F8`)
- 태그 `GA4 - Google Analytics`(Google Analytics 태그, `G-9NK4H40L2Q`) — Initialization - All Pages.
- 변수 `DLV - percent_scrolled`(데이터 영역 변수 `percent_scrolled`).
- 트리거 `Scroll - Blog Post` — 맞춤 이벤트 `scroll_depth`, Page Path가 `/blog/`로 시작.
- 태그 `GA4 - Event - scroll`(GA4 이벤트 `scroll`, `percent_scrolled={{DLV - percent_scrolled}}`) — 위 트리거.
- 게시 버전 2 "v1 - GA4 page_view + blog scroll_depth"(2026-10-17). GA 계정 읽기 전용 링크는 추가하지 않음.

## Alternatives Considered

### gtag.js 직접 설치
- 장점: GTM 계층이 없다.
- 단점: 이벤트·트리거를 바꿀 때마다 코드 배포가 필요하다. 사용자가 GTM을 택했다.

### 레이아웃을 window 스크롤로 바꿔 GTM 기본 트리거 사용
- 단점: 사이드바·목차 sticky·스크롤스파이 등 셸 전체를 건드린다. dataLayer 이벤트 몇 줄이 훨씬 작다.

## Consequences

- 블로그 글(`/blog/<slug>`)만 `scroll` 이벤트를 보낸다. 프로젝트·소개도 같은 이벤트를 dataLayer에 넣으므로 GTM 트리거 조건만 바꾸면 GA4로 보낼 수 있다(코드 변경 없음).
- 스크롤 비율은 컨테이너 전체 높이 기준이다. 본문 아래 요소가 길면 다 읽어도 90%에 못 미칠 수 있다. 정확도가 필요하면 본문 끝 요소 기준으로 바꾼다.
- 짧아서 스크롤이 없는 글은 `scroll` 이벤트가 없다(참여 시간으로 본다).
- 2026-10-17 로컬 확인(`NEXT_PUBLIC_GTM_ID` 설정, 게시 컨테이너): `/blog/n8n` page_view, 스크롤 시 `scroll` 25·50·75·90(`epn.percent_scrolled`) GA 전송, `/projects` 클라이언트 이동 page_view. GTM 미리보기(Tag Assistant)에서 page_view 태그 실행 확인. 스크롤 태그는 미리보기에서는 확인하지 못했고(연결된 창에서 이벤트가 오지 않음, 원인 미확인) 게시 후 실제 전송으로 확인.
- 개인정보: 채팅 질문 내용은 GA로 보내지 않는다. 개인정보 처리방침 안내 문구는 아직 없다.

## Related Documents

- [ADR-0021](ADR-0021-portfolio-isr-and-list-cache.md) — 포트폴리오 ISR
- [Deploy README](../../deploy/README.md) — Vercel 환경 변수
