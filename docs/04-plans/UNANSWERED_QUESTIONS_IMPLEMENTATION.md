# Unanswered Questions Implementation

Status: Active — 구현·테스트 완료(2026-09-17), 실제 모델 재측정 남음
Date: 2026-09-16

**Goal:** 근거가 부족해 답하지 못한 질문에 부드러운 안내 문구로 답하고, 그 질문을 보관해 관리자가 모니터링·보완할 수 있게 한다.

## 사용자 요청과 결정 (2026-09-16)

- 요청: 현재 "근거에 등록되어 있지 않습니다. 따라서 답변드리기 어렵습니다." 같은 딱딱한 문구를 "OAuth 인증 관련 트러블슈팅 경험에 대해서는 지금 정보로는 답변드리기 어려워요. 질문주신 내용은 따로 보관하여 더 보완하도록 하겠습니다. 감사합니다."처럼 바꾸고, 답하지 못한 질문을 보관해 관리자 페이지에서 확인한다(자료가 있는데 못 찾은 경우와 준비하지 못한 질문 모두 대비).
- 판정: **모델 표시 + 출처 없음.** 근거가 부족하면(일부만 답한 경우 포함) 모델이 답변 맨 앞에 `[[NO_ANSWER]]`를 붙이고, 서버는 스트림에서 이를 지운 뒤 기록한다. 표시가 없어도 인용 출처가 하나도 없으면 기록한다(사유 구분).
- 안내 문구: **설정값 템플릿 + 모델이 주제를 채움.** 기본값 `"{주제}에 대해서는 지금 정보로는 답변드리기 어려워요. 질문주신 내용은 따로 보관하여 더 보완하도록 하겠습니다. 감사합니다."`, 설정으로 변경.
- 보관: **90일 후 자동 삭제**(설정으로 변경), 관리자가 확인·처리하면서 직접 삭제도 가능. ADR-0013.

## 설계 초안

- V2 마이그레이션 `chat_unanswered_question`: `id, question, answer, reason(NO_EVIDENCE|NO_CITATION), retrieved jsonb(검색된 문서 slug·제목·거리), session_id(nullable, on delete set null), status(OPEN|RESOLVED|IGNORED), admin_note, created_at, handled_at`
- 기록은 답변 완료 후 별도 트랜잭션. 세션이 24시간 뒤 삭제돼도 이 기록은 90일 유지(세션 연결만 끊김).
- 스트림 처리: 답변 첫 조각들을 표시 길이만큼 모았다가 표시 여부를 판정한 뒤 흘려보낸다.
- 관리자 API: `GET /api/admin/chat/unanswered?status=&page=&size=`, `PUT /api/admin/chat/unanswered/{id}` `{status, adminNote}`, `DELETE /api/admin/chat/unanswered/{id}`
- 프롬프트 변경은 ADR-0007(측정으로 검증된 프롬프트)에 후속 결정으로 기록하고, 실제 모델로 PoC 질문 7개를 재측정한다(표시 누락·오판정 확인).
- 보관 기간·목적은 ADR로 기록한다(방문자 질문의 개인정보 가능성).

## 결과 — 2026-09-17

- 사용자 로컬 실행: 전체 101건 통과. 추가: NoAnswerMarkerTest 4, UnansweredQuestionTest 8. 첫 실행에 통과.
- 구현: V2 `chat_unanswered_question`, `NoAnswerMarker`(스트림에서 표시 제거, 조각 경계 처리), 프롬프트 변경(ADR-0007 후속), `done.unanswered`, `UnansweredQuestionService`(기록·목록·처리·삭제·90일 정리), 관리자 API.
- 기본 안내 문구는 코드 상수(`ChatService.DEFAULT_GUIDE`)다. `.properties`의 한글 인코딩 문제를 피하기 위해서다. `.env`의 한글 `CHAT_NO_ANSWER_GUIDE`가 깨지지 않는지는 미검증.
- 남은 것: 실제 모델로 PoC 질문 7개 재측정(표시 누락·오판정, 안내 문구 자연스러움).
