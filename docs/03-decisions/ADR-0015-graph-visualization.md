# ADR-0015: Graph Visualization

- Status: Accepted (2026-09-29 — Claude 제안을 사용자가 "권장안대로" 채택)
- Date: 2026-09-29

## Context

GRAPH_DESIGN의 남은 결정(라이브러리, Graph API 형태, 참고 방향 표시)을 정한다. 노드 범위(Project·Blog·Skill·Category)는 2026-09-29에 정했다. 포트폴리오 디자인은 sonic-portfolio를 옮겼고(ADR-0012 후속 2), sonic에는 목업 데이터로 동작하는 force 그래프 화면이 이미 있다.

개발 DB 기준 규모(2026-09-29, 옛 샘플 포함): 노드 약 65(프로젝트 9·블로그 15·카테고리 6·스킬 35), 간선 약 131(참고 19·스킬 97·카테고리 15). 스킬 간선이 3/4이고 React 한 노드에 14개가 몰린다.

## Decision

1. **라이브러리: `react-force-graph-2d` + `d3-force`**(sonic과 같음). Canvas 렌더링, 배치 계산은 d3-force. 노드 수백 개까지 충분하다.
2. **Graph API: `GET /api/graph` 한 번에 노드·간선 전체.** 공개 문서만, 카테고리·스킬은 공개 문서가 실제로 쓰는 것만 노드가 된다. 계약은 API_DESIGN·GRAPH_DESIGN.
3. **스킬 노드는 기본 숨김**, 필터에서 켠다(허브 쏠림 완화). 데이터는 항상 전부 준다.
4. **참고 관계는 옅은 화살표로 방향을 표시**한다(source가 target을 참고). RAG Relation Expansion은 계속 양방향 탐색(ADR-0005 후속 결정).
5. 노드 모양: 프로젝트 악센트 사각형, 블로그 카테고리 색 원, 카테고리 카테고리 색 테두리 큰 원, 스킬 작은 중립 마름모. 크기는 연결 수에 비례. 간선은 참고 실선, 스킬·카테고리 옅은 선.
6. 768px 미만은 force 그래프 대신 트리 목록(sonic과 같음).

## Alternatives Considered

### Sigma.js (WebGL)
- 장점: 노드 수천~수만 개에서 빠르다.
- 단점: 현재 규모(100 이하)에서는 이점이 없고 sonic 화면을 다시 만들어야 한다.

### Cytoscape.js
- 장점: 배치 알고리즘·스타일 규칙이 풍부하다.
- 단점: 번들이 크고 sonic 화면을 다시 만들어야 한다.

### 스킬 노드 처리 — 2개 이상 문서에서 쓴 스킬만 / 전부 표시
- 기본 숨김 + 필터가 정보 손실 없이 쏠림을 피한다.

## Consequences

- 포트폴리오에 `react-force-graph-2d`, `d3-force` 의존성이 추가된다. Canvas라 스크린리더용 대체(모바일 트리와 같은 목록)가 필요하다.
- 콘텐츠 저장·색인과 무관한 조회 전용 API라 스키마 변경은 없다.
- 노드가 수백 개를 넘거나 느려지면 라이브러리를 다시 검토한다.

## Related Documents

- [GRAPH_DESIGN](../02-design/GRAPH_DESIGN.md), [API_DESIGN](../02-design/API_DESIGN.md), [ADR-0005](ADR-0005-content-and-document-model.md), [ADR-0012](ADR-0012-frontend-tooling.md)
