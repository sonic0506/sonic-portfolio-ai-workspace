---
type: "blog"
id: "graph-rag"
title: "Graph RAG (Graph Retrieval-Augmented Generation, 그래프 RAG)"
summary: "Graph RAG는 RAG의 검색 대상에 지식 그래프를 넣은 방식입니다. 문서 조각(청크)을 임베딩 유사도로만 찾는 대신, 문서에서 엔티티와 관계를 뽑아 그래프로 만들고, 질문에 답할 때 그 그래프를 따라가거나 그래프를 요약한 정보를 근거로 씁니다."
created_at: "2026-10-03"
updated_at: "2026-10-03"
published: true
category: "AI·RAG"
tags: ["ai", "rag", "graph-rag"]
skills: []
related_projects: []
related_blogs: ["rag", "knowledge-graph", "ontology-rag"]
open_questions: []
---

## 1. Graph RAG란?

**Graph RAG**는 [RAG](/blog/rag)의 검색 대상에 **[지식 그래프](/blog/knowledge-graph)**를 넣은 방식입니다. 문서 조각(청크)을 임베딩 유사도로만 찾는 대신, 문서에서 엔티티와 관계를 뽑아 그래프로 만들고, 질문에 답할 때 그 그래프를 따라가거나 그래프를 요약한 정보를 근거로 씁니다.

```text
일반 벡터 RAG
  질문 ──> 임베딩 ──> 비슷한 청크 Top-k ──> LLM ──> 답

Graph RAG
  질문 ──> 관련 엔티티/커뮤니티 찾기 ──> 그래프 탐색·요약 수집 ──> LLM ──> 답
                    ▲
       (미리) 문서 ──> 엔티티·관계 추출 ──> 지식 그래프
```

"Graph RAG"는 특정 제품 이름이 아니라 **방법론의 묶음**입니다. 다만 2024년 Microsoft Research가 공개한 **GraphRAG**(붙여 쓰기) 논문과 오픈소스가 이 이름을 대중화했기 때문에, 이 노트도 Microsoft GraphRAG를 중심으로 설명하고 다른 변형을 뒤에서 다룹니다.

## 2. 벡터 RAG가 못 하는 질문

벡터 RAG는 "질문과 **비슷한 문단**"을 찾습니다. 답이 한두 문단 안에 있으면 잘 됩니다. 그런데 답이 여러 문서에 흩어진 연결이나 데이터 전체의 패턴에 있으면 제대로 찾지 못합니다.

### 2-1. 다중 홉 질문 (Multi-hop)

```text
문서 A: "박지훈은 알파테크의 CTO다."
문서 B: "알파테크는 2023년 베타랩스에 인수되었다."
문서 C: "베타랩스의 본사는 판교에 있다."

질문: "박지훈이 지금 다니는 회사의 모회사 본사는 어디인가?"
```

| 단계 | 벡터 RAG | Graph RAG |
|---|---|---|
| 검색 | "박지훈", "본사"와 비슷한 청크 → 문서 A, 운 좋으면 C | 박지훈 노드에서 출발 |
| 연결 | 문서 B는 질문과 단어가 거의 겹치지 않아 놓치기 쉽다 | 박지훈 → CTO_OF → 알파테크 → ACQUIRED_BY → 베타랩스 → HQ_IN → 판교 |
| 결과 | 추측하거나 "모른다" | 경로 자체가 근거 |

문서 B는 질문과 **의미가 비슷하지 않지만** 답에 꼭 필요합니다. 유사도 검색은 이런 "다리 역할 문서"를 잘 못 찾습니다.

### 2-2. 전역 질문 (Global / Sensemaking)

```text
질문: "이 회사 고객 상담 기록 10만 건에서 가장 큰 불만 주제는 무엇인가?"
질문: "이 데이터셋의 주요 주제는 무엇인가?"
```

벡터 RAG는 Top-k 청크(예: 10개)만 봅니다. 10만 건의 전체 경향을 10개 청크로 말할 수는 없습니다. 이런 질문은 데이터 전체를 요약하는 문제(query-focused summarization)에 가깝습니다. Microsoft GraphRAG 논문이 겨냥한 것도 이 유형입니다.

### 2-3. 정리

