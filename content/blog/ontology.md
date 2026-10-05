---
type: "blog"
id: "ontology"
title: "온톨로지 (Ontology, 온톨로지)"
summary: "온톨로지(Ontology)는 어떤 분야에 어떤 종류의 것들이 있고, 그것들이 서로 어떤 관계를 맺을 수 있으며, 어떤 규칙을 지켜야 하는지를 기계가 읽을 수 있게 명시한 것입니다. 컴퓨터 과학에서 자주 인용되는 정의는 \"공유된 개념화의 명시적 명세(explicit specification of a conceptualization)\"입니다."
created_at: "2026-10-03"
updated_at: "2026-10-03"
published: true
category: "AI"
tags: ["ai", "knowledge-graph", "ontology"]
skills: []
related_projects: []
related_blogs: ["knowledge-graph", "ddd"]
open_questions: []
---

## 1. 온톨로지란?

**온톨로지(Ontology)**는 어떤 분야에 **어떤 종류의 것들이 있고, 그것들이 서로 어떤 관계를 맺을 수 있으며, 어떤 규칙을 지켜야 하는지**를 기계가 읽을 수 있게 명시한 것입니다. 컴퓨터 과학에서 자주 인용되는 정의는 "공유된 개념화의 명시적 명세(explicit specification of a conceptualization)"입니다.

쉽게 말해 **[지식 그래프](/blog/knowledge-graph)의 설계도이자 사전**입니다.

```text
온톨로지 (규칙·개념)                      지식 그래프 (실제 사실)
──────────────────────                    ──────────────────────
Person 이라는 개념이 있다                  김철수는 Person 이다
Company 라는 개념이 있다                   네이버는 Company 이다
worksAt 은 Person → Company 관계다        김철수 worksAt 네이버
Employee 는 Person 의 하위 개념이다
사람은 최대 1개의 생년월일을 가진다
```

온톨로지는 다음 네 가지를 정의합니다.

| 구성 요소 | 의미 | 예 |
|---|---|---|
| 클래스 (Class) | 개념, 종류 | `Person`, `Company`, `Drug`, `Disease` |
| 속성 (Property) | 값이나 관계의 이름 | `name`, `birthDate`, `worksAt`, `treats` |
| 관계 (계층 포함) | 개념 사이의 연결 | `Employee`는 `Person`의 하위 클래스 |
| 제약 (Constraint/Axiom) | 지켜야 할 규칙 | `worksAt`의 주어는 `Person`, 목적어는 `Organization` |

비유하자면 이렇습니다.

| 구분 | 도서관 | 온톨로지 세계 |
|---|---|---|
| 분류 체계 | 십진분류표 (총류, 철학, 사회과학...) | 클래스 계층 |
| 서지 규칙 | "책에는 저자 1명 이상, ISBN 1개" | 제약 |
| 실제 책 | 서가에 꽂힌 책 한 권 한 권 | 인스턴스 (지식 그래프의 노드) |

## 2. 왜 필요할까?

### 2-1. 같은 말, 다른 뜻 / 다른 말, 같은 뜻

```text
영업팀 DB:   customer = 계약서에 서명한 회사
마케팅 DB:   customer = 뉴스레터 구독자 개인
재무 DB:     client   = 청구서를 받는 법인
```

"고객 수"를 물으면 시스템마다 다른 답이 나옵니다. 온톨로지는 `Customer`가 무엇인지, `Client`와 같은지, `Subscriber`와 어떻게 다른지를 한곳에 명시합니다.

### 2-2. 기계가 "의미"를 써먹게 하려고

"아스피린은 NSAID다", "NSAID는 진통제다"라는 사실이 있으면 사람은 "아스피린은 진통제다"를 바로 압니다. 기계도 그렇게 하려면 "~는 ~의 일종이다"라는 관계가 **전이적(transitive)**이라는 규칙이 어딘가에 적혀 있어야 합니다. 그 규칙을 적는 곳이 온톨로지입니다.

### 2-3. 데이터 품질 검증

온톨로지의 제약이 있으면 "회사가 생년월일을 가진다", "사람이 사람에게 인수되었다" 같은 이상한 데이터를 잡아낼 수 있습니다.

## 3. 지식 그래프와의 관계: 스키마 vs 데이터

온톨로지와 지식 그래프는 **스키마와 데이터**의 관계입니다. 기술 용어로는 **TBox**와 **ABox**라고 부릅니다.

