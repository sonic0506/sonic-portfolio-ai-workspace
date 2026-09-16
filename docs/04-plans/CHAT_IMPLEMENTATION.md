# Chat (Search + Answer) Implementation

Status: Active — 구현·테스트 완료(2026-09-16), 실제 OpenAI 질문 재현 남음
Date: 2026-09-16

**Goal:** 방문자 질문 1개에 공개 근거만으로 답하고, 처리 과정을 SSE로 보여준다. 세션(대화 이력)은 다음 단계다.

**Spec:** [ADR-0004](../03-decisions/ADR-0004-rag-answer-and-session-policy.md), [ADR-0006](../03-decisions/ADR-0006-embedding-model-and-retrieval.md), [ADR-0007](../03-decisions/ADR-0007-generation-model-and-answer-prompt.md), [ADR-0008](../03-decisions/ADR-0008-rest-and-chat-sse.md), [RAG_DESIGN](../02-design/RAG_DESIGN.md), API_DESIGN "Chat Progress Stream".

## 사용자 결정 (2026-09-16)

- 첫 구현은 **단일 질문**(대화 이력 없음). 세션 보관·복원 정책은 다음 단계에서 정한다.
- 질문 제한 초기값: **IP당 하루 20회**, 전체 하루 300회 상한. 서버 메모리 집계(재시작 시 초기화), 설정으로 끄거나 수치 변경(ADR-0002).

## 설계

- `POST /api/chat` `{"question": "..."}` → `text/event-stream`. 익명 허용. 세션 쿠키로 권한을 주지 않는 경로라 CSRF 검사에서 제외한다.
- 요청 검증: 질문 1~500자(`400`), 제한 초과 `429`, 임베딩·생성 모델이 꺼져 있으면 `503`. 모두 스트림 시작 전에 판정한다.
- 처리 순서와 이벤트
  1. `status {stage: "SEARCHING"}` → 질문 임베딩, pgvector 코사인 거리 상위 5청크(`document.visible` 조인, ADR-0005)
  2. `documents {documents: [...]}` — 검색된 공개 문서(문서 단위 중복 제거)
  3. 연관 문서가 있으면 `status {stage: "EXPANDING"}` → 상위 문서와 연결된(양방향) **공개** 문서 최대 2건에서 질문과 가장 가까운 청크 1개씩 추가 → `documents` 다시 전송(추가분)
  4. `status {stage: "ANSWERING"}` → ADR-0007 프롬프트로 생성, 조각마다 `answer_delta {text}`. 근거가 없어도 생성은 호출한다(ADR-0007 결정 4).
  5. `done {sources: [...]}` — 답변에 실제로 나온 `[n]` 번호의 문서만(검색 문서와 구분, ADR-0008)
  - 오류 시 `error {message}` 후 종료
- 문서 표현: `{type, slug, title, url}`. URL은 `/projects/{slug}`, `/blog/{slug}`, `/profile`. 내부 ID는 보내지 않는다.
- 근거 번호는 청크 단위 `[1]..[k]`(PoC와 동일), 출처는 문서 단위로 묶는다(ADR-0007 결정 3).
- 색인 대기(`PENDING`) 문서도 기존 청크가 있으면 검색된다(재색인 성공 전까지 옛 청크 유지).
- 모델: 생성 `gpt-4.1-mini`, temperature 0(`CHAT_PROVIDER=openai`일 때만). 생성 호출은 `ChatGenerator` 인터페이스 뒤에 두고 테스트는 가짜를 쓴다.
- 프록시 뒤 배포 시 IP 판정(`X-Forwarded-For`)은 배포 단계에서 `server.forward-headers-strategy`로 설정한다.

## Tasks

- [x] `chat` 패키지: `ChatController`(SSE), `ChatService`, `Retriever`(pgvector), `ChatGenerator`·`SpringAiChatGenerator`, `ChatRateLimiter`, 프롬프트 상수
- [x] 설정: `CHAT_PROVIDER`, 모델·온도, `app.chat.limit.*`, `app.chat.async`
- [x] SecurityConfig: `POST /api/chat` 익명 허용, CSRF 제외
- [x] 테스트: 이벤트 순서, 비공개 문서 제외(검색·확장·출처), 출처 번호 매핑, 근거 없음에도 생성 호출, 제한 429, 검증 400, 모델 꺼짐 503, 생성 오류 시 error 이벤트
- [ ] (사용자 확인 후) 실제 OpenAI로 PoC 질문 7개 재현 — 기대 출처·근거 부족 거부·비공개 미노출

## 범위 밖

세션·후속 질문(RAG-005/006/008/009), Reranking, Hybrid search, Playground, 프론트 화면.

## 결과 — 2026-09-16

- 사용자 로컬 실행(18:27 KST): 전체 77건 통과. 추가: ChatApiTest 7, ChatRateLimiterTest 2.
- 테스트는 한 축 값 벡터로 검색 순위를 고정하고, 비공개 문서를 질문과 가장 가깝게 두어 검색·확장·프롬프트 어디에도 들어가지 않는 것을 확인했다.
- 테스트 프로필은 `app.chat.async=false`로 파이프라인을 요청 스레드에서 실행한다(테스트 트랜잭션 데이터를 보기 위해). 운영은 가상 스레드에서 실행한다.
- 발견·수정: 생성자가 둘인 `ChatRateLimiter`를 Spring이 선택하지 못해 컨텍스트 로드 실패(67건 연쇄 실패) → `@Autowired` 지정.
- 미검증: 실제 `gpt-4.1-mini` 스트리밍, 실제 브라우저/프록시에서의 SSE 버퍼링, pgvector HNSW 인덱스 사용 여부(현재 문서 수가 적어 순차 스캔일 수 있음).

## 실제 질문 재현 방법 (사용자 확인 후)

```sh
# backend/.env: EMBEDDING_PROVIDER=openai, CHAT_PROVIDER=openai, OPENAI_API_KEY=...
./gradlew bootRun --args='--spring.profiles.active=local'
curl -N -X POST http://localhost:8080/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"question":"폐쇄망에서 실시간 영상을 어떻게 전송했나요?"}'
```

PoC 질문 7개(poc/rag_eval.py EVAL)의 기대 출처와 비교하고, OAuth 질문은 근거 부족 답변, 오프라인 동기화 질문은 비공개 글 미노출을 확인한다.
