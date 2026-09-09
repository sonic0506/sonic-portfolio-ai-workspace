# ADR-0005: Content and Document Model

- Status: **Proposed** — 사용자 확정 전
- Date: 2026-09-09

## Context

`samples/`의 실제 콘텐츠(대표 프로젝트 3건, 블로그 3편)를 기준으로 ERD 초안을 작성하면서, COMMON_RULES 8절이 ADR 대상으로 지정한 항목 세 가지가 결정을 요구했다.

- Project / Blog / Profile이 모두 "제목 + Markdown 섹션 + 추천 질문 블록" 구조를 쓴다. 저장 방식이 CONTENT_SPEC 5절에서 미정이다.
- DATA_MODEL 기존 문서가 "Relation의 기준 ID가 원본 Entity ID인지 Document ID인지 구현 전 확정해야 한다"를 남겨두었다.
- ADR-0004가 비공개 콘텐츠를 검색·Relation 확장·출처에서 제외하도록 요구하지만, 그 필터를 색인 시점에 적용할지 조회 시점에 적용할지는 정하지 않았다.

샘플에서 공개 블로그가 비공개 블로그를 Relation으로 참조하는 구성이 실제로 나왔기 때문에(세 번째 항목) 구현 전에 정해야 한다.

## Decision

### 1. 섹션은 단일 테이블, 추천 질문은 본문 인라인

- Project / Blog / Profile의 섹션을 `content_section` 테이블 하나로 저장한다. 소유자는 nullable FK 3개와 `num_nonnulls(...) = 1` CHECK으로 표현해 FK 무결성과 CASCADE 삭제를 DB가 보장하게 한다.
- 추천 질문은 별도 테이블을 두지 않고 섹션 본문 Markdown 안에 컨테이너 문법으로 저장한다.

```markdown
:::questions
- 질문 1
- 질문 2
:::
```

- 본문 내 위치가 곧 표시 위치이므로 위치 필드가 필요 없다. 파서는 remark-directive를 사용하고 자체 문법을 만들지 않는다.

### 2. Relation의 기준은 Document ID

- `document_relation`은 `document.id`를 참조한다. Graph View와 RAG Relation Expansion이 같은 소스를 쓰기 위한 조건이다(ARCHITECTURE 2절).
- `document`는 `(document_type, source_id)`가 unique이며 재생성은 이 키 기준 upsert다. 따라서 재색인 후에도 `document.id`가 유지되고 기존 Relation과 인용 이력이 끊기지 않는다.
- 저장은 방향이 있고 탐색은 양방향이다. 역방향 행을 따로 만들지 않는다.
- 자기 연결은 CHECK으로, 중복은 `(source, target, relation_type)` unique로 막는다.
- MVP의 `relation_type`은 `RELATED_TO` 하나로 시작한다.

### 3. 공개 범위 필터는 조회 시점에 적용

- 비공개 콘텐츠의 Document와 Chunk를 삭제하지 않는다. 색인은 유지하고 검색·Relation 확장·출처 표시에서 `document.visible` 조인으로 제외한다.
- `document.visible`은 원본 공개 상태의 투영이며 발행/발행 취소와 같은 트랜잭션에서 갱신한다.
- 발행 취소가 재색인을 요구하지 않으므로 상태 전환과 색인 상태가 어긋날 구간이 없다.

## Alternatives Considered

**섹션 저장**
- `owner_type` + `owner_id` 다형성 컬럼: 테이블은 같지만 FK 제약과 CASCADE를 잃는다.
- Project / Blog / Profile별 섹션 테이블 3개: 구조가 동일한데 렌더러·파서·Admin 편집기를 세 번 쓰게 된다.
- JSON 컬럼: 섹션 단위 조회와 순서 변경이 불편하고 QueryDSL에서 다루기 나쁘다.
- 추천 질문 별도 테이블: 본문 내 위치를 표현할 컬럼을 다시 만들어야 한다. 본문에 있는 정보를 밖으로 빼고 위치를 복원하는 구조가 된다.

**Relation 기준 ID**
- 원본 Entity ID 기준: Project↔Blog처럼 타입이 다른 연결에서 대상 테이블을 판별할 컬럼이 또 필요하고, Graph와 RAG가 서로 다른 소스를 보게 된다.

**공개 범위 필터**
- 색인 시점 필터(비공개 시 Chunk 삭제): 검색 경로가 단순해지지만 재발행 때마다 재임베딩 비용이 발생하고, 재색인 실패 시 공개된 글이 검색되지 않는 상태가 남는다. 발행 상태는 자주 바뀌는 값이라 색인 수명주기에 묶지 않는다.
- 청크에 `visible`을 복제하고 부분 HNSW 인덱스 사용: 조인이 사라져 더 빠르지만, 문서 수십~수백 규모에서는 필요 없는 비정규화다. 조인 비용이 실제로 문제가 되면 그때 전환한다.

## Consequences

- `document.visible`이 원본 공개 상태와 어긋나면 비공개 내용이 검색된다. 발행 토글과 투영 갱신을 같은 트랜잭션에 두는 것이 이 설계의 전제이며, 검증 대상이다.
- 비공개 콘텐츠의 임베딩이 DB에 남는다. 같은 RDS 인스턴스 안이고 접근 주체가 백엔드 하나이므로 수용하지만, 외부 벡터 스토어로 옮기면 재검토해야 한다.
- 추천 질문을 Markdown 본문에 두므로 질문 목록만 따로 조회하려면 본문 파싱이 필요하다. 현재 요구사항에 그런 조회가 없다.
- `content_section`의 CHECK 제약은 소유자 타입이 늘어날 때마다 컬럼과 제약을 함께 수정해야 한다. 소유자 타입은 CONTENT_SPEC 기준 세 가지로 고정되어 있다.
- 세 결정 모두 실행 검증을 거치지 않았다. 구현이 없으므로 성능·정합성은 미검증이다.

## Related Documents

- [Data Model](../02-design/DATA_MODEL.md)
- [Content Spec](../00-project/CONTENT_SPEC.md)
- [RAG Answer and Session Policy](ADR-0004-rag-answer-and-session-policy.md)
- [Sample Content](../../samples/README.md)
