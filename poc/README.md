# RAG PoC Harness

`samples/`의 실제 콘텐츠로 청킹 경계와 검색·답변 품질을 측정한다. 의존성 없이 표준 라이브러리만 쓴다.

```bash
python3 poc/rag_eval.py chunks     # 청킹 측정 (API 키 불필요)
python3 poc/rag_eval.py selftest   # 자체 검증 (API 키 불필요)
python3 poc/rag_eval.py search     # 임베딩 + 검색 평가 (OPENAI_API_KEY 필요)
python3 poc/rag_eval.py answer     # 검색 + 답변 생성 평가 (OPENAI_API_KEY 필요)
python3 poc/rag_eval.py dim        # 임베딩 차원 확인 (OPENAI_API_KEY 필요)
```

`--save`를 붙이면 결과가 `poc/results/<날짜>-<명령>.json`에 남는다. 측정값이 실행 로그에만 남아 사라지는 것을 막는다.

```bash
python3 poc/rag_eval.py chunks --save
```

키는 저장소에 두지 않는다. 셸에서 `export OPENAI_API_KEY=...` 로 넘긴다.

## 측정 결과

수치는 [`docs/06-testing/RAG_MEASUREMENTS.md`](../docs/06-testing/RAG_MEASUREMENTS.md)가 기준 문서다. 여기서 복제하지 않는다.

요약하면 청킹은 46 → 35청크(최장 섹션 647자로 분할은 미발동), 검색은 기대 출처 7/7,
답변 생성은 7/7 기대 동작이며 근거 없는 질문을 거부했다.

## 왜 Python인가

이 코드는 제품이 아니라 측정 도구다. 여기서 얻는 결론(청크 크기, 경계 규칙, 모델 적합성)은 언어와 무관하게 이전된다.
제품 구현은 [RAG_DESIGN](../docs/02-design/RAG_DESIGN.md)대로 Spring Boot에서 한다.

## 하네스가 함께 검증하는 것

`selftest`가 assert로 확인한다.

- 관리자 전용 필드(`admin_note`, `open_questions`, `sample_note`)가 색인 본문에 섞이지 않는다 — DATA_MODEL 공백 5번
- 추천 질문 블록(`:::questions`)이 색인 본문에서 제거된다 — 근거가 아니라 UI 요소이므로
- 비공개 문서(`offline-first-boundary`)가 검색 대상에서 제외된다 — ADR-0005 결정 3, RAG-007
- 병합 후 `MIN_CHARS` 미만 청크가 남지 않고, 병합 과정에서 섹션 출처가 사라지지 않는다

## 한계

[RAG_MEASUREMENTS의 한계](../docs/06-testing/RAG_MEASUREMENTS.md#한계) 참고. 요약하면 표본이 작고,
pgvector HNSW 근사 검색과 세션 관련 사례는 측정하지 않았다.