| 질문 유형 | 예 | 벡터 RAG | Graph RAG |
|---|---|---|---|
| 단일 사실 | "환불 기한은?" | 잘함 | 과함 |
| 다중 홉 | "A의 회사의 모회사는?" | 약함 | 강함 (local) |
| 전역 요약 | "전체 주요 주제는?" | 매우 약함 | 강함 (global) |
| 관계 나열 | "X와 거래한 회사 전부" | 누락 많음 | 강함 |

## 3. Microsoft GraphRAG 개요

논문 *From Local to Global: A Graph RAG Approach to Query-Focused Summarization*(Edge 외, 2024)의 핵심 아이디어는 두 단계입니다.

1. **인덱싱**: LLM으로 문서 전체에서 엔티티·관계를 뽑아 그래프를 만들고, 그래프를 **커뮤니티(밀접하게 연결된 묶음)**로 계층적으로 나눈 뒤, **커뮤니티마다 요약 보고서**를 미리 써 둔다.
2. **질의**: 질문 유형에 따라 엔티티 주변을 보거나(local), 커뮤니티 보고서 전체를 map-reduce로 훑는다(global).

"전체 주제가 뭐야?"라는 질문에 답하려면 데이터를 다 읽어야 합니다. GraphRAG는 그 "다 읽기"를 **인덱싱 시점에 미리** 해 두는 전략입니다.

## 4. 인덱싱 파이프라인

```text
 원본 문서
    │
    ▼
┌──────────────────────┐
│ 1. 텍스트 유닛 분할   │  문서를 일정 토큰 크기 청크로 나눈다
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ 2. 엔티티·관계 추출   │  청크마다 LLM 호출
│    (+ 선택: claim)    │  → (이름, 유형, 설명), (출발, 도착, 설명, 강도)
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ 3. 그래프 병합·요약   │  같은 이름의 엔티티를 합치고
│                      │  여러 청크에서 나온 설명을 LLM으로 한 문단 요약
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ 4. Leiden 커뮤니티    │  그래프를 계층적 클러스터로 분할
│    탐지 (계층적)      │  Level 0(큰 묶음) → Level 1 → Level 2(작은 묶음)
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ 5. 커뮤니티 보고서    │  커뮤니티마다 LLM이 보고서 작성
│    생성              │  (제목, 요약, 주요 발견, 중요도)
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ 6. 임베딩            │  엔티티 설명, 텍스트 유닛, 보고서를 임베딩
└──────────────────────┘
   결과물: 엔티티 / 관계 / 텍스트 유닛 / 커뮤니티 / 커뮤니티 보고서 테이블
```

### 4-1. 텍스트 유닛과 추출

텍스트 유닛은 일반 RAG의 청크와 같습니다. 차이는 각 유닛마다 **LLM을 호출해 구조를 뽑는다**는 점입니다.

```text
텍스트 유닛: "알파테크는 2023년 베타랩스에 인수되었다. 인수 후 박지훈 CTO는
             베타랩스 AI 조직을 함께 맡게 되었다."

추출 결과:
  엔티티  (알파테크, ORGANIZATION, "2023년 베타랩스에 인수된 회사")
          (베타랩스, ORGANIZATION, "알파테크를 인수한 회사")
          (박지훈,   PERSON,       "알파테크 CTO, 베타랩스 AI 조직 겸임")
  관계    (베타랩스 → 알파테크, "2023년 인수", 강도 9)
          (박지훈 → 베타랩스,   "AI 조직을 맡음", 강도 7)
```

추출 대상 엔티티 유형(조직, 사람, 지역, 이벤트 등)은 설정할 수 있지만, **어떤 관계를 뽑을지는 LLM이 자유롭게 서술**합니다. 이 점이 [온톨로지 기반 방식](/blog/ontology-rag)과 가장 큰 차이입니다.

### 4-2. 커뮤니티 탐지: Leiden

**커뮤니티**는 내부 연결은 촘촘하고 외부 연결은 느슨한 노드 묶음입니다. GraphRAG는 **Leiden 알고리즘**(Louvain을 개선한 커뮤니티 탐지 알고리즘)을 계층적으로 적용합니다.

```text
Level 0 (거친 단위)        Level 1 (세부 단위)
┌──────────────────┐       ┌────────┐ ┌────────┐
│ 인수합병 생태계   │  ──>  │ 베타랩스│ │ 알파테크│
│                  │       │ 계열    │ │ 인력    │
└──────────────────┘       └────────┘ └────────┘
┌──────────────────┐       ┌────────┐ ┌────────┐
│ 규제·소송        │  ──>  │ 공정위  │ │ 특허    │
└──────────────────┘       └────────┘ └────────┘
```