| 구분 | TBox (Terminological Box) | ABox (Assertional Box) |
|---|---|---|
| 의미 | 용어·개념에 대한 진술 | 개별 대상에 대한 진술 |
| 예 | "모든 Employee는 Person이다" | "김철수는 Employee다" |
| 비유 | 관계형 DB의 테이블 정의 | 테이블의 행 |
| 변경 빈도 | 드물다 | 자주 |
| 보통 부르는 이름 | 온톨로지 | 지식 그래프 (인스턴스 데이터) |

```text
TBox (온톨로지)
  ┌──────────┐   subClassOf   ┌──────────┐
  │ Employee │ ─────────────> │  Person  │
  └──────────┘                └──────────┘
                     worksAt
  Person ─────────────────────────> Organization
────────────────────────────────────────────────── 경계
ABox (지식 그래프)
  ex:kimcs ── rdf:type ──> Employee
  ex:kimcs ── worksAt ───> ex:naver
```

관계형 DB의 스키마와 다른 점이 있습니다.

| 구분 | 관계형 DB 스키마 | 온톨로지 |
|---|---|---|
| 목적 | 저장 구조 정의 | 의미 정의 |
| 위반 데이터 | 거부 (닫힌 세계) | 보통 새 사실을 추론 (열린 세계) |
| 상속·계층 | 직접 지원 안 함 | 핵심 기능 |
| 추론 | 없음 | 추론기로 새 사실 도출 |

**열린 세계 가정(Open World Assumption)**은 중요한 차이입니다. 관계형 DB는 "기록에 없으면 거짓"으로 봅니다(닫힌 세계). OWL은 "기록에 없으면 모름"으로 봅니다. 예를 들어 `worksAt`의 목적어가 `Organization`이어야 한다고 정의했는데 `김철수 worksAt 서울`이 들어오면, DB라면 오류를 내지만 OWL 추론기는 "그렇다면 서울은 Organization이구나"라고 추론합니다. 데이터 검증이 목적이라면 뒤에서 다룰 SHACL을 함께 씁니다.

## 4. RDF → RDFS → OWL: 단계별로 표현력이 늘어난다

W3C 시맨틱 웹 표준은 층을 쌓는 구조입니다.

```text
┌──────────────────────────────────┐
│ OWL   : 논리 제약, 동치, 역관계,   │  "부모의 부모는 조상이다"
│         카디널리티, 전이성          │  "hasParent의 역은 hasChild"
├──────────────────────────────────┤
│ RDFS  : 클래스 계층, 속성 계층,    │  "Employee는 Person의 하위"
│         domain, range             │  "worksAt의 주어는 Person"
├──────────────────────────────────┤
│ RDF   : 트리플, URI                │  "김철수 worksAt 네이버"
└──────────────────────────────────┘
```

### 4-1. RDF: 사실만 있다

```turtle
@prefix ex: <http://example.org/> .

ex:kimcs  ex:worksAt  ex:naver .
ex:kimcs  a           ex:Employee .
```

RDF만으로는 `ex:Employee`가 무엇인지, `ex:worksAt`이 어떤 관계인지 알 수 없습니다. 그냥 이름입니다.

### 4-2. RDFS: 어휘와 계층

```turtle
@prefix ex:   <http://example.org/> .
@prefix rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

ex:Person        a rdfs:Class .
ex:Employee      a rdfs:Class ;
                 rdfs:subClassOf ex:Person .
ex:Organization  a rdfs:Class .
ex:Company       rdfs:subClassOf ex:Organization .

ex:worksAt       a rdf:Property ;
                 rdfs:domain ex:Person ;          # 주어는 Person
                 rdfs:range  ex:Organization ;    # 목적어는 Organization
                 rdfs:label  "근무한다"@ko .
```

| RDFS 어휘 | 뜻 |
|---|---|
| `rdfs:subClassOf` | 하위 클래스 (모든 Employee는 Person) |
| `rdfs:subPropertyOf` | 하위 속성 (`isCEOOf`이면 `worksAt`) |
| `rdfs:domain` | 이 속성의 주어가 속하는 클래스 |
| `rdfs:range` | 이 속성의 목적어가 속하는 클래스 |
| `rdfs:label`, `rdfs:comment` | 사람이 읽는 이름과 설명 |

### 4-3. OWL: 논리 규칙

OWL(Web Ontology Language)은 더 정교한 규칙을 표현합니다.

