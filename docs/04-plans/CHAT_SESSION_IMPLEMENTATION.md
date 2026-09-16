# Chat Session Implementation

Status: Done (2026-09-16)
Date: 2026-09-16

**Goal:** ADR-0011대로 방문자 대화를 서버에 하루(마지막 활동 기준) 보관하고, 새로고침 후 복원하며, 후속 질문을 이전 대화 맥락으로 이해한다. 세션 사이 격리와 타인 접근 차단(RAG-006/009)을 테스트로 보장한다.

**Spec:** [ADR-0011](../03-decisions/ADR-0011-chat-session-retention.md), [ADR-0004](../03-decisions/ADR-0004-rag-answer-and-session-policy.md), [CHAT_IMPLEMENTATION](CHAT_IMPLEMENTATION.md), DATA_MODEL 4절.

## API

인증 없음, CSRF 제외. 세션 비밀키는 헤더 `X-Chat-Session-Key`로 보낸다. 없는 세션·만료·키 불일치는 모두 같은 `404`(존재 여부를 알려주지 않는다).

- `POST /api/chat/sessions` → `201 {sessionId, sessionKey, expiresAt}` — 키는 이때 한 번만 준다
- `GET /api/chat/sessions/{sessionId}` → `{sessionId, expiresAt, messages:[{role, content, sources[], createdAt}]}`
- `DELETE /api/chat/sessions/{sessionId}` → `204`
- `POST /api/chat/sessions/{sessionId}/messages` `{question}` → SSE (단일 질문 API와 같은 이벤트). 판정 순서: `400` 검증 → `503` 모델 꺼짐 → `404` 세션 → `409` 질문 30개 도달 → `429` 하루 제한
- 기존 `POST /api/chat`(세션 없는 단일 질문)은 유지한다.

## 설계

- 저장: `chat_session.public_id`(UUID), `visitor_key` = 비밀키 SHA-256(hex), `expires_at`. 비교는 상수 시간. 스키마 변경 없음.
- 답변이 끝나면(`done` 직전) 한 트랜잭션에서 질문·답변·인용 출처(`chat_message_source`)를 저장하고 `last_active_at`, `expires_at = now + 24h`로 갱신한다. 생성 실패·연결 끊김이면 아무것도 저장하지 않는다.
- 후속 질문 해석(추가 모델 호출 없음):
  - 검색 질의 = 직전 사용자 질문 + 현재 질문(임베딩 입력). "거기서 맡은 역할은?" 같은 질문이 직전 주제로 검색되게 한다.
  - 생성 프롬프트에 최근 3턴(메시지 6개)을 `<이전 대화>` 블록으로 넣고, 시스템 프롬프트에 "이전 대화는 질문 이해에만 쓰고 사실은 근거에서만 가져온다" 규칙을 추가한다(RAG-008). 이력이 없으면 기존 ADR-0007 프롬프트와 완전히 같다.
- 복원 시 출처는 현재 공개 문서만 보여준다(ADR-0005 조회 시점 필터). 답변 본문은 저장된 그대로다(소급 처리는 ADR-0004 Consequences의 미결 사항으로 남긴다).
- 문서 삭제: `chat_message_source.document_id`가 `on delete restrict`라 인용된 문서를 지울 수 없게 된다. 원본 삭제 시 `DocumentProjector.remove`가 해당 인용 행을 먼저 지운다(삭제된 콘텐츠의 출처는 이력에서 사라진다).
- 만료 정리: `@Scheduled` 1시간 간격으로 `expires_at < now` 삭제(메시지·출처 cascade).
- CORS 허용 헤더에 `X-Chat-Session-Key` 추가(포트폴리오 도메인 결정 시 허용 출처 설정).

## Tasks

- [x] `ChatSessionService`(발급·검증·이력·저장·삭제·정리), `ChatSessionController`, 공용 SSE 실행기(`ChatStreams`)
- [x] `ChatService`: 이력 반영(검색 질의·프롬프트), 인용 문서 반환
- [x] `DocumentProjector.remove`: 인용 행 선삭제
- [x] SecurityConfig·CORS·스케줄링
- [x] 테스트 `ChatSessionApiTest`: 발급(키 해시 저장), 복원, 잘못된/없는 키 404, 후속 질문 검색 질의·프롬프트, 최근 3턴 제한, 30개 409, 만료 404·정리, 만료 연장, 삭제, 실패 시 미저장, 비공개 전환 출처 숨김, 인용 문서 삭제 가능, 세션 간 격리

## 범위 밖

프론트 화면, 이력 요약, 세션 생성 빈도 제한(현재는 만료 정리로 대응), 답변 소급 처리.

## 결과 — 2026-09-16

- 사용자 로컬 실행(07:40 KST 9/17): 전체 89건 통과, ChatSessionApiTest 12건. 첫 실행에 통과.
- 공용 SSE 실행기 `ChatStreams`로 단일 질문·세션 API가 같은 이벤트·오류 처리를 쓴다. 세션 API는 턴 저장 후 `done`을 보낸다.
- 스케줄 정리 메서드는 void 래퍼(`cleanupExpired`)로 두고, 테스트는 `deleteExpired()`를 직접 호출한다.
- `DocumentProjector.rebuildAll`도 고아 문서 삭제 전에 인용 행을 지운다.
- 미검증: 실제 모델로 후속 질문 품질(RAG-005), 브라우저 localStorage 연동(프론트 단계).
