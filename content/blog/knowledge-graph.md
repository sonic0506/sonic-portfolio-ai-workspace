---
type: "blog"
id: "knowledge-graph"
title: "지식 그래프 (Knowledge Graph, 지식 그래프)"
summary: "지식 그래프(Knowledge Graph, KG)는 세상의 사실을 \"무엇(엔티티)이 무엇(다른 엔티티)과 어떤 관계인가\"의 형태로 저장한 그래프입니다. 점(노드)은 사람, 회사, 제품, 도시 같은 엔티티이고, 선(엣지)은 \"근무한다\", \"위치한다\", \"만든다\" 같은 관계입니다."
created_at: "2026-10-03"
updated_at: "2026-10-03"
published: true
category: "AI"
tags: ["ai", "knowledge-graph"]
skills: []
related_projects: []
related_blogs: ["ontology", "graph-rag"]
open_questions: []
---

## 1. 지식 그래프란?

**지식 그래프(Knowledge Graph, KG)**는 세상의 사실을 "무엇(엔티티)이 무엇(다른 엔티티)과 어떤 관계인가"의 형태로 저장한 그래프입니다. 점(노드)은 사람, 회사, 제품, 도시 같은 **엔티티**이고, 선(엣지)은 "근무한다", "위치한다", "만든다" 같은 **관계**입니다.

```text
          근무한다                 위치한다
 [김철수] ─────────> [네이버] ─────────> [성남시]
    │                   │
    │ 졸업했다          │ 운영한다
    ▼                   ▼
 [서울대학교]        [네이버웹툰]
```

이 그림 하나로 다음 질문에 바로 답할 수 있습니다.

- 김철수는 어디서 일하는가? → 네이버
- 김철수의 회사는 어느 도시에 있는가? → 네이버 → 성남시 (두 번 따라감)
- 네이버가 운영하는 서비스는? → 네이버웹툰

지식 그래프는 문서에 흩어진 문장("김철수는 네이버에 다닌다", "네이버 본사는 성남시에 있다")을 기계가 따라갈 수 있는 연결 구조로 바꿔 둔 것입니다.

일상에 비유하면 이렇습니다.

| 구분 | 비유 | 지식 그래프 |
|---|---|---|
| 노드 | 인맥 지도에 붙인 사람 사진 | 엔티티 (사람, 회사, 장소) |
| 엣지 | 사진 사이에 그은 실 | 관계 (근무, 위치, 소유) |
| 실 위의 메모 | "2019년부터" | 관계의 속성 |
| 사진 뒤 메모 | "1990년생, 개발자" | 엔티티의 속성 |

## 2. 구성 요소: 엔티티, 관계, 속성

### 2-1. 엔티티 (Entity)

현실에서 식별할 수 있는 대상입니다. "애플"이 과일인지 회사인지 구분하려면 엔티티마다 고유 ID가 있어야 합니다.

```text
엔티티 ID       이름       유형(타입)
──────────      ──────     ─────────
company:apple   Apple      Company
fruit:apple     사과       Fruit
person:p001     김철수     Person
```

### 2-2. 관계 (Relationship)

두 엔티티를 잇는, 방향이 있는 연결입니다. "김철수 → 근무한다 → 네이버"는 거꾸로 읽으면 의미가 달라집니다.

| 관계 | 방향 | 의미 |
|---|---|---|
| `WORKS_AT` | 사람 → 회사 | 근무한다 |
| `LOCATED_IN` | 회사 → 도시 | 위치한다 |
| `ACQUIRED` | 회사 → 회사 | 인수했다 |
| `SUBSIDIARY_OF` | 회사 → 회사 | 자회사이다 |

### 2-3. 속성 (Property)

엔티티나 관계에 붙는 값입니다.

```text
[김철수] {birthYear: 1990, job: "백엔드 개발자"}
   │
   │ WORKS_AT {since: 2019, role: "시니어"}
   ▼
[네이버] {founded: 1999, employees: ...}
```

엔티티 속성은 "그 대상 자체의 정보", 관계 속성은 "그 연결에 대한 정보"입니다. "2019년부터"는 김철수나 네이버 한쪽이 아니라 둘 사이 관계에 붙는 속성입니다.

## 3. 트리플: 지식의 최소 단위

지식 그래프의 사실 하나는 **트리플(Triple)**, 즉 **주어-술어-목적어(Subject-Predicate-Object)** 세 칸으로 표현됩니다.