```turtle
@prefix ex:  <http://example.org/> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

# 역관계: A가 B를 인수했다 ⇔ B는 A에게 인수되었다
ex:acquired     a owl:ObjectProperty ;
                owl:inverseOf ex:acquiredBy .

# 전이 관계: A가 B의 자회사, B가 C의 자회사 → A는 C의 자회사
ex:subsidiaryOf a owl:TransitiveProperty .

# 서로소: 사람이면서 회사일 수 없다
ex:Person       owl:disjointWith ex:Organization .

# 카디널리티: 사람은 생년월일을 최대 1개 가진다
ex:birthDate    a owl:DatatypeProperty , owl:FunctionalProperty ;
                rdfs:range xsd:date .

# 동치 클래스: 직원이 한 명 이상 있는 조직 = Employer
ex:Employer     owl:equivalentClass [
    a owl:Restriction ;
    owl:onProperty ex:hasEmployee ;
    owl:someValuesFrom ex:Person
] .

# 같은 대상: 두 URI가 같은 회사
ex:naver        owl:sameAs <http://www.wikidata.org/entity/Q_NAVER> .   # 실제 Q ID로 교체
```

| OWL 구문 | 표현하는 것 |
|---|---|
| `owl:inverseOf` | 역관계 |
| `owl:TransitiveProperty` | 전이성 |
| `owl:SymmetricProperty` | 대칭성 (A 형제 B ⇒ B 형제 A) |
| `owl:FunctionalProperty` | 값이 최대 하나 |
| `owl:disjointWith` | 동시에 속할 수 없는 클래스 |
| `owl:equivalentClass` | 조건으로 정의되는 클래스 |
| `owl:sameAs` | 서로 다른 URI가 같은 대상 |

> `Q_NAVER`는 자리표시자입니다. 실제로 연결할 때는 Wikidata에서 해당 엔티티의 Q ID를 확인해 넣습니다.

## 5. SPARQL로 질의하기

SPARQL은 RDF 그래프용 질의 언어입니다. **트리플 패턴**에 변수(`?x`)를 넣어 맞는 것을 찾습니다.

### 5-1. 기본 질의

```sparql
PREFIX ex:   <http://example.org/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

# 네이버에서 일하는 사람의 이름
SELECT ?name WHERE {
  ?person ex:worksAt ex:naver ;
          ex:name    ?name .
}
```

### 5-2. 계층을 따라가는 질의 (Property Path)

```sparql
# Person의 모든 하위 클래스에 속한 인스턴스 (Employee, Manager, ...)
SELECT ?x ?cls WHERE {
  ?x   a ?cls .
  ?cls rdfs:subClassOf* ex:Person .       # * = 0번 이상 따라감
}
```

### 5-3. 집계와 필터

```sparql
# 직원이 2명 이상인 회사
SELECT ?company (COUNT(?p) AS ?cnt) WHERE {
  ?p ex:worksAt ?company .
  ?company a ex:Company .
}
GROUP BY ?company
HAVING (COUNT(?p) >= 2)
```

### 5-4. 파이썬에서 실행

```python
from rdflib import Graph

g = Graph()
g.parse("company.ttl", format="turtle")

q = """
PREFIX ex: <http://example.org/>
SELECT ?name WHERE { ?p ex:worksAt ex:naver ; ex:name ?name . }
"""
for row in g.query(q):
    print(row.name)
```

## 6. 추론기 (Reasoner): 적지 않은 사실을 도출한다

**추론기**는 온톨로지 규칙(TBox)과 사실(ABox)을 보고 명시적으로 저장하지 않은 사실을 논리적으로 끌어냅니다. HermiT, Pellet, ELK 같은 OWL 추론기와, RDFS/OWL 2 RL 수준 규칙을 적용하는 트리플 스토어 내장 추론이 있습니다.

### 6-1. 예시: 무엇이 새로 생기는가

```text
저장한 사실 (ABox)                       온톨로지 규칙 (TBox)
───────────────────                      ────────────────────────────────
김철수  a  Employee                      Employee subClassOf Person
김철수  worksAt  알파테크                 worksAt range Organization
알파테크  subsidiaryOf  베타랩스          subsidiaryOf 은 Transitive
베타랩스  subsidiaryOf  감마홀딩스        acquired inverseOf acquiredBy
베타랩스  acquired  알파테크
```

```text
추론기가 도출한 사실
───────────────────────────────────────────────────────────────
김철수     a  Person                 ← Employee ⊂ Person
알파테크   a  Organization           ← worksAt의 range
알파테크   subsidiaryOf  감마홀딩스   ← subsidiaryOf 전이성
알파테크   acquiredBy  베타랩스       ← acquired의 역관계
```

이제 "감마홀딩스 계열사에서 일하는 사람"을 물으면, 그런 사실을 직접 저장한 적이 없어도 김철수가 나옵니다.

### 6-2. 파이썬에서 해 보기