계층이 있기 때문에 질문의 범위에 맞춰 **거친 요약을 쓸지 세부 요약을 쓸지** 고를 수 있습니다.

### 4-3. 커뮤니티 보고서

커뮤니티마다 LLM이 소속 엔티티·관계·설명을 읽고 보고서를 씁니다.

```text
[커뮤니티 #12 보고서]
제목: 베타랩스의 AI 스타트업 인수 전략
요약: 베타랩스는 2022~2024년 알파테크 등 AI 스타트업을 연이어 인수했다 ...
주요 발견:
  - 인수 대상은 주로 컴퓨터 비전 분야 ...
  - 인수 후 핵심 인력이 베타랩스 AI 조직으로 재배치 ...
중요도: 8.5
```

이 보고서들이 "데이터셋 전체를 미리 읽고 정리해 둔 메모"가 됩니다.

## 5. 질의 방식: Local, Global, DRIFT

GraphRAG 쿼리 엔진은 Local Search, Global Search, DRIFT Search, Basic Search(일반 벡터 검색) 등을 제공합니다.

### 5-1. Local Search: 특정 엔티티 중심 질문

```text
질문: "박지훈은 어떤 일을 맡고 있나?"
   │
   ▼
① 질문 임베딩 ↔ 엔티티 설명 임베딩 → 시작 엔티티: [박지훈]
   │
   ▼
② 주변으로 펼치기
   ├─ 연결된 엔티티:  알파테크, 베타랩스
   ├─ 관계 설명:      "CTO", "AI 조직을 맡음"
   ├─ 원문 텍스트 유닛: 박지훈이 언급된 청크
   └─ 소속 커뮤니티 보고서: #12
   │
   ▼
③ 우선순위대로 컨텍스트 창에 채움 → LLM 답변
```

특정 대상에 대한 질문, 다중 홉 질문에 적합합니다. 구조(그래프)와 원문(텍스트 유닛)을 함께 넣습니다.

### 5-2. Global Search: 데이터 전체에 대한 질문

```text
질문: "이 데이터셋의 주요 주제는?"
   │
   ▼
선택한 레벨의 커뮤니티 보고서 전체 (예: 200개)
   │
   ├── Map ─────────────────────────────────────────┐
   │   보고서 묶음 1 ──> LLM ──> 부분 답 + 점수 85  │
   │   보고서 묶음 2 ──> LLM ──> 부분 답 + 점수 40  │  병렬
   │   ...                                          │
   │   보고서 묶음 N ──> LLM ──> 부분 답 + 점수 0   │
   └────────────────────────────────────────────────┘
   │
   ▼  Reduce
점수 높은 부분 답부터 컨텍스트 한도까지 모음 ──> LLM ──> 최종 답
```

논문은 이 방식이 약 100만 토큰 규모 데이터셋의 전역 질문에서 벡터 RAG 기준선보다 답의 **포괄성(comprehensiveness)과 다양성(diversity)**이 크게 낫다고 보고했습니다. 대신 질문 하나에 LLM 호출이 많아 비쌉니다.

### 5-3. DRIFT Search: Local을 넓게

**DRIFT**(Dynamic Reasoning and Inference with Flexible Traversal)는 Local Search에 **커뮤니티 정보**를 더한 방식입니다.

```text
질문
  │
  ▼
① Primer: 관련 커뮤니티 보고서로 넓은 첫 답 + 후속 질문 여러 개 생성
  │
  ▼
② Follow-up: 후속 질문마다 Local Search 실행 → 중간 답 + 새 후속 질문
  │            (정해진 깊이만큼 반복)
  ▼
③ 중간 답들을 모아 최종 답
```

출발점을 엔티티 하나가 아니라 커뮤니티 수준으로 넓혀서, Local보다 다양한 사실을 끌어오고 Global보다는 싸게 동작하는 것을 목표로 합니다.

### 5-4. 어떤 검색을 쓸까

| 질문 | 추천 | 이유 |
|---|---|---|
| "X는 무엇을 했나?" | Local | 특정 엔티티 주변이면 충분 |
| "X와 Y는 어떻게 연결되나?" | Local | 경로 탐색 |
| "X를 둘러싼 상황 전반은?" | DRIFT | 엔티티 + 맥락 확장 |
| "전체 데이터의 주요 주제는?" | Global | 커뮤니티 보고서 전체 필요 |
| "환불 기한은?" | Basic (벡터) | 그래프 불필요 |

