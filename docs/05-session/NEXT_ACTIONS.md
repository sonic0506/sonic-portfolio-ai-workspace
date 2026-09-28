# Next Actions

Last Updated: 2026-09-29

## 현재 기준

전체 MVP 및 월 10만 원 예산은 유지한다. ADR-0001~0009는 Accepted다. 콘텐츠 모델·ERD 초안과 샘플 RAG 평가는 완료되어 다시 선정하지 않는다.

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
- 배포: 채팅 질문 제한은 `request.getRemoteAddr()` 기준이다. 프록시·Vercel 뒤에서는 실제 방문자 IP(X-Forwarded-For, `server.forward-headers-strategy`)를 신뢰할 경로를 정하고, 본인 IP 제외 목록(`CHAT_LIMIT_EXEMPT_IPS`)을 설정한다.
- 배포: Vercel 무료 조건과 저장소 연결, Lightsail/RDS 사설 연결, 메모리 부하와 실제 비용을 검증한다.

## 남은 검증과 콘텐츠 확인

- pgvector HNSW 검색은 PoC의 메모리 코사인 검색과 별도로 검증한다.
- 세션 평가 RAG-005/006/008/009/010은 구현 후 측정한다.
- 콘텐츠 변경 시 --save로 재측정하고 RAG_MEASUREMENTS에 기록한다. Hybrid search는 도입 확정이 아니다.
- 샘플 front matter의 open_questions와 AI 블로그 초안의 사실·문체를 사용자에게 확인한다.
- OpenAI API 키는 기존 키를 사용한다(2026-09-16 사용자 결정). 사용량 이상 시 재발급을 검토한다.

## Recommended Next Session Prompt

> 공통 규칙과 세션 문서를 읽고, `feat/sonic-ui` 화면 확인 결과를 반영한 뒤 SEO·캐시(FRONTEND_IMPLEMENTATION 3단계 나머지)를 진행하자.