```python
from rdflib import Graph
import owlrl

g = Graph()
g.parse(data="""
@prefix ex: <http://example.org/> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
ex:subsidiaryOf a owl:TransitiveProperty .
ex:Employee rdfs:subClassOf ex:Person .
ex:kimcs a ex:Employee .
ex:alpha ex:subsidiaryOf ex:beta .
ex:beta  ex:subsidiaryOf ex:gamma .
""", format="turtle")

owlrl.DeductiveClosure(owlrl.OWLRL_Semantics).expand(g)   # 추론 결과를 g에 추가

from rdflib import URIRef
EX = "http://example.org/"
assert (URIRef(EX + "alpha"), URIRef(EX + "subsidiaryOf"), URIRef(EX + "gamma")) in g
```

### 6-3. 불일치 탐지

추론기는 새 사실뿐 아니라 **모순**도 찾습니다.

```text
Person disjointWith Organization
김철수 a Person
김철수 a Organization       ← 잘못된 추출
→ 추론기: 불일치(inconsistent) 보고
```

### 6-4. SHACL: 검증은 따로

OWL은 열린 세계 가정 때문에 "필수 값이 빠졌다"를 오류로 보지 않습니다. 데이터 품질 검증에는 W3C의 **SHACL(Shapes Constraint Language)**을 씁니다.

```turtle
@prefix sh:  <http://www.w3.org/ns/shacl#> .
@prefix ex:  <http://example.org/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

ex:PersonShape a sh:NodeShape ;
    sh:targetClass ex:Person ;
    sh:property [
        sh:path ex:name ;
        sh:minCount 1 ;          # 이름 필수
        sh:datatype xsd:string ;
    ] ;
    sh:property [
        sh:path ex:worksAt ;
        sh:class ex:Organization ;   # 목적어는 반드시 Organization (닫힌 세계식 검증)
    ] .
```

| 구분 | OWL | SHACL |
|---|---|---|
| 목적 | 의미 정의, 추론 | 데이터 검증 |
| 세계 가정 | 열린 세계 | 닫힌 세계식 검사 |
| 위반 시 | 새 사실 추론 또는 불일치 | 검증 보고서에 오류 |

## 7. 대표 온톨로지

### 7-1. schema.org

구글, 마이크로소프트, 야후, 얀덱스가 함께 만든 **웹 구조화 데이터용 어휘**입니다. 웹페이지에 JSON-LD로 넣으면 검색 엔진이 내용을 이해합니다.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "판교 국수집",
  "address": { "@type": "PostalAddress", "addressLocality": "성남시" },
  "servesCuisine": "Korean"
}
</script>
```

논리 제약은 엄밀하지 않고, 넓고 실용적인 어휘에 가깝습니다.

### 7-2. FIBO (Financial Industry Business Ontology)

EDM Council이 주도하는 **금융 산업 온톨로지**입니다. 법인, 계약, 증권, 대출, 파생상품 같은 금융 개념을 OWL로 정의합니다. 은행들이 시스템마다 다른 "거래상대방", "법인" 정의를 통일하는 데 씁니다.

### 7-3. SNOMED CT

**임상 의학 용어 체계**로, SNOMED International이 관리합니다. 질병, 시술, 신체 부위, 약물 등 매우 많은 개념과 그 사이의 관계(예: "~는 ~의 일종", "발생 부위")를 정의합니다. 논리 기반 정의를 가지고 있어 OWL 추론기(EL 계열)로 분류를 계산할 수 있습니다.

```text
바이러스성 폐렴
  ├─ is a ──────────> 폐렴
  ├─ is a ──────────> 바이러스 감염
  ├─ finding site ──> 폐 구조
  └─ causative agent ─> 바이러스
