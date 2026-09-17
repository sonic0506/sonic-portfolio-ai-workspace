# FAQ Implementation

Status: Done (2026-09-17)

**Spec:** [ADR-0014](../03-decisions/ADR-0014-faq-answers.md), RAG_MEASUREMENTS 측정 5·6.

## 경과

1. 사용자 요청: 관리자 등록 질문·답변으로 답하고, 같은 뜻의 다른 표현에도 답한다.
2. 측정 5(`poc/faq_threshold.py`): 짧은 질문끼리 임베딩 거리는 같은 뜻/다른 뜻이 겹쳐 거리 기준만으로는 불가.
3. 결정: FAQ를 RAG 문서로 색인하고 같은 뜻 판단은 생성 모델이 한다. 질문 1개 등록(A)으로 시작, 다른 표현(`faq_alias`)은 스키마만 준비.
4. 구현: V3(`faq`, `faq_alias`, document_type FAQ), `DocumentProjector.projectFaq`, 프롬프트 규칙, 출처 `type FAQ / url null`, `/api/admin/faqs`(등록 시 `fromUnansweredId`로 미답변 질문 처리됨).
5. 검증: 사용자 로컬 107건 통과(FaqAdminApiTest 6, 첫 실행). 실제 모델 측정 6에서 6/6.

## 남은 것

- 다른 표현(B) 관리 API·화면 — 필요 시
- 안내 문구의 주제를 명사형으로 쓰도록 프롬프트 다듬기(측정 6 개선 후보)
- 바뀐 프롬프트로 PoC 근거 있는 질문 6개 재확인
