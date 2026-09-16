# ADR-0008: REST API and Chat SSE

- Status: Accepted
- Date: 2026-09-16

## Context

Public/Admin 데이터 교환과 RAG 답변 진행 과정 표시가 필요하다. 사용자가 REST + JSON 및 채팅 SSE 추천안을 채택했다.

## Decision

- 일반 조회·등록·수정·삭제는 REST API와 JSON을 사용한다.
- 채팅은 SSE로 처리 상태, 검색 문서 목록, 답변 조각과 완료를 전달한다.
- 서버의 실제 처리 단계에 맞춰 문서를 찾는 중 → 검색 문서 제목 → 필요 시 연관 문서 확인 → 답변 작성 → 완료를 표시한다.
- 검색 결과를 얻은 시점에 제목 목록을 전송한다. 여러 문서를 한 번에 찾으면 함께 표시한다.
- 검색 중 확인한 문서와 최종 답변에서 인용한 출처를 구분한다.
- 문서 제목·ID·링크에도 공개 범위 정책을 적용한다. 비공개 문서는 진행 이벤트에서도 노출하지 않는다.

## Consequences

진행 상태는 서버 RAG 처리 단계에서 생성한다. 모델 내부 추론을 표시하는 기능이 아니다. Spring AI 생성 스트림과 서버 진행 이벤트를 하나의 응답 흐름으로 연결한다.

정확한 URL, 요청 방식, 이벤트 스키마, 오류·연결 끊김·재시도 정책은 API_DESIGN에서 구현 시 구체화한다. API 방식의 채택과 실행 검증은 구분한다.

## Related

- [API Design](../02-design/API_DESIGN.md)
- [공개 범위 정책](ADR-0005-content-and-document-model.md)
