# ADR-0016: Chat SSE Client — fetch 스트림과 자체 파서

- Status: Accepted (2026-10-01 — 2026-09-17 프론트 1단계에서 이미 구현한 방식을 사용자 요청으로 사후 기록)
- Date: 2026-10-01

## Context

ADR-0008은 채팅 응답을 SSE로 보내기로 정했지만, 브라우저가 이를 어떻게 받을지는 정하지 않았다. 브라우저 표준 `EventSource`가 가장 간단한 방법이지만 채팅 API 계약(API_DESIGN)과 맞지 않는 점이 있다.

- 질문은 `POST /api/chat/sessions/{id}/messages` 본문 `{question}`(1~500자)으로 보낸다.
- 세션 비밀키는 헤더 `X-Chat-Session-Key`로 보낸다(ADR-0011).
- 스트림 시작 전 오류는 HTTP 상태로 구분한다: `400` 검증, `404` 만료·삭제, `409` 질문 30개, `429` 하루 제한, `503` 모델 꺼짐. 화면은 상태마다 다른 안내를 보여주고, `404`면 만료 흐름으로 간다.
- 이벤트에는 모두 이름이 있다(`status`, `documents`, `answer_delta`, `done`, `error`).
- 한 질문에 한 스트림이다. `done` 뒤에 서버가 연결을 닫는다. 질문 수 제한과 생성 비용이 있으므로 같은 질문을 자동으로 다시 보내면 안 된다.

## Decision

1. 채팅 SSE는 **`fetch` + `ReadableStream`**으로 받는다. `EventSource`는 쓰지 않는다.
2. 파싱은 **자체 파서**(`frontend/portfolio/src/lib/sse.ts`, 약 50줄)로 한다. 라이브러리를 추가하지 않는다.
   - 받은 조각을 버퍼에 쌓았다가 빈 줄(`\n\n`) 기준으로 이벤트를 자른다.
   - `TextDecoder`를 `{ stream: true }`로 써서 조각 경계에서 잘린 한글이 깨지지 않게 한다.
   - `\r\n`·`\r`을 `\n`으로 통일하고, `:` 주석 줄은 버린다. 여러 `data:` 줄은 `\n`으로 잇는다.
   - Spring `SseEmitter` 형식(`data:x`, 콜론 뒤 공백 없음)과 표준 형식(`data: x`)을 둘 다 받는다.
   - 스트림이 끝나면 디코더를 비우고, 빈 줄 없이 끝난 마지막 이벤트도 내보낸다.
   - async generator(`readSse`)로 이벤트를 하나씩 내보내고, 호출 측은 `for await`로 처리한다.
3. **상태 코드를 먼저 확인**한 뒤 본문을 읽는다. 스트림 시작 전 오류는 `ChatHttpError(status)`로 안내 문구를 고른다.
4. **자동 재연결과 재전송은 하지 않는다.** 다시 보내는 것은 사용자가 "다시 시도"를 누를 때뿐이다. `done` 없이 스트림이 끝나면 받은 데까지를 완료로 표시한다.
5. 취소는 `AbortController` 하나로 통일한다. 중지 버튼과 화면 이탈이 모두 같은 `abort()`를 부른다.

## Alternatives Considered

### Option A — `EventSource`
- 장점: 브라우저 내장이고 코드가 가장 짧다. 파서를 만들 필요가 없다.
- 단점:
  - GET만 보낼 수 있다. 질문(최대 500자)을 URL에 실어야 하므로 접근 로그와 브라우저 기록에 남는다.
  - 사용자 헤더를 붙일 수 없다. 세션 비밀키를 쿼리에 넣어야 하므로 로그·기록·Referer로 샌다.
  - 연결이 닫히면 자동으로 다시 연결한다. 서버가 `done` 뒤 정상적으로 닫아도 재요청하므로, 같은 질문이 다시 처리되어 질문 수·하루 제한·생성 비용이 소모된다. 막으려면 모든 종료 경로에서 `close()`를 빠짐없이 불러야 한다.
  - `onerror`에는 HTTP 상태 코드가 없다. `404`/`409`/`429`/`503`을 구분할 수 없다.
  - `onmessage`는 이름 없는(`message`) 이벤트만 받는다. 우리 이벤트는 모두 이름이 있으므로 이벤트마다 `addEventListener`가 필요하다.
  - 다른 채팅 요청은 `AbortController`로 취소하는데, 이것만 취소 방식이 달라진다.

### Option B — `@microsoft/fetch-event-source` 같은 라이브러리
- 장점: POST·헤더·상태 확인을 지원하고, 파서를 직접 관리하지 않아도 된다.
- 단점: 약 50줄로 해결되는 일에 의존성이 하나 늘어난다. 이 라이브러리도 기본으로 재시도하므로 끄는 설정이 따로 필요하다.

## Consequences

- SSE 규격 처리(조각 분할, 줄바꿈, 주석, 여러 `data:` 줄)를 우리가 책임진다. `sse.test.ts`로 분할 수신과 Spring·표준 형식을 검증한다.
- `id:`와 `retry:` 필드는 읽지 않는다. 한 질문에 한 스트림이고 재연결을 하지 않으므로 필요 없다. 장시간 구독형 스트림(예: 알림)이 생기면 그때 `EventSource`를 다시 검토한다.
- 서버 버퍼링 방지 헤더(`Cache-Control: no-cache, no-transform`, `X-Accel-Buffering: no`)는 클라이언트 방식과 무관하게 계속 필요하다.
- 관련 코드: `frontend/portfolio/src/lib/sse.ts`, `src/lib/chat-api.ts`(`postQuestion`, `errorMessage`), `src/hooks/use-conversation.ts`(`run`).

## Related Documents

- [ADR-0008 REST API and Chat SSE](ADR-0008-rest-and-chat-sse.md)
- [ADR-0011 Chat Session Retention](ADR-0011-chat-session-retention.md)
- [API Design](../02-design/API_DESIGN.md)
- [Frontend Implementation](../04-plans/FRONTEND_IMPLEMENTATION.md)
