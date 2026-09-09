# RAG Test Cases

RAG 개발 전에는 샘플 형식으로 유지하고, 실제 콘텐츠 등록 후 평가 세트를 확장한다.

| ID | Type | Question | Expected Source | Expected Behavior | Status |
|---|---|---|---|---|---|
| RAG-001 | Project | React Native 경험이 있나요? | Related project/blog | 관련 경험과 프로젝트를 근거 기반으로 설명 | Planned |
| RAG-002 | Troubleshooting | OAuth 관련 문제를 해결한 경험이 있나요? | Blog / project relation | 관련 문제/해결책과 연결 프로젝트를 설명 | Planned |
| RAG-003 | Unknown | 등록되지 않은 회사에서 일했나요? | None | 사실을 생성하지 않고 근거 없음을 명시 | Planned |
| RAG-004 | Cross-document | 특정 프로젝트와 연결된 기술 글을 알려주세요. | Project + relations | Relation을 활용해 관련 문서를 제시 | Planned |
