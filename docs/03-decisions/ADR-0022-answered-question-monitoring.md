# ADR-0022: Answered Question Monitoring

- Status: Accepted (2026-10-12, 사용자 결정: 보관 7일, 채팅 안내 문구 추가)
- Date: 2026-10-12

## Context

어드민 "답하지 못한 질문" 화면(ADR-0013)은 근거 부족 질문만 보여 준다. 사용자는 정상적으로 답한 질문도 같은 화면에서 탭으로 보고 답변 품질을 확인하려 한다(주 2~3회 확인). 정상 답변은 `chat_message`에만 있고 세션과 함께 24시간 뒤 지워지며(ADR-0011), 세션 없는 단일 질문(`POST /api/chat`)은 아예 남지 않는다.

## Decision

1. **같은 테이블에 상태 `ANSWERED`로 기록한다.** 모든 채팅 답변을 `chat_unanswered_question`에 저장하고, 정상 답변은 `status = 'ANSWERED'`, `reason = null`이다(V9: `reason` null 허용, 상태 check에 `ANSWERED` 추가). 기록 실패는 답변에 영향을 주지 않는다(ADR-0013과 같음).
2. **보관 7일**(`CHAT_ANSWERED_RETENTION_DAYS`). 기존 1시간 주기 정리 작업이 함께 지운다. 답하지 못한 질문은 90일 그대로다.
3. **어드민 "답변완료" 탭.** 기존 상태 탭에 추가한다. 카드에서 상태 변경·메모는 숨기고 "FAQ로 등록"과 삭제만 둔다. FAQ로 등록하면 기존 규칙대로 `RESOLVED`가 된다.
4. **채팅 안내 문구:** "질문 내용은 답변 품질 개선을 위해 7일간 보관됩니다"를 채팅 입력창 아래 안내에 덧붙인다. 방문자 식별 정보는 여전히 저장하지 않는다.

## Alternatives Considered

- 별도 테이블 `chat_answered_question`: 이름은 정확하지만 목록·카드·정리 코드가 중복된다. 테이블 이름이 "unanswered"로 남는 것은 감수한다.
- 채팅 세션 보관 기간 연장: 방문자 대화 복원 정책(ADR-0011)과 섞이고, 세션 없는 질문은 여전히 남지 않는다.

## Consequences

- 테이블 행 수가 질문 수만큼 늘지만 질문 제한(ADR-0002, 하루 전체 300)과 7일 삭제로 상한이 작다.
- 상태 필터 없이 목록을 부르면 `ANSWERED`도 섞인다. 어드민은 항상 상태를 지정한다.

## Related Documents

- [ADR-0011](ADR-0011-chat-session-retention.md), [ADR-0013](ADR-0013-unanswered-questions.md), [ADR-0014](ADR-0014-faq-answers.md)