```text
주어 (Subject)    술어 (Predicate)    목적어 (Object)
──────────────    ────────────────    ───────────────
김철수            근무한다            네이버
네이버            위치한다            성남시
네이버            설립연도            1999
김철수            졸업했다            서울대학교
```

목적어 자리에는 **다른 엔티티**(네이버)가 올 수도 있고 **값**(1999)이 올 수도 있습니다. 엔티티가 오면 엣지가 되고, 값이 오면 속성이 됩니다.

트리플을 쌓기만 하면 그래프가 됩니다. 같은 주어나 목적어를 공유하는 트리플들이 자연스럽게 연결되기 때문입니다.

```text
(김철수, 근무한다, 네이버)  ┐
(네이버, 위치한다, 성남시)  ├──> 김철수 → 네이버 → 성남시
                            ┘    "네이버"가 접점
```

그래서 새 사실을 추가할 때는 테이블 스키마를 바꾸지 않고 트리플 한 줄만 추가하면 됩니다.

## 4. 두 가지 데이터 모델: 프로퍼티 그래프 vs RDF

지식 그래프를 실제로 저장하는 방식은 크게 두 계열입니다.

| 구분 | 프로퍼티 그래프 (Property Graph) | RDF 그래프 |
|---|---|---|
| 대표 제품 | Neo4j, Amazon Neptune, Memgraph | GraphDB, Apache Jena, Virtuoso, Neptune |
| 질의 언어 | Cypher (GQL 표준화 진행) | SPARQL |
| 기본 단위 | 노드, 관계, 각각에 붙는 속성 | 트리플 (주어-술어-목적어) |
| 식별자 | DB 내부 ID | 전역 URI (IRI) |
| 관계 속성 | 관계에 바로 붙일 수 있다 | 기본적으로 불편 (RDF-star 등으로 보완) |
| 강점 | 개발자 친화적, 빠른 탐색 | 표준화, 데이터 통합, 추론(온톨로지) |
| 주 사용처 | 추천, 사기 탐지, 앱 백엔드 | 공공 데이터, 생명과학, 기업 데이터 통합 |

### 4-1. 프로퍼티 그래프와 Cypher

Neo4j의 Cypher는 그래프 모양을 **ASCII 아트처럼** 씁니다. `()`는 노드, `-[]->`는 관계입니다.

```cypher
// 데이터 생성
CREATE (p:Person {name: "김철수", birthYear: 1990})
CREATE (c:Company {name: "네이버", founded: 1999})
CREATE (city:City {name: "성남시"})
CREATE (p)-[:WORKS_AT {since: 2019}]->(c)
CREATE (c)-[:LOCATED_IN]->(city);
```

```cypher
// 김철수의 회사가 있는 도시는?
MATCH (p:Person {name: "김철수"})-[:WORKS_AT]->(c:Company)-[:LOCATED_IN]->(city:City)
RETURN c.name, city.name;
```

```cypher
// 성남시에 있는 회사에서 2020년 이전부터 일한 사람
MATCH (p:Person)-[w:WORKS_AT]->(c:Company)-[:LOCATED_IN]->(:City {name: "성남시"})
WHERE w.since < 2020
RETURN p.name, c.name, w.since;
```

관계 `w`에 붙은 `since` 속성을 바로 조건에 쓸 수 있다는 점이 프로퍼티 그래프의 편리함입니다.

### 4-2. RDF 그래프와 Turtle

RDF(Resource Description Framework)는 W3C 표준입니다. 모든 것을 **트리플**로 표현하고, 엔티티와 관계를 **URI**로 식별합니다. Turtle은 RDF를 사람이 읽기 쉽게 쓰는 문법입니다.

```turtle
@prefix ex:  <http://example.org/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

ex:kimcs   a              ex:Person ;
           ex:name        "김철수" ;
           ex:birthYear   "1990"^^xsd:integer ;
           ex:worksAt     ex:naver .

ex:naver   a              ex:Company ;
           ex:name        "네이버" ;
           ex:locatedIn   ex:seongnam .

ex:seongnam a             ex:City ;
           ex:name        "성남시" .
```

- `a`는 `rdf:type`의 줄임말로 "~의 인스턴스이다"라는 뜻입니다.
- `;`는 같은 주어로 이어 쓴다는 뜻입니다.
- `ex:naver`는 `http://example.org/naver`라는 **전역 식별자**입니다.

같은 질문을 SPARQL로 쓰면 이렇습니다.

