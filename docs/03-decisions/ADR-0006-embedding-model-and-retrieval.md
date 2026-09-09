# ADR-0006: Embedding Model and Retrieval Policy

- Status: **Proposed** — 사용자 확정 전
- Date: 2026-09-09

## Context

ADR-0001이 LLM 제공자를 OpenAI로 확정했으나 구체 모델은 미정이었다. RAG_DESIGN은 `text-embedding-3-small`을 후보로만 기록했고 DATA_MODEL의 `vector(1536)`도 후보값이었다.

`poc/rag_eval.py`로 `samples/`의 실제 콘텐츠(공개 문서 5건, 35청크)와 대표 질문 7개를 측정했다. 아래 결정은 그 측정에 근거한다.

## Evidence

| 질문 | 기대 출처 | 상위 1건 점수 | 결과 |
|---|---|---|---|
| React Native를 사용한 프로젝트 경험이 있나요? | viora | 0.372 | 포함 |
| AI 관련 프로젝트 경험을 정리해주세요. | viora | 0.425 | 포함 |
| 폐쇄망에서 실시간 영상을 어떻게 전송했나요? | yujin-robot, websocket-binary-video | 0.518 | 포함 |
| 브라우저에서 USB 기기와 직접 통신한 경험이 있나요? | syncmaster, web-serial-usb | 0.439 | 포함 |
| 오프라인 우선 앱에서 동기화 충돌을 어떻게 처리했나요? | syncmaster | 0.520 | 포함 |
| WebRTC 대신 WebSocket을 선택한 이유가 뭔가요? | websocket-binary-video, yujin-robot | 0.678 | 포함 |
| OAuth 인증 관련 트러블슈팅 경험을 설명해주세요. | 없음(근거 부족 기대) | 0.342 | — |

기대 출처 포함 7/7. 임베딩 차원은 실측 1536이다. 상위 5건 전체 점수는 [RAG_MEASUREMENTS](../06-testing/RAG_MEASUREMENTS.md#측정-2--검색-회수)에 있다.

비공개 문서 `offline-first-boundary`는 어떤 질문의 상위 결과에도 등장하지 않았다. "오프라인 우선 앱에서 동기화 충돌"은 그 비공개 글의 제목과 거의 같은 질문인데도 공개 원본인 `syncmaster`가 0.520으로 최상위였다. ADR-0005의 조회 시점 필터가 실제로 동작한다(RAG-007).

## Decision

1. **임베딩 모델은 `text-embedding-3-small`, 차원은 1536으로 고정한다.** 한국어 질문에서 기대 출처를 모두 회수했다. DATA_MODEL의 `vector(1536)`을 확정값으로 승격한다.

2. **청킹은 섹션 기준으로 하고 200자 미만 섹션은 인접 청크에 병합한다.** 상한 1200자 분할 규칙은 유지하되 현재 콘텐츠에서는 발동하지 않는다(최장 섹션 647자). 병합 청크가 복수 섹션에 걸치므로 출처는 `section_titles` 배열로 보존한다.

3. **"근거 부족" 판정을 유사도 임계값으로 하지 않는다.** 근거 있는 질문의 최저 상위 점수가 0.372, 근거 없는 질문의 상위 점수가 0.342로 간격이 0.030에 불과하다. 고정 컷오프는 이 간격 안에서 정상 질문을 근거 없음으로 잘라내거나 그 반대를 한다. 검색 결과를 생성 단계에 넘기고 LLM이 근거 충분 여부를 판단하게 한다. ADR-0004의 "근거가 부족하면 부족함을 명시한다"는 검색이 아니라 생성 단계의 책임이다.

4. **검색 상위 K는 5로 시작한다.** 측정에서 기대 출처가 모두 상위 5 안에 들어왔다.

5. **Hybrid search(키워드 + 벡터)를 Backlog에서 검토 대상으로 승격한다.** 확정이 아니다. "React Native" 질문의 상위 점수가 0.372로 가장 낮았는데, 해당 기술명이 긴 청크 안에 한 번 등장하는 형태라 벡터 유사도가 희석된다. 기술명 조회는 포트폴리오 챗봇의 주요 사용 패턴이므로 실제 콘텐츠가 늘어난 뒤 재측정한다.

생성 모델은 이 ADR에서 결정하지 않는다. 측정하지 않았다.

## Alternatives Considered

- **`text-embedding-3-large`(차원 3072)**: 회수 품질이 더 나을 수 있으나 `-small`이 7/7을 회수한 상태에서 비용이 약 6.5배이고 저장 공간과 인덱스 크기가 2배가 된다. 회수 실패가 관측되면 재검토한다.
- **유사도 임계값 컷오프**: 검색 단계에서 걸러내면 생성 비용이 줄지만, 측정된 간격 0.030으로는 안정적인 값을 정할 수 없다. 콘텐츠가 늘어 분포가 벌어지면 재검토한다.
- **더 작은 청크(문단 단위)**: 현재 중앙값 367자에서 회수가 충분해 더 쪼갤 근거가 없다.

## Consequences

- `document_chunk.embedding`이 `vector(1536)`로 고정된다. 모델을 바꾸면 전체 재임베딩이 필요하다.
- 근거 판정이 생성 단계로 넘어가므로 근거 없는 질문에도 LLM 호출이 발생한다. 질문당 비용이 검색 컷오프 방식보다 높다. 챗봇 질문 제한(ADR-0002)이 이 비용의 상한을 잡는 장치다.
- 측정 표본이 문서 5건, 질문 7개다. 실제 콘텐츠가 늘어나면 점수 분포가 달라질 수 있고, 특히 근거 부족 판정과 Hybrid search 필요성은 재측정 대상이다.
- 측정은 메모리 코사인 계산으로 했다. pgvector HNSW의 근사 검색은 회수율이 다를 수 있으며 실제 DB에서 재확인이 필요하다.
- 블로그 3편이 AI 초안이라 문체가 균질하다. 실제 원고로 교체하면 결과가 달라질 수 있다.

## Related Documents

- [RAG Design](../02-design/RAG_DESIGN.md)
- [Data Model](../02-design/DATA_MODEL.md)
- [RAG Answer and Session Policy](ADR-0004-rag-answer-and-session-policy.md)
- [Content and Document Model](ADR-0005-content-and-document-model.md)
- [PoC Harness](../../poc/README.md)
- [Measurements](../06-testing/RAG_MEASUREMENTS.md)