## 6. 짧은 코드 예시

Microsoft GraphRAG는 CLI와 설정 파일로 동작합니다. 개념을 보여 주기 위해 핵심 흐름만 파이썬으로 줄여 쓰면 다음과 같습니다.

```python
import networkx as nx

EXTRACT = """다음 텍스트에서 엔티티(이름, 유형, 설명)와
관계(출발, 도착, 설명, 강도 1~10)를 JSON으로 뽑아라.
텍스트: {chunk}"""

def build_graph(chunks, llm) -> nx.Graph:
    g = nx.Graph()
    for chunk in chunks:                      # 청크마다 LLM 호출 → 비용의 주범
        out = llm.json(EXTRACT.format(chunk=chunk))
        for e in out["entities"]:
            g.add_node(e["name"].upper(), type=e["type"])
            g.nodes[e["name"].upper()].setdefault("desc", []).append(e["desc"])
        for r in out["relations"]:
            g.add_edge(r["src"].upper(), r["dst"].upper(),
                       desc=r["desc"], weight=r["strength"])
    return g

def communities(g):
    # 실제 GraphRAG는 계층적 Leiden. 여기선 networkx의 Louvain으로 대신한다.
    return nx.community.louvain_communities(g, weight="weight", seed=42)
```

```python
def global_search(question, reports, llm):
    partials = []
    for r in reports:                                         # map
        ans = llm.json(f"보고서: {r}\n질문: {question}\n"
                       "답과 도움 점수(0~100)를 JSON으로.")
        if ans["score"] > 0:
            partials.append(ans)
    partials.sort(key=lambda a: a["score"], reverse=True)
    context = "\n".join(a["answer"] for a in partials[:20])   # reduce
    return llm.text(f"부분 답들:\n{context}\n\n질문: {question}\n최종 답:")
```

이름을 `upper()`로 맞추는 정도의 단순한 병합은 "삼성전자"와 "Samsung Electronics"를 합치지 못합니다. 이 한계가 온톨로지 기반 접근(엔티티 해소, 스키마 강제)이 나오는 이유 중 하나입니다.

## 7. 비용 문제

GraphRAG의 가장 큰 현실적 장벽은 **인덱싱 비용**입니다.

```text
벡터 RAG 인덱싱                    GraphRAG 인덱싱
───────────────                    ─────────────────────────────
청크 N개 × 임베딩 호출              청크 N개 × LLM 추출 호출
(임베딩은 싸다)                    + 엔티티/관계 설명 요약 LLM 호출
                                   + 커뮤니티 수 × 보고서 LLM 호출
                                   + 임베딩
```

| 비용 요인 | 설명 |
|---|---|
| 추출 호출 수 | 청크마다 생성형 LLM 호출 (임베딩보다 훨씬 비쌈) |
| 재추출(gleaning) | 놓친 엔티티를 더 뽑기 위해 같은 청크를 다시 묻는 설정 |
| 보고서 생성 | 계층 레벨마다 커뮤니티 수만큼 호출 |
| 재인덱싱 | 문서가 바뀌면 커뮤니티 구조가 바뀌어 다시 요약해야 함 |
| Global 질의 | 질문마다 보고서 수에 비례한 map 호출 |

줄이는 방법은 다음과 같습니다.

- 추출에는 **작고 싼 모델**, 최종 답변에만 큰 모델을 씁니다.
- 청크 크기를 키워 호출 수를 줄입니다(대신 추출 누락이 늘 수 있습니다).
- 전역 질문이 없다면 커뮤니티 보고서 단계 자체를 생략하는 변형을 고려합니다.
- Microsoft Research는 2024년 말 **LazyGraphRAG**를 발표했습니다. 인덱싱에서 LLM 요약을 하지 않고 가벼운 NLP로 개념 그래프만 만든 뒤 LLM 작업을 질의 시점으로 미룹니다. 공식 블로그는 인덱싱 비용이 벡터 RAG와 같은 수준이고 full GraphRAG의 0.1% 수준이라고 소개했습니다.

## 8. 변형들

### 8-1. LightRAG: 가볍게, 증분 업데이트

**LightRAG**(Guo 외, 2024, EMNLP 2025 Findings)는 GraphRAG의 무거운 커뮤니티 단계를 빼고 **그래프 + 벡터**를 결합한 방식입니다.