```sparql
PREFIX ex: <http://example.org/>
SELECT ?companyName ?cityName WHERE {
  ?p ex:name "김철수" ;
     ex:worksAt ?c .
  ?c ex:name ?companyName ;
     ex:locatedIn ?city .
  ?city ex:name ?cityName .
}
```

### 4-3. URI가 왜 중요한가

RDF의 URI는 **전 세계에서 유일한 이름**입니다. 서로 다른 조직이 만든 데이터라도 같은 URI를 쓰면 자동으로 합쳐집니다.

```text
A 회사 데이터:  <http://www.wikidata.org/entity/Q_EXAMPLE>  ex:hasPartner  ex:companyX .
B 기관 데이터:  <http://www.wikidata.org/entity/Q_EXAMPLE>  ex:taxId       "220-81-..." .
                             │
                             └─ 같은 URI → 두 데이터셋이 한 그래프로 연결
```

(`Q_EXAMPLE`은 자리표시자입니다.)

프로퍼티 그래프는 DB 하나 안에서 빠르게 쓰기 좋고, RDF는 **여러 출처의 데이터를 이어 붙이고 의미를 공유**하는 데 강합니다. 관계에 속성을 붙이는 문제는 RDF 1.2 / RDF-star에서 트리플 자체에 주석을 다는 방식으로 보완하고 있습니다.

## 5. 관계형 DB와 무엇이 다른가?

### 5-1. 같은 데이터를 테이블로 저장하면

```text
persons                 employments                     companies
┌────┬────────┐         ┌──────────┬──────────┬───────┐  ┌────┬────────┬─────────┐
│ id │ name   │         │person_id │company_id│ since │  │ id │ name   │ city_id │
├────┼────────┤         ├──────────┼──────────┼───────┤  ├────┼────────┼─────────┤
│ 1  │ 김철수 │         │ 1        │ 10       │ 2019  │  │ 10 │ 네이버 │ 100     │
└────┴────────┘         └──────────┴──────────┴───────┘  └────┴────────┴─────────┘
```

"김철수의 회사가 있는 도시"는 조인 세 번입니다.

```sql
SELECT c.name, ci.name
FROM persons p
JOIN employments e ON e.person_id = p.id
JOIN companies   c ON c.id = e.company_id
JOIN cities      ci ON ci.id = c.city_id
WHERE p.name = '김철수';
```

이 정도는 SQL로도 문제없습니다. 어려워지는 것은 관계를 몇 번 따라갈지 미리 모를 때입니다.

### 5-2. 다중 홉 질의: "친구의 친구의 친구"

"김철수와 3단계 이내로 연결된 사람 중 같은 회사 출신"을 SQL로 쓰면 자기 조인이 계속 늘어나거나 재귀 CTE가 필요합니다.

```sql
WITH RECURSIVE reach(person_id, depth) AS (
  SELECT friend_id, 1 FROM friendships WHERE person_id = 1
  UNION
  SELECT f.friend_id, r.depth + 1
  FROM friendships f JOIN reach r ON f.person_id = r.person_id
  WHERE r.depth < 3
)
SELECT DISTINCT person_id FROM reach;
```

Cypher는 **가변 길이 경로**를 문법으로 지원합니다.

```cypher
MATCH (me:Person {name: "김철수"})-[:FRIEND*1..3]-(other:Person)
RETURN DISTINCT other.name;
```

### 5-3. 탐색 방식의 차이

```text
관계형 DB (조인)                          그래프 DB (탐색)
─────────────────────                     ─────────────────────
1. employments 테이블 전체에서            1. 김철수 노드를 찾는다
   person_id = 1 을 인덱스로 찾는다       2. 그 노드에 붙은 WORKS_AT 엣지를
2. companies 테이블에서 id 매칭              바로 따라간다 (포인터처럼)
3. cities 테이블에서 id 매칭              3. 회사 노드의 LOCATED_IN 엣지를
                                             바로 따라간다
→ 홉마다 인덱스 조회                      → 홉마다 이웃만 본다
  (전체 테이블 크기의 영향)                  (전체 그래프 크기와 거의 무관)
```

Neo4j 같은 네이티브 그래프 DB는 노드가 자기 이웃을 직접 가리키도록 저장합니다(index-free adjacency). 그래서 홉 수가 많아질수록 관계형 DB와 차이가 커집니다.

| 구분 | 관계형 DB | 그래프 DB |
|---|---|---|
| 강한 질의 | 집계, 정렬, 대량 필터 ("지난달 매출 합계") | 연결 탐색 ("A와 B는 어떻게 이어져 있나") |
| 스키마 | 고정, 변경 시 마이그레이션 | 유연, 새 관계 유형을 바로 추가 |
| 다중 홉 | 조인/재귀 CTE, 깊어질수록 느림 | 경로 패턴 한 줄 |
| 트랜잭션·정합성 | 매우 성숙 | 제품마다 차이 |
| 생태계 | 압도적 | 상대적으로 작음 |

