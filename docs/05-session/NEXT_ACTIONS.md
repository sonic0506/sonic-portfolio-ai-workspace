# Next Actions

Last Updated: 2026-10-08

## 현재 기준

전체 MVP 및 월 10만 원 예산은 유지한다. ADR-0001~0009는 Accepted다. 콘텐츠 모델·ERD 초안과 샘플 RAG 평가는 완료되어 다시 선정하지 않는다.

. 운영 서버 재배포(2026-10-08 HNSW 반복 스캔 수정) 후 `ask "RAG 관련 경험이 있나요?"`로 출처가 나오는지 확인.
1. Vercel portfolio·admin 프로젝트 생성(deploy/README.md "Vercel 설정"), 도메인 연결 후 Route 53에 `www`·`admin`·apex 레코드.
2. 운영 확인: 채팅이 경험 글만 출처로 쓰는지(ADR-0018), 관리자 로그인(Vercel rewrite 쿠키 전달), 어드민 "채팅 반영" 체크박스, 질문 제한 IP.
3. 다른 장소용으로 추가한 SSH 허용 IP(122.202.248.4)는 작업 후 Lightsail 방화벽에서 지운다.
4. 운영 서버 `docker stats`로 메모리 확인, 하루 뒤 Budgets `sonic-portfolio-infra-monthly`(Lightsail·Route 53) 생성.

## Priority 0-2 — 배포 (DEPLOYMENT_PLAN, 브랜치 `feat/deploy`)

구성은 ADR-0017, 도메인 `sonic-portfolio.com`, 백업은 Lightsail 스냅샷만. 코드 준비는 2026-10-04 완료(검증 결과는 DEPLOYMENT_PLAN 끝).

1. (완료 2026-10-04) 로컬 메모리 실측: 최대 api 407 MiB·db 75 MiB, OOM 없음(DEPLOYMENT_PLAN "메모리 실측").
2. Caddyfile 문법 확인(`docker run --rm -v $PWD/deploy/Caddyfile:/etc/caddy/Caddyfile:ro caddy:2 caddy adapt --config /etc/caddy/Caddyfile`, 이번 세션에서는 이미지 실행이 멈춤).
3. 사용자 작업: DEPLOYMENT_PLAN 2단계(AWS 계정 보안·Budgets, Lightsail 4GB·고정 IP·방화벽, DNS, 운영 GitHub OAuth App, OpenAI 한도). 이후 `deploy/README.md` 순서로 서버 구성·배포.
4. `feat/graph` → `main` 병합 후 `feat/deploy`도 병합해 배포 기준을 `main`으로 맞춘다.

## Priority 0-3 — 콘텐츠 재변환 확인 후 운영 시드

0. 학습 노트 59개, AI 도구 15개 추가(2026-10-05). 운영 시드 후 색인 READY 111 확인. "n8n 써 봤나요?"처럼 도구 경험을 묻는 질문도 확인. 학습 카테고리는 채팅 근거에서 빠졌다(ADR-0018). 경험 질문의 답이 프로젝트·경험 글로 충분한지, 학습 글이 출처에 안 나오는지 확인. 어드민 분류 화면의 "채팅 반영" 체크박스 동작 확인(로그인 필요). 그래프 전체 보기에서 라벨이 많이 겹친다(노드 약 96개): 느리거나 보기 어려우면 ADR-0015 재검토.
1. 사용자 확인: `content/` 결과(slug, 카테고리·태그, featured 3건, 작성일 2026-10-04, 이미지 제외). 고칠 것은 `convert_wiki.py` 표를 바꾸고 다시 실행.
2. 운영 DB 시드: `deploy/README.md` 3절(스냅샷 → SSH 터널 → local 시드 → 색인 READY 111건 확인).
3. 개발 DB에는 옛 콘텐츠(프로젝트 7·블로그 12와 samples)가 남아 있다. 시드는 지우지 않고 upsert만 하므로, 개발 DB를 맞추려면 옛 항목을 어드민에서 지우거나 DB를 새로 만든다.

## Priority 0 — 그래프 확인 (브랜치 `feat/graph`)

1. `/graph` 화면 확인: 기본 배치·스킬 켜기·노드 선택·패널·딥링크·다크·모바일 목록. 확인 후 `main` 병합.
2. 개발 DB에 옛 샘플이 남아 그래프에 섞여 보인다 → 아래 Priority 0-1(샘플 삭제·`content/` 재시드) 후 다시 본다.

## Priority 0-0 — sonic UI 적용 확인 (2026-09-29 `main` 병합 완료)

