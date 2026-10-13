# ADR-0024: Server-held First Chat Question

- Status: Accepted (2026-10-13, 사용자 결정: 서버 저장 방식)
- Date: 2026-10-13

## Context

다른 화면(블로그 요약 버튼·홈 추천 질문·그래프 등)에서 대화를 열 때 첫 질문을 페이지 메모리 변수(`pendingQuestion`)로 넘기고 `/chat`으로 이동했다. Next.js는 서버 빌드가 바뀌었거나(배포 직후 열어 둔 탭) RSC 응답이 실패하면 클라이언트 이동을 전체 페이지 로드로 바꾼다. 그러면 메모리 값이 사라지고 `/chat`은 질문이 없어 홈으로 보냈다(2026-10-13 사용자 보고, `/blog/n8n`).

`sessionStorage`도 검토했지만 꺼내지 못한 값이 남아 나중에 전송되거나 탭 복제로 복사될 수 있다. 사용자는 클라이언트 처리의 한계를 피해 서버 쪽 해결을 택했다.

## Decision

- `POST /api/chat/sessions`가 선택 본문 `{question, focus}`(채팅 요청과 같은 검증)를 받아 세션의 대기 질문으로 저장한다. V10: `chat_session.pending_question`(꺼낼 때 비움), `focus_type`·`focus_slug`(세션 내내 보관, 이어지는 질문의 근거에 지정 글을 넣는다 — ADR-0023 후속).
- `GET /api/chat/sessions/{id}`는 `pending: {question, focus} | null`을 함께 준다.
- `POST /api/chat/sessions/{id}/pending`이 대기 질문을 꺼내 비우고(한 문장, 행 잠금) 보통 질문처럼 답한다(SSE, 저장·미답변 기록 같음). 검사 순서는 `/messages`와 같고(503 → 404 → 409 → 429), 꺼낼 것이 없으면 `410`.
- 프론트 `useAskChat`은 세션을 먼저 만들고(질문 포함) localStorage 대화 목록에 넣은 뒤 `/chat/{id}`로 간다. `/chat/{id}`는 기록을 받은 뒤 `pending`이 있으면 `/pending`을 부른다. 세션 생성이 실패하면 예전 메모리 경로로 `/chat`에 넘겨 그 화면이 오류를 보여 준다.

## Alternatives Considered

### sessionStorage + 유효시간
- 장점: 프론트 한 파일.
- 단점: 남은 값·탭 복제·두 번 실행을 브라우저 쪽 규칙으로만 막는다.

### URL 쿼리로 질문 전달
- 단점: 질문이 방문 기록·공유 링크·로그에 남는다.

## Consequences

- 대화 id는 URL, 키는 localStorage에 있으므로 이동 방식과 관계없이 첫 질문이 실행된다. 두 탭이 동시에 열어도 한 번만 실행된다(다른 쪽은 410).
- 버튼을 누르면 세션 생성 요청(서울 API 왕복)을 마친 뒤 이동한다.
- 실행되지 않은 대기 질문은 세션과 함께 24시간 뒤 지워진다. 질문 제한은 실행 때 센다.
- 2026-10-13 로컬 확인: 버튼 흐름(생성 201 → 조회 → `/pending` 200)과 전체 페이지 로드로 `/chat/{id}` 진입 모두 답변 1회, 대기 질문 비워짐.

## Related Documents

- [ADR-0011](ADR-0011-chat-session-retention.md) — 채팅 세션, [ADR-0023](ADR-0023-document-focused-chat.md) — 글 지정 질문
- [API Design](../02-design/API_DESIGN.md), [Data Model](../02-design/DATA_MODEL.md)