그래프 DB는 관계형 DB를 대체하지 않습니다. 연결 자체가 질문의 대상일 때 그래프가 유리합니다.

## 6. 지식 그래프는 어떻게 만드는가?

### 6-1. 수동 구축 (큐레이션)

전문가나 커뮤니티가 직접 입력합니다. Wikidata가 대표적입니다.

- 장점: 정확도가 높고 스키마가 일관됩니다.
- 단점: 느리고 비쌉니다. 규모를 키우기 어렵습니다.

### 6-2. 정형 데이터 변환

이미 있는 DB, CSV, API 응답을 매핑 규칙으로 변환합니다. 기업 KG의 대부분이 여기서 시작합니다.

```python
import csv

triples = []
with open("employees.csv", encoding="utf-8") as f:
    for row in csv.DictReader(f):   # name, company, since
        triples.append((f"person:{row['name']}", "WORKS_AT", f"company:{row['company']}"))
```

W3C의 R2RML처럼 관계형 DB를 RDF로 매핑하는 표준도 있습니다.

### 6-3. 비정형 텍스트에서 추출

문서에서 엔티티와 관계를 뽑아냅니다. 과거에는 NER(개체명 인식) + 관계 추출 모델을 따로 학습했고, 지금은 LLM에게 맡기는 경우가 많습니다.

```text
입력 문장: "네이버는 2021년 왓패드를 인수했다."

1. 엔티티 인식     → [네이버: Company], [왓패드: Company]
2. 관계 추출       → (네이버, ACQUIRED, 왓패드) {year: 2021}
3. 엔티티 연결     → "네이버" = 기존 노드 company:naver ?
   (Entity Linking)   "NAVER", "네이버(주)"도 같은 노드로 합친다
```

```python
PROMPT = """다음 문장에서 (주어, 관계, 목적어) 트리플을 JSON 배열로 뽑아라.
관계는 WORKS_AT, ACQUIRED, LOCATED_IN 중에서만 고른다.
문장: {text}"""

def extract(text: str, llm) -> list[dict]:
    return llm.json(PROMPT.format(text=text))  # [{"s": "네이버", "p": "ACQUIRED", "o": "왓패드"}]
```

### 6-4. 추출 방식의 어려움

| 문제 | 예시 |
|---|---|
| 엔티티 중복 | "삼성전자", "Samsung Electronics", "삼성"이 노드 셋으로 갈라짐 |
| 동음이의어 | "애플"(회사) vs "애플"(과일) |
| 관계 이름 난립 | `WORKS_AT`, `EMPLOYED_BY`, `일한다`가 섞임 |
| 틀린 추출 | LLM이 문장에 없는 관계를 만들어 냄 |
| 시간 | "CEO이다"는 언제 기준인가 |

그래서 실무에서는 허용할 엔티티·관계 유형을 미리 정해 두고(스키마), 추출 뒤에는 엔티티 해소(Entity Resolution)로 중복을 합치는 단계를 둡니다. 이 스키마를 형식적으로 정의한 것이 [온톨로지](/blog/ontology)입니다.

## 7. 대표 사례

### 7-1. Google Knowledge Graph

2012년 구글이 "Things, not strings"라는 구호와 함께 공개했습니다. 검색어를 문자열이 아니라 **엔티티**로 이해하려는 시도입니다.

```text
검색: "레오나르도 다빈치"
        │
        ▼
 ┌───────────────────────────────┐
 │ 레오나르도 다빈치              │  ← 검색 결과 오른쪽 지식 패널
 │ 이탈리아의 화가, 발명가        │
 │ 출생: 1452년, 빈치             │
 │ 작품: 모나리자, 최후의 만찬    │
 └───────────────────────────────┘
```

검색 결과 옆의 지식 패널이 이 그래프에서 나옵니다. 외부에서는 Knowledge Graph Search API로 일부를 조회할 수 있습니다.

### 7-2. Wikidata

위키미디어 재단이 운영하는 **누구나 편집할 수 있는 공개 지식 그래프**입니다(2012년 시작). 모든 엔티티는 `Q` ID, 속성은 `P` ID를 가집니다.