```

### 7-4. 비교

| 온톨로지 | 분야 | 관리 주체 | 특징 |
|---|---|---|---|
| schema.org | 웹 일반 | 검색 엔진 커뮤니티 | 넓고 가벼움, SEO |
| FIBO | 금융 | EDM Council | 규제·데이터 통합, OWL |
| SNOMED CT | 의료 | SNOMED International | 대규모 임상 용어, 논리 정의 |
| Gene Ontology | 생명과학 | GO Consortium | 유전자 기능 기술 |
| Dublin Core | 메타데이터 | DCMI | 문서 메타데이터(제목, 저자) |

## 8. DDD 도메인 모델과의 유사점

[DDD](/blog/ddd)를 해 봤다면 온톨로지가 낯설지 않을 것입니다. 둘 다 도메인의 개념과 규칙을 명시적으로 모델링합니다.

| DDD | 온톨로지 | 공통점 |
|---|---|---|
| 유비쿼터스 언어 | 클래스·속성의 이름과 정의 | 용어를 하나로 합의한다 |
| Entity, Value Object | Class, Datatype Property | 개념을 구분한다 |
| 불변식 (Invariant) | 제약 (Axiom, SHACL) | 지켜야 할 규칙을 둔다 |
| Bounded Context | 온톨로지 모듈 / 네임스페이스 | 같은 말이라도 맥락별로 다를 수 있다 |

| 차이 | DDD 도메인 모델 | 온톨로지 |
|---|---|---|
| 목적 | 소프트웨어 동작 구현 | 지식 공유, 데이터 통합, 추론 |
| 표현 | 코드 (클래스, 메서드) | 선언적 형식 (OWL, RDFS) |
| 행동 | 메서드로 규칙 실행 | 행동 없음, 논리 규칙만 |
| 범위 | 한 Bounded Context 안 | 조직·산업 전체 공유를 지향 |

DDD는 "맥락마다 모델을 나누자"고 하고, 산업 온톨로지는 "모두가 같은 정의를 쓰자"를 지향한다는 긴장도 있습니다. 실무에서는 핵심 공통 개념만 공유 온톨로지로 두고, 나머지는 맥락별로 확장하는 방식을 많이 씁니다.

## 9. 온톨로지 설계는 어떻게 시작하나

1. **역량 질문(Competency Questions)** 정하기: "이 온톨로지로 어떤 질문에 답해야 하는가?"
   - 예: "특정 회사의 최종 모회사는?", "이 약과 상호작용하는 약은?"
2. **기존 온톨로지 재사용**: schema.org, FIBO, SNOMED CT 등에서 가져올 수 있는지 먼저 봅니다.
3. **핵심 클래스와 관계 정의**: 역량 질문에 꼭 필요한 것만.
4. **제약 추가**: domain/range, 카디널리티, 서로소.
5. **인스턴스로 시험**: 샘플 데이터를 넣고 역량 질문이 SPARQL로 풀리는지 확인합니다.

도구로는 스탠퍼드의 **Protégé**가 널리 쓰입니다.

## 10. 언제 쓰지 않는가

- **한 애플리케이션 안에서만 쓰는 데이터**: 관계형 스키마나 코드 타입으로 충분합니다.
- **추론이 필요 없고 질의만 필요**: 프로퍼티 그래프 + 간단한 스키마 문서가 더 가볍습니다.
- **도메인 전문가가 없을 때**: 개념 정의를 합의할 사람이 없으면 온톨로지는 개발자의 추측이 됩니다.
- **빨리 바뀌는 탐색 단계**: 무엇을 모델링할지 모르는 초기에는 무거운 온톨로지가 발목을 잡습니다.

## 11. 장점과 단점

| 장점 | 설명 |
|---|---|
| 의미의 합의 | 조직·시스템 간 용어를 통일 |
| 추론 | 저장하지 않은 사실을 논리적으로 도출 |
| 일관성 검사 | 모순·이상 데이터 탐지 |
| 재사용과 통합 | 표준 온톨로지와 URI로 외부 데이터와 연결 |
| 설명 가능성 | 결론이 어떤 규칙에서 나왔는지 추적 가능 |

| 단점 | 설명 |
|---|---|
| 설계 비용 | 전문가 합의와 모델링에 시간이 많이 든다 |
| 학습 곡선 | RDF, OWL, SPARQL, 열린 세계 가정 |
| 추론 성능 | 표현력이 큰 OWL은 추론이 무거워질 수 있다 |
| 유지보수 | 도메인이 바뀌면 온톨로지와 데이터를 함께 고쳐야 한다 |
| 과설계 위험 | 쓰지 않을 개념까지 정의하기 쉽다 |

## 12. 핵심 정리

> 온톨로지는 한 분야의 개념(클래스), 속성, 관계, 제약을 기계가 읽을 수 있게 명시한 것이다. 지식 그래프와는 스키마(TBox)와 데이터(ABox)의 관계이며, 관계형 스키마와 달리 열린 세계 가정 위에서 의미를 정의하고 추론한다. RDF는 트리플을, RDFS는 클래스·속성 계층과 domain/range를, OWL은 역관계·전이성·서로소·카디널리티 같은 논리 규칙을 더한다. SPARQL로 질의하고, 추론기는 규칙을 적용해 저장하지 않은 사실과 모순을 찾아내며, 데이터 검증에는 SHACL을 쓴다. schema.org, FIBO, SNOMED CT가 대표 사례이고, 도메인 개념과 규칙을 합의해 명시한다는 점에서 DDD의 도메인 모델과 닮았다.
