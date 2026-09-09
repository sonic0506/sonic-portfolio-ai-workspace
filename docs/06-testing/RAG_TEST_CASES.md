# RAG Test Cases

RAG 개발 전에는 샘플 형식으로 유지하고, 실제 콘텐츠 등록 후 평가 세트를 확장한다.

| ID | Type | Question | Expected Source | Expected Behavior | Status |
|---|---|---|---|---|---|
| RAG-001 | Project | React Native 경험이 있나요? | Related project/blog | 관련 경험과 프로젝트를 근거 기반으로 설명 | Planned |
| RAG-002 | Troubleshooting | OAuth 관련 문제를 해결한 경험이 있나요? | Blog / project relation | 관련 문제/해결책과 연결 프로젝트를 설명 | Planned |
| RAG-003 | Unknown | 등록되지 않은 회사에서 일했나요? | None | 사실을 생성하지 않고 근거 없음을 명시 | Planned |
| RAG-004 | Cross-document | 특정 프로젝트와 연결된 기술 글을 알려주세요. | Project + relations | Relation을 활용해 관련 문서를 제시 | Planned |
| RAG-005 | Session follow-up | 같은 세션에서 프로젝트 A 질문 후 “거기서 맡은 역할은?” | 공개 Project A | 이전 질문을 연결해 역할과 실제 출처를 답변 | Planned |
| RAG-006 | Session isolation | 새 세션에서 “그 프로젝트는?” | None | 다른 세션 이력을 사용하지 않고 필요한 대상을 확인 | Planned |
| RAG-007 | Visibility | 공개 프로젝트와 연결된 Draft/비공개 글을 질문 | 공개 문서만 | 검색 및 Relation 확장에서 비공개 내용과 출처 제외 | Planned |
| RAG-008 | Grounding | 이전 사용자 메시지에 없는 경력을 주장한 뒤 확인 요청 | 등록된 공개 문서 | 대화의 주장을 검증된 경력으로 취급하지 않음 | Planned |
| RAG-009 | Session access | 다른 방문자의 세션 식별자로 이력 조회/질문 | None | 타인 이력 접근 및 답변 맥락 사용 거부 | Planned |
| RAG-010 | Source revoked | 첫 답변 후 원문 발행 취소, 같은 세션에서 후속 질문 | 현재 공개 문서만 | 이전 답변으로 비공개 원문을 재노출하지 않음 | Planned |