1. 사용자 화면 확인: 라이트·다크 톤, 사이드바(태블릿 레일·모바일 드로어), 프로젝트·블로그·소개·홈·대화.
2. 어드민에서 블로그 글 카테고리 select 저장 확인.
3. 개발 DB는 V4가 이미 적용됐다. 아래 `content/` 재시드를 하면 글별 카테고리가 계획한 값(먼저 적힌 것)으로 맞춰진다.
4. 확인 후 `main`으로 병합.

## Priority 0-1 — 실제 콘텐츠 개발 DB 반영

1. 개발 DB의 기존 샘플(프로젝트 yujin-robot·syncmaster, 블로그 websocket-binary-video·web-serial-usb·offline-first-boundary)을 어드민에서 삭제한다(사용자 결정). 채팅 출처로 인용된 문서는 삭제가 막힐 수 있다(`chat_message_source` restrict).
2. `./gradlew bootRun --args='--spring.profiles.active=local --app.seed.samples-dir=../content'` 실행. viora는 같은 slug라 새 내용으로 교체된다.
3. 색인 상태(어드민)와 포트폴리오 목록·상세·참고 문서를 확인한다. 콘텐츠가 바뀌었으므로 RAG 품질은 새 질문으로 따로 본다(RAG_MEASUREMENTS 기준은 samples/).

## Priority 1 — 프론트 3단계 (FRONTEND_IMPLEMENTATION)

1·2단계(조회·채팅·어드민 전체)는 2026-09-17 사용자 확인 완료. 디자인은 2026-09-29 sonic 적용으로 구현(확인 대기).

1. SEO 메타데이터, 썸네일·프로필 이미지, `next/font` 검토.
2. 캐시·재검증 정책(현재 모든 페이지 force-dynamic).
3. 이후: 배포 준비(도메인, ADR-0010 4절, 방문자 IP 판별).

## Priority 3 — 이후 기능 후보

- RAG Playground, FAQ 다른 표현(B) 관리.

## 사용자 확인 대기 (콘텐츠 사실)

`samples/profile.md`의 `open_questions`와 SAMPLE_SEED_IMPLEMENTATION "사용자 확인이 필요한 사실" 5건. 답을 받으면 샘플을 고치고 시드를 다시 실행한다.

## 해당 기능 착수 시

- Admin 화면: 도메인이 정해지면 ADR-0010 4절(CORS 허용 출처, 쿠키 SameSite)을 갱신한다.
- Chat: 질문 제한 집계 기준/기간/수치/해제 설정, 이력 보관·복원·만료·삭제 및 컨텍스트 상한. 정책 결정 후 관련 스키마를 확정한다.
- Graph: ADR-0015로 구현(2026-09-29). 노드가 수백 개를 넘거나 느려지면 라이브러리·클러스터링을 다시 본다.
- 이미지 업로드: S3 접근 정책과 리전. Markdown 본문 저장 위치는 이미 content_section.body_markdown으로 정했다.
- 색인: 원본 변경/삭제 시 동기화, 실패 재시도 및 중복 실행을 검증한다. 공개 범위는 ADR-0005의 조회 시점 필터를 유지한다.
- 배포: 채팅 질문 제한은 `request.getRemoteAddr()` 기준이다. 프록시·Vercel 뒤에서는 실제 방문자 IP(X-Forwarded-For, `server.forward-headers-strategy`)를 신뢰할 경로를 정하고, 본인 IP 제외 목록(`CHAT_LIMIT_EXEMPT_IPS`)을 설정한다. ADR-0017 구성에서는 Caddy(같은 서버)가 붙인 헤더만 신뢰한다.
- 배포: Vercel 무료 조건과 저장소 연결, 단일 서버 메모리 부하, 백업·복원, 실제 비용을 검증한다(ADR-0017, DEPLOYMENT_PLAN).

## 남은 검증과 콘텐츠 확인

- pgvector HNSW 검색은 PoC의 메모리 코사인 검색과 별도로 검증한다.
- 세션 평가 RAG-005/006/008/009/010은 구현 후 측정한다.
- 콘텐츠 변경 시 --save로 재측정하고 RAG_MEASUREMENTS에 기록한다. Hybrid search는 도입 확정이 아니다.
- 샘플 front matter의 open_questions와 AI 블로그 초안의 사실·문체를 사용자에게 확인한다.
- OpenAI API 키는 기존 키를 사용한다(2026-09-16 사용자 결정). 사용량 이상 시 재발급을 검토한다.

## Recommended Next Session Prompt

> 공통 규칙과 세션 문서를 읽고, `feat/sonic-ui` 화면 확인 결과를 반영한 뒤 SEO·캐시(FRONTEND_IMPLEMENTATION 3단계 나머지)를 진행하자.