```text
인덱싱: 청크 → LLM으로 엔티티·관계 추출 → 그래프
        + 엔티티·관계마다 키-값(키워드 → 설명) 프로파일 생성 → 벡터 색인

질의:   질문 → LLM으로 키워드 두 종류 추출
          ├─ 저수준 키워드 (구체적 엔티티: "박지훈", "알파테크")
          │     → 엔티티 노드와 그 이웃 검색        ← Low-level retrieval
          └─ 고수준 키워드 (주제: "AI 인수 전략")
                → 관계/주제 단위 검색              ← High-level retrieval
        → 둘을 합쳐 컨텍스트 구성 → LLM 답변
```

| 특징 | 설명 |
|---|---|
| 이중 레벨 검색 | 구체적 엔티티(저수준)와 넓은 주제(고수준)를 함께 검색 |
| 증분 업데이트 | 새 문서는 추출 결과를 기존 그래프에 **합치기만** 하면 된다. 커뮤니티 전체를 다시 계산하지 않는다 |
| 비용 | 커뮤니티 보고서가 없어 인덱싱·질의 부담이 GraphRAG보다 가볍다 |

자주 바뀌는 문서 집합에 그래프 RAG를 쓰고 싶을 때 먼저 검토할 만합니다.

### 8-2. HippoRAG: Personalized PageRank

**HippoRAG**(Gutiérrez 외, NeurIPS 2024)는 사람 기억의 **해마 색인 이론**에서 착안했습니다. LLM이 코퍼스를 **스키마 없는 지식 그래프**로 바꾸고, 질문이 오면 그래프 위에서 **Personalized PageRank(PPR)**를 돌립니다.

```text
질문: "스탠퍼드 교수 중 알츠하이머를 연구하는 사람은?"
  │
  ▼
① 질문에서 핵심 개념 추출 → [스탠퍼드], [알츠하이머]
② 그래프에서 해당 노드를 시드(seed)로 PPR 실행
     시드에서 출발해 무작위로 걷다가 일정 확률로 시드로 돌아옴
     → 두 시드 모두에서 가까운 노드의 점수가 높아짐
③ 노드 점수를 그 노드가 나온 문단 점수로 바꿔 Top-k 문단 반환
```

HippoRAG는 검색을 여러 번 반복하는(iterative) 대신 그래프 확산 한 번으로 다중 홉 연결을 찾습니다. 논문은 다중 홉 QA에서 기존 방법보다 좋은 성능과, IRCoT 같은 반복 검색 대비 더 낮은 비용·지연을 보고했습니다. 후속작 HippoRAG 2도 있습니다.

### 8-3. 벡터 + 그래프 하이브리드

실무에서 가장 흔한 형태는 벡터 검색으로 진입점을 찾고 그래프로 확장하는 것입니다.

```text
질문
 │
 ├─ ① 벡터 검색: 질문과 비슷한 청크 Top-k
 │
 ├─ ② 그 청크에 등장하는 엔티티 노드를 찾음 (청크 ─MENTIONS→ 엔티티)
 │
 ├─ ③ 그래프에서 1~2홉 확장: 관련 엔티티, 관계, 그 엔티티가 나온 다른 청크
 │
 └─ ④ 원래 청크 + 확장된 사실 → LLM
```

Neo4j는 청크 노드와 엔티티 노드를 같은 그래프에 두고 벡터 인덱스를 함께 쓰는 구성을 지원합니다.

```cypher
// ① 벡터 인덱스로 비슷한 청크 찾기 → ③ 언급된 엔티티의 이웃까지 확장
CALL db.index.vector.queryNodes('chunk_embedding', 5, $questionEmbedding)
YIELD node AS chunk, score
MATCH (chunk)-[:MENTIONS]->(e:Entity)-[r]-(neighbor:Entity)
RETURN chunk.text, e.name, type(r), neighbor.name, score
ORDER BY score DESC
LIMIT 50;
```

### 8-4. 변형 비교

| 구분 | MS GraphRAG | LightRAG | HippoRAG | 벡터+그래프 하이브리드 |
|---|---|---|---|---|
| 그래프 구축 | LLM 자유 추출 | LLM 추출 | LLM OpenIE (스키마 없음) | 다양 |
| 핵심 장치 | Leiden 커뮤니티 + 보고서 | 이중 레벨 키워드 검색 | Personalized PageRank | 벡터 진입 + 홉 확장 |
| 강한 질문 | 전역 요약, 다중 홉 | 구체+주제 혼합 | 다중 홉 | 일반 + 약간의 연결 |
| 인덱싱 비용 | 높음 | 중간 | 중간 | 중간 |
| 증분 업데이트 | 어려움 | 쉬움 | 비교적 쉬움 | 쉬움 |