```text
Q42    = 더글러스 애덤스 (엔티티)
P31    = instance of (속성: ~의 인스턴스)
Q5     = human (엔티티)

(Q42, P31, Q5)  →  "더글러스 애덤스는 사람이다"
```

공개 SPARQL 엔드포인트(query.wikidata.org)에서 바로 질의할 수 있습니다.

```sparql
# 노벨 물리학상 수상자 목록
SELECT ?person ?personLabel WHERE {
  ?person wdt:P166 wd:Q38104 .            # P166 = award received, Q38104 = 노벨 물리학상
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ko,en". }
}
LIMIT 10
```

### 7-3. 그 밖의 사례

| 분야 | 사례 | 쓰임 |
|---|---|---|
| 전자상거래 | 상품 지식 그래프 | "이 카메라와 호환되는 렌즈" 추천 |
| 금융 | 기업 지배구조 그래프 | 실소유주 추적, 사기 탐지 |
| 의료·제약 | 약물-유전자-질병 그래프 | 약물 재창출 연구 |
| 소셜 | 사용자 관계 그래프 | 친구 추천 |
| 기업 내부 | 사내 지식 그래프 | 사람·프로젝트·문서 연결 |

## 8. 지식 그래프와 LLM

LLM과 지식 그래프는 서로의 약점을 메웁니다. LLM 시대에 지식 그래프가 다시 주목받는 이유입니다.

| 구분 | LLM | 지식 그래프 |
|---|---|---|
| 지식 형태 | 파라미터에 흐릿하게 저장 | 명시적 사실 |
| 출처 | 알 수 없음 | 트리플마다 추적 가능 |
| 최신성 | 학습 시점에 멈춤 | 트리플 추가로 즉시 갱신 |
| 자연어 이해 | 매우 강함 | 없음 |
| 구축 | 이미 있음 | 비쌈 |

- **LLM → KG**: LLM으로 텍스트에서 트리플을 추출해 그래프를 싸게 만듭니다.
- **KG → LLM**: 그래프에서 찾은 사실을 LLM에게 근거로 넣어 줍니다. 이것이 [Graph RAG](/blog/graph-rag)입니다.

## 9. 언제 쓰지 않는가

- **관계가 단순한 데이터**: 회원-주문-상품처럼 관계가 고정되어 있고 1~2홉이면 관계형 DB로 충분합니다.
- **집계 중심 분석**: "월별 매출 합계" 같은 질의는 그래프가 불리합니다.
- **문서 검색이 목적**: "이 내용과 비슷한 문단 찾기"는 벡터 검색이 더 단순합니다.
- **유지할 사람이 없을 때**: 지식 그래프는 만든 뒤 계속 갱신하고 정리해야 가치가 유지됩니다.

## 10. 장점과 단점

| 장점 | 설명 |
|---|---|
| 연결을 직접 표현 | 다중 홉 질문을 자연스럽게 처리 |
| 유연한 스키마 | 새 관계 유형을 마이그레이션 없이 추가 |
| 설명 가능성 | 답이 어떤 경로로 나왔는지 보여 줄 수 있다 |
| 데이터 통합 | 여러 출처를 공통 식별자로 이어 붙인다 (특히 RDF) |

| 단점 | 설명 |
|---|---|
| 구축 비용 | 추출, 정규화, 검수에 사람과 시간이 든다 |
| 품질 관리 | 중복 엔티티, 틀린 관계가 쌓이면 신뢰가 무너진다 |
| 학습 곡선 | Cypher, SPARQL, 그래프 모델링을 새로 배워야 한다 |
| 집계 성능 | 대량 집계는 관계형/컬럼형 DB보다 약하다 |

## 11. 핵심 정리

> 지식 그래프는 사실을 엔티티(노드)와 관계(엣지), 그리고 각각의 속성으로 저장한 그래프이고, 그 최소 단위는 주어-술어-목적어 트리플이다. 저장 방식은 개발자 친화적인 프로퍼티 그래프(Neo4j, Cypher)와 전역 URI로 데이터를 통합하는 RDF 그래프(Turtle, SPARQL)로 나뉜다. 관계형 DB가 홉마다 조인을 하는 반면 그래프는 이웃을 직접 따라가므로 다중 홉 질의에 강하다. 수동 큐레이션, 정형 데이터 변환, 텍스트 추출(요즘은 LLM)로 만들며, 엔티티 중복과 관계 이름 난립을 막으려면 스키마가 필요하다. Google Knowledge Graph와 Wikidata가 대표 사례이고, LLM과 결합하면 Graph RAG의 기반이 된다.
