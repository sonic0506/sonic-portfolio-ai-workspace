# ADR-0005: Content and Document Model

- Status: Accepted
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

## 후속 결정 — 2026-09-17 (참고 문서 표시)

사용자 요청: 프로젝트·블로그 상세에서 "이 문서가 참고한 문서"와 "이 문서를 참고한 문서"를 나눠 보여준다. 사용자 선택(A):

- `RELATED_TO` 한 종류를 유지하고 뜻을 **"source가 target을 참고한다"**로 정한다. 저장값·스키마는 바꾸지 않는다(마이그레이션 없음). 연결 종류를 늘리는 것(B)은 필요할 때 추가한다.
- 방향이 의미를 가진다. 상세 화면은 나가는 연결을 **참고 문서**(`references`), 들어오는 연결을 **이 문서를 참고한 문서**(`referencedBy`)로 따로 보여준다. A→B와 B→A를 둘 다 저장할 수 있다(서로 참고).
- 연결 대상은 **프로젝트와 블로그만**이다(프로젝트↔블로그, 프로젝트끼리, 블로그끼리). 프로필·FAQ는 연결하지 않는다.
- 비공개 문서는 두 목록 모두에서 제외한다(3절 조회 시점 필터 유지). 관리자 화면은 비공개도 공개 여부와 함께 보여준다.
- 편집은 프로젝트·블로그 관리 요청의 `references`(나가는 연결) 전체 교체로 한다. 들어오는 연결은 상대 문서에서 편집한다.
- RAG Relation Expansion과 Graph는 계속 양방향으로 탐색한다. 방향은 화면 표시에만 쓴다.
- 기존 "저장은 방향이 있고 탐색은 양방향" 원칙에서 **표시**만 방향별로 나뉜다. 샘플의 상호 중복 연결(프로젝트↔블로그 양쪽 기재)은 한 방향으로 정리했다(samples/README).

## 후속 결정 3 — 2026-09-29 (블로그 카테고리 단일 선택)

사용자 결정: 블로그 카테고리를 하나만 고른다. sonic-portfolio UI 적용(위키형 목록에서 글을 카테고리 하나로 묶어 보여줌)과 함께 정했다.

- `blog_category` 연결 테이블을 없애고 `blog_post.category_id`(FK, `on delete restrict`)로 바꾼다(V4 마이그레이션). 기존 연결은 `display_order`가 가장 앞선 하나를 남긴다.
- 필수다. 관리 API(`categoryId`)에서 검사하며, DB 컬럼은 기존 데이터 때문에 null을 허용한다.
- 공개 API는 `categories[]` 대신 `category{code,name}`를 준다. 카테고리는 RAG 색인·검색에 쓰이지 않으므로 재색인이 필요 없다.
- `content/`·`samples/` front matter는 `category:` 한 값으로 바꿨다. 기존 여러 값 중 먼저 적힌 것을 남겼다(사용자 확인).
- 태그는 계속 여러 개다.
- **카테고리 색(2026-09-29 사용자 결정):** `category.color`에 `#RRGGBB`를 저장한다(V5, 어드민에서 편집). 화면은 이 색을 점(dot)에만 쓰고 글자는 중립색이라 라이트·다크 대비를 따로 두지 않는다. 대안이었던 팔레트 키 저장(대비 보장)·프론트 code 매핑(새 카테고리는 회색)은 택하지 않았다. 공개 응답의 블로그 카테고리·카테고리 목록·참고 문서(블로그)에 `color`가 붙는다.

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
- 2026-09-09 사용자가 세 결정을 그대로 채택했다.

## Related Documents

- [Data Model](../02-design/DATA_MODEL.md)
- [Content Spec](../00-project/CONTENT_SPEC.md)
- [RAG Answer and Session Policy](ADR-0004-rag-answer-and-session-policy.md)
- [Sample Content](../../samples/README.md)
