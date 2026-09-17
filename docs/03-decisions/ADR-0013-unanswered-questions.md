# ADR-0013: Unanswered Question Handling and Retention

- Status: Accepted
- Date: 2026-09-16

## Context

근거가 부족한 질문에 대한 현재 답변("근거에 등록되어 있지 않습니다")이 딱딱하다. 사용자는 부드러운 안내와 함께, 답하지 못한 질문을 보관해 관리자가 확인하고 콘텐츠를 보완하길 원한다. 자료가 있는데 검색이 못 찾은 경우와 준비하지 않은 질문을 모두 구분해 볼 수 있어야 한다.

## Decision (2026-09-16 사용자 결정)

1. **판정: 모델 표시 + 출처 없음.** 질문의 전부 또는 일부를 근거로 답할 수 없으면 모델이 `[[NO_ANSWER]]`를 쓰고, 서버는 스트림과 저장 본문에서 이를 지운 뒤 `NO_EVIDENCE`로 기록한다. 표시가 없어도 인용 출처가 없으면 `NO_CITATION`으로 기록한다.
2. **안내 문구: 설정값 템플릿 + 모델이 주제를 채운다.** 기본값 `{주제}에 대해서는 지금 정보로는 답변드리기 어려워요. 질문주신 내용은 따로 보관하여 더 보완하도록 하겠습니다. 감사합니다.` (`CHAT_NO_ANSWER_GUIDE`)
3. **보관: 90일 후 자동 삭제**(`CHAT_UNANSWERED_RETENTION_DAYS`), 관리자가 확인·처리하며 직접 삭제할 수 있다. 채팅 세션(24시간)이 지워져도 기록은 남고 세션 연결만 끊긴다.
4. 기록 항목: 질문, 답변, 사유, 당시 검색된 문서(유형·slug·제목·거리), 상태(`OPEN|RESOLVED|IGNORED`), 관리자 메모. 방문자 식별 정보(IP 등)는 저장하지 않는다.

## Consequences

- ADR-0007의 측정 검증된 시스템 프롬프트가 바뀐다(근거 부족 문구 규칙). 실제 모델로 PoC 질문 7개를 재측정해 표시 누락·오판정을 확인해야 한다.
- 질문에 개인정보가 섞일 수 있어 보관 기간을 제한한다. 안내 문구가 "보관한다"고 밝히므로 기록 실패 시에도 답변은 그대로 나간다(로그로 추적).
- 표시가 스트림 조각 경계에 걸쳐도 지워지도록 서버가 표시 길이만큼 출력을 잠깐 늦춘다.

## Related Documents

- [ADR-0007](ADR-0007-generation-model-and-answer-prompt.md), [ADR-0011](ADR-0011-chat-session-retention.md), [UNANSWERED_QUESTIONS_IMPLEMENTATION](../04-plans/UNANSWERED_QUESTIONS_IMPLEMENTATION.md)
