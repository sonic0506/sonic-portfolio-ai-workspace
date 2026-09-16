# API Design

Status: Draft

API 방식은 [ADR-0008](../03-decisions/ADR-0008-rest-and-chat-sse.md)로 확정했다. 일반 기능은 REST + JSON, 채팅 응답은 SSE를 사용한다. 상세 Endpoint와 payload 계약은 아직 Draft다.

## API Domains

### Public
- Profile read
- Project list/detail
- Blog list/detail
- Category/Tag browse
- Graph read
- Chat

### Admin
- Authentication
- Profile CRUD
- Career/Skill CRUD
- Project CRUD
- Blog CRUD
- Category/Tag CRUD
- Relation CRUD
- RAG index/re-index
- RAG playground

## Contract Principle

- Public read model과 Admin write model을 필요에 따라 분리한다.
- RAG 내부 처리 모델을 Public API에 그대로 노출하지 않는다.
- API 변경 시 본 문서 및 관련 테스트를 함께 수정한다.

## Chat Progress Stream

서버의 실제 처리 단계에 맞춰 상태와 데이터를 전달한다. 아래 이벤트 이름은 계약 초안이다.

| 이벤트 | UI 동작 |
|---|---|
| status | 문서를 찾는 중 / 관련 문서를 확인하는 중 / 답변을 작성하는 중 |
| documents | 검색된 공개 문서의 ID·제목·링크 표시, 문서 기준 중복 제거 |
| answer_delta | 생성된 답변 조각을 순서대로 추가 |
| done | 완료 처리 및 최종 인용 출처 표시 |

검색에서 확인한 문서 목록과 최종 인용 출처는 별개다. 검색 결과가 확보된 뒤 제목을 표시하고, 실제 연관 문서 확장이 있을 때만 추가 검색 상태를 표시한다. 비공개 문서의 제목·ID·링크는 전송하지 않는다.

### 구현 시 구체화 및 검증

- 질문 전송과 SSE 응답 연결 방식, 세션 식별자, 이벤트 payload를 확정한다.
- 오류/취소/연결 끊김의 종료 처리와 재시도 시 중복 생성 방지 정책을 정한다.
- 배포 경로에서 버퍼링 없이 이벤트가 도착하는지 확인한다.
- 상태 → 문서 목록 → 답변 → 완료의 순서, 근거 없음, 비공개 문서 미노출을 검증한다.
