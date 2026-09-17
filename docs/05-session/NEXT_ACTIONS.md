# Next Actions

Last Updated: 2026-09-17

## 현재 기준

전체 MVP 및 월 10만 원 예산은 유지한다. ADR-0001~0009는 Accepted다. 콘텐츠 모델·ERD 초안과 샘플 RAG 평가는 완료되어 다시 선정하지 않는다.

## 참고 — 샘플 시드 재실행 (선택)

참고 문서 기능은 2026-09-17 사용자 확인 완료. 개발 DB 샘플 연결 방향을 새 샘플과 맞추려면 `./gradlew bootRun --args='--spring.profiles.active=local --app.seed.samples-dir=../samples'`를 한 번 실행한다(기존 offline-first-boundary→web-serial-usb 행이 web-serial-usb→offline-first-boundary로 바뀜).

## Priority 1 — 프론트 3단계 (FRONTEND_IMPLEMENTATION)

1·2단계(조회·채팅·어드민 전체)는 2026-09-17 사용자 확인 완료.

1. 디자인 다듬기(타이포그래피, 다크 모드, 썸네일·프로필 이미지), SEO 메타데이터.
2. 캐시·재검증 정책(현재 모든 페이지 force-dynamic).
3. 이후: 배포 준비(도메인, ADR-0010 4절, 방문자 IP 판별).

## Priority 3 — 이후 기능 후보

- RAG Playground, Graph API(참고 방향 화살표 표시 여부 결정), FAQ 다른 표현(B) 관리.

## 사용자 확인 대기 (콘텐츠 사실)

`samples/profile.md`의 `open_questions`와 SAMPLE_SEED_IMPLEMENTATION "사용자 확인이 필요한 사실" 5건. 답을 받으면 샘플을 고치고 시드를 다시 실행한다.

## 해당 기능 착수 시

- Admin 화면: 도메인이 정해지면 ADR-0010 4절(CORS 허용 출처, 쿠키 SameSite)을 갱신한다.
- Chat: 질문 제한 집계 기준/기간/수치/해제 설정, 이력 보관·복원·만료·삭제 및 컨텍스트 상한. 정책 결정 후 관련 스키마를 확정한다.
- Graph: 라이브러리와 Skill/Category 노드 매핑. Document Relation 기준 ID·방향성은 ADR-0005를 유지한다.
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

> 공통 규칙과 세션 문서를 읽고, FRONTEND_IMPLEMENTATION 3단계(디자인·SEO·캐시)를 진행하자.
