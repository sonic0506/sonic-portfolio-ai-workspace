# ADR-0011: Chat Session Identity and Retention

- Status: Proposed (1·2번은 2026-09-16 사용자 결정, 3~5번은 Claude 제안 — 사용자 확인 대기)
- Date: 2026-09-16

## Context

채팅 1차는 대화 이력 없는 단일 질문이다(CHAT_IMPLEMENTATION). ADR-0004는 같은 세션의 이전 대화를 후속 질문 해석에 쓰고, 세션 간 이력을 섞지 않으며, 세션 ID만 바꿔 타인 이력에 접근할 수 없어야 한다고 정했다. 보관·복원·만료는 미정이었다. 방문자 로그인은 없다.

## Decision

1. **(사용자 결정) 브라우저 저장소로 세션을 유지한다.** 방문자 브라우저의 localStorage에 세션 식별 값을 두고 새로고침 후에도 대화를 이어 보여준다.
2. **(사용자 결정) 서버 보관 기간은 하루다.**
3. **(제안) 만료는 마지막 활동 후 24시간(슬라이딩)이다.** 질문할 때마다 `expires_at = now + 24h`. 만료 세션은 주기 작업(1시간)으로 삭제한다(메시지·출처는 FK cascade). 만료·없는 세션 요청은 `404`이며 클라이언트는 새 세션을 시작한다.
4. **(제안) 세션 식별 값은 서버가 발급한다.** 추측 불가능한 `public_id`(UUID)와 비밀키(`visitor_key`, 랜덤 32바이트)를 함께 발급하고 DB에는 비밀키의 SHA-256만 저장한다. 조회·질문은 두 값을 헤더로 보내야 한다(RAG-009). 포트폴리오(Vercel)와 API(Lightsail)의 도메인이 달라 쿠키 대신 localStorage + 헤더를 쓴다. XSS 시 노출될 수 있으므로 Markdown 렌더링의 XSS 방어를 필수로 한다. 담기는 정보는 방문자 본인의 대화뿐이다.
5. **(제안) 상한:** 세션당 질문 30개, 모델에 보내는 이력은 최근 3턴(메시지 6개). 이력은 질문 해석에만 쓰고 근거는 매번 공개 문서에서 다시 찾는다(ADR-0004). 채팅 화면에 "대화는 24시간 후 삭제됩니다"를 표시한다.

## Alternatives Considered

- **클라이언트가 만든 고유값만 사용:** 서버가 값을 검증할 수 없어 다른 사람의 ID를 알면 이력에 접근할 수 있다.
- **HttpOnly 쿠키:** 스크립트가 읽을 수 없어 더 안전하지만 도메인이 다른 구성에서 `SameSite=None`·CORS 자격 증명 설정이 필요하다. 같은 사이트로 배치가 확정되면 재검토한다.
- **시작 후 고정 24시간:** 대화 도중 끊길 수 있다.
- **이력 전체 전달:** 비용·지연이 대화 길이에 비례해 늘어난다.

## Consequences

- `chat_session.visitor_key`에 해시를 저장하고 `expires_at`을 실제로 사용한다(DATA_MODEL 4절). 스키마 변경이 필요하면 V2 마이그레이션으로 한다.
- 서버 재시작과 무관하게 이력이 유지된다(DB 보관).
- 질문 제한(ADR-0002)은 세션과 별개로 IP 기준을 유지한다.

## Related Documents

- [ADR-0004](ADR-0004-rag-answer-and-session-policy.md), [ADR-0002](ADR-0002-operating-budget-auth-and-limits.md), [DATA_MODEL](../02-design/DATA_MODEL.md), [CHAT_IMPLEMENTATION](../04-plans/CHAT_IMPLEMENTATION.md)