## 9. 언제 쓰지 않는가

- **단일 사실 질문이 대부분**: FAQ, 정책 문서 Q&A는 벡터 RAG + 하이브리드 검색 + 리랭킹이 더 싸고 충분합니다.
- **문서가 자주 바뀜 + 전역 질문 필요**: 커뮤니티 보고서를 계속 다시 만들어야 해서 비용이 폭증합니다.
- **엔티티가 적은 문서**: 에세이, 감상문처럼 사람·조직·관계가 별로 없는 텍스트는 그래프가 빈약합니다.
- **평가 체계가 없을 때**: 그래프를 넣어 실제로 나아졌는지 측정하지 않으면 비용만 늘어납니다.
- **정확한 관계가 생명인 도메인**: 자유 추출 그래프는 관계 이름이 들쭉날쭉합니다. 금융·의료처럼 스키마가 중요한 곳은 온톨로지 기반 접근이 더 맞습니다.

## 10. 장점과 단점

| 장점 | 설명 |
|---|---|
| 다중 홉 | 흩어진 사실을 경로로 연결 |
| 전역 질문 | 커뮤니티 보고서로 데이터 전체 요약에 답함 |
| 설명 가능성 | 어떤 엔티티·관계·보고서를 썼는지 보여 줄 수 있다 |
| 탐색 도구 | 만들어진 그래프 자체가 데이터 이해에 도움 |

| 단점 | 설명 |
|---|---|
| 인덱싱 비용 | 청크마다, 커뮤니티마다 LLM 호출 |
| 갱신 어려움 | 문서 추가 시 커뮤니티 재계산 (GraphRAG 기준) |
| 추출 품질 | 엔티티 중복, 잘못된 관계, 관계 이름 난립 |
| 복잡도 | 파이프라인, 저장소, 튜닝 포인트가 많다 |
| 효과 편차 | 질문 유형에 따라 벡터 RAG보다 나을 수도, 못할 수도 있다 |

## 11. 참고 자료

- From Local to Global: A Graph RAG Approach to Query-Focused Summarization (Edge 외, 2024) - https://arxiv.org/abs/2404.16130
- Microsoft GraphRAG 문서: Query Engine - https://microsoft.github.io/graphrag/query/overview/
- Introducing DRIFT Search (Microsoft Research Blog) - https://www.microsoft.com/en-us/research/blog/introducing-drift-search-combining-global-and-local-search-methods-to-improve-quality-and-efficiency/
- LazyGraphRAG: Setting a new standard for quality and cost (Microsoft Research Blog) - https://www.microsoft.com/en-us/research/blog/lazygraphrag-setting-a-new-standard-for-quality-and-cost/
- LightRAG: Simple and Fast Retrieval-Augmented Generation (Guo 외) - https://arxiv.org/abs/2410.05779
- HippoRAG: Neurobiologically Inspired Long-Term Memory for Large Language Models (Gutiérrez 외) - https://arxiv.org/abs/2405.14831
- Neo4j GraphRAG Python Package - https://neo4j.com/docs/neo4j-graphrag-python/current/

기준일: 2026-10-03

## 12. 핵심 정리

> Graph RAG는 문서에서 엔티티와 관계를 뽑아 지식 그래프를 만들고, 그 그래프를 검색 근거로 쓰는 RAG다. 벡터 RAG가 놓치는 다중 홉 질문과 "전체 주제는?" 같은 전역 질문을 겨냥한다. Microsoft GraphRAG는 텍스트 유닛 → LLM 엔티티·관계 추출 → 그래프 → 계층적 Leiden 커뮤니티 → 커뮤니티 보고서 순으로 인덱싱하고, 질의는 엔티티 중심 Local, 보고서 map-reduce인 Global, 커뮤니티로 출발점을 넓힌 DRIFT로 나눈다. 대가는 청크·커뮤니티마다 LLM을 부르는 큰 인덱싱 비용과 어려운 갱신이다. LightRAG(이중 레벨 검색, 증분 업데이트), HippoRAG(Personalized PageRank), 벡터+그래프 하이브리드가 이를 가볍게 하거나 다른 방식으로 푼다. 단일 사실 질문이 대부분이면 벡터 RAG로 충분하다.
