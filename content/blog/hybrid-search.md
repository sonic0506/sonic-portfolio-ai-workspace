---
type: "blog"
id: "hybrid-search"
title: "하이브리드 검색 (Hybrid Search)"
summary: "하이브리드 검색(Hybrid Search)은 의미 기반의 벡터 검색(dense retrieval)과 단어 기반의 키워드 검색(sparse retrieval, 주로 BM25)을 함께 실행하고, 두 결과를 하나의 순위로 합치는 검색 방식입니다."
created_at: "2026-10-03"
updated_at: "2026-10-03"
published: true
category: "AI·RAG"
tags: ["ai", "rag", "search"]
skills: []
related_projects: []
related_blogs: ["bm25", "vector-database", "reranking"]
open_questions: []
---

## 1. 하이브리드 검색이란?

**하이브리드 검색(Hybrid Search)**은 의미 기반의 [벡터 검색](/blog/vector-database)(dense retrieval)과 단어 기반의 키워드 검색(sparse retrieval, 주로 [BM25](/blog/bm25))을 함께 실행하고, 두 결과를 하나의 순위로 합치는 검색 방식입니다.

```text
                     ┌──────────────────────┐
              ┌────> │ Dense (벡터 검색)     │ ──> 순위 A ──┐
              │      │ "의미가 비슷한가?"     │              │
 질문 ────────┤      └──────────────────────┘              ▼
              │      ┌──────────────────────┐         ┌──────────┐
              └────> │ Sparse (BM25)        │ ──> 순위 B ─>  │  결합     │ ──> 최종 순위
                     │ "같은 단어가 있는가?"  │         │ RRF 등    │
                     └──────────────────────┘         └──────────┘
```

사람을 찾는 일에 비유하면 이렇습니다.

| 구분 | 비유 | 잘하는 것 | 못하는 것 |
|---|---|---|---|
| Dense | "키 크고 안경 쓴 개발자 같은 사람"을 찾는 몽타주 | 표현이 달라도 비슷한 대상을 찾는다 | 정확한 이름, 사번으로 찾기 |
| Sparse | 출입 명부에서 "홍길동"을 글자로 찾기 | 정확한 이름, 번호, 코드 | "길동이" "홍 대리"처럼 표현이 다르면 못 찾는다 |
| Hybrid | 둘 다 해서 양쪽에 걸린 사람을 우선 | 양쪽 장점 | 시스템이 조금 복잡해진다 |

RAG에서는 Naive RAG 다음에 가장 먼저 시도해 볼 만한 개선으로 하이브리드 검색이 자주 꼽힙니다. 구현이 비교적 쉽고, 벡터 검색만으로는 놓치는 질문을 상당 부분 건져 냅니다.

## 2. 왜 필요할까? 각자 실패하는 예

### 2-1. Dense가 실패하고 Sparse가 성공하는 경우

임베딩은 텍스트를 의미의 요약으로 압축하는데, 그 과정에서 정확한 문자열은 흐려집니다.

| 질문 | Dense 결과 | 이유 |
|---|---|---|
| "ERR-4031 원인" | "에러 발생 시 로그를 확인하세요" | `ERR-4031`과 `ERR-4032`는 임베딩상 거의 같다 |
| "`refresh_token_ttl` 설정" | 일반적인 토큰 설명 문서 | 코드 식별자는 의미 공간에서 구분이 약하다 |
| "KB-2291 티켓" | 다른 티켓들 | 번호는 의미가 없다 |
| "Kubernetes 1.29 변경사항" | 1.28, 1.30 문서 | 버전 숫자 차이가 벡터에 거의 반영되지 않는다 |
| 사내 약어 "TPS 리포트" | 무관한 문서 | 임베딩 모델이 학습 때 본 적 없는 용어 |

```text
질문: "ERR-4031은 왜 나요?"

Dense top-3                              BM25 top-3
1. "에러가 발생하면 로그를..."  0.81      1. "ERR-4031: 결제 토큰 만료..."  14.2  ← 정답
2. "ERR-4032: 재고 부족..."     0.80      2. "ERR-4031 대응 런북..."        11.8
3. "결제 실패 시 재시도..."     0.79      3. "에러 코드 목록 ERR-4001~..."   6.3
```

### 2-2. Sparse가 실패하고 Dense가 성공하는 경우

BM25는 같은 단어(토큰)가 있어야 점수가 생깁니다.

| 질문 | 문서 표현 | BM25 결과 |
|---|---|---|
| "연차 며칠이야?" | "유급휴가는 연 15일..." | 겹치는 단어가 없어 0점 |
| "로그인이 안 돼요" | "인증 실패 시 조치 방법" | 못 찾음 |
| "How do I reset my password?" | "비밀번호 재설정 절차" | 언어가 달라 못 찾음 (다국어 임베딩은 찾는다) |
| "돈 돌려받는 방법" | "환불 정책" | 못 찾음 |

### 2-3. 정리

| | Dense (벡터) | Sparse (BM25) |
|---|---|---|
| 기준 | 의미 유사도 | 단어 일치 + 희귀도(IDF) |
| 강점 | 동의어, 바꿔 말하기, 다국어, 긴 서술형 질문 | 고유명사, 코드, 숫자, 에러 코드, 약어 |
| 약점 | 정확한 문자열, 처음 보는 용어 | 어휘 불일치 |
| 학습 필요 | 임베딩 모델 필요 | 없음 (통계만) |
| 설명 가능성 | 낮다 ("왜 이게 나왔지?") | 높다 (어떤 단어가 일치했는지 보인다) |

두 방식은 실패하는 지점이 서로 다르기 때문에, 합치면 한쪽이 놓친 것을 다른 쪽이 건져 냅니다.

## 3. 결합 방식

두 검색의 결과 목록을 하나로 합쳐야 합니다. 그런데 두 점수는 단위가 다릅니다.

```text
Dense 점수: 코사인 유사도      0.70 ~ 0.85 정도에 몰려 있다
BM25 점수:  상한이 없는 값     0 ~ 20 이상, 질문마다 범위가 다르다

→ 그냥 더하면 BM25가 결과를 지배한다
```

해결 방법은 크게 두 가지로, 순위만 쓰는 방법(RRF)과 점수를 정규화해서 더하는 방법(가중합)이 있습니다.

### 3-1. RRF (Reciprocal Rank Fusion)

2009년 Cormack, Clarke, Büttcher가 SIGIR에서 발표한 방법입니다. 점수는 버리고 순위만 사용합니다.

```text
RRF(d) = Σ  1 / (k + rank_r(d))
        r∈R

  R         : 결합할 검색 결과 목록들 (예: Dense, BM25)
  rank_r(d) : 목록 r에서 문서 d의 순위 (1부터 시작)
  k         : 상수. 원 논문에서 60을 사용했고, 지금도 흔한 기본값이다
  목록에 없는 문서는 그 목록에서 0점
```

k가 크면 1위와 10위의 점수 차가 작아져 여러 목록에 고르게 등장한 문서가 유리해집니다. k가 작으면 한 목록의 최상위가 더 큰 영향을 줍니다.

#### 예시 계산 (k = 60)

```text
Dense 순위:  1. A   2. B   3. C   4. D
BM25 순위:   1. C   2. A   3. E   4. B
```

| 문서 | Dense 순위 | BM25 순위 | 계산 | RRF 점수 | 최종 |
|---|---|---|---|---|---|
| A | 1 | 2 | 1/61 + 1/62 = 0.016393 + 0.016129 | **0.032522** | 1위 |
| C | 3 | 1 | 1/63 + 1/61 = 0.015873 + 0.016393 | **0.032266** | 2위 |
| B | 2 | 4 | 1/62 + 1/64 = 0.016129 + 0.015625 | **0.031754** | 3위 |
| E | - | 3 | 0 + 1/63 | **0.015873** | 4위 |
| D | 4 | - | 1/64 + 0 | **0.015625** | 5위 |

양쪽 모두에 등장한 A, C, B가 한쪽에만 있는 E, D보다 확실히 위로 올라갑니다. 이것이 RRF의 핵심 성질입니다.

| 장점 | 단점 |
|---|---|
| 점수 정규화가 필요 없다 | 점수 차이 정보를 버린다 (1위가 압도적이어도 순위 1일 뿐) |
| 튜닝할 값이 k 하나뿐이고, 기본값으로도 잘 동작한다 | 한쪽 검색 결과가 전부 쓰레기여도 그대로 반영된다 |
| 검색기를 3개 이상으로 늘리기 쉽다 | |

### 3-2. 가중합 (정규화 후 선형 결합)

각 점수를 같은 범위(보통 0~1)로 정규화한 뒤 가중치를 곱해 더합니다.

```text
hybrid(d) = α · norm(dense(d)) + (1 − α) · norm(bm25(d))

  α = 1.0  → 벡터 검색만
  α = 0.0  → BM25만
  α = 0.5  → 반반

Min-Max 정규화: norm(x) = (x − min) / (max − min)    (해당 질의의 결과 목록 안에서)
```

#### 예시 계산 (α = 0.5)

```text
Dense 점수: A 0.82  B 0.80  C 0.78  D 0.70
BM25 점수:  C 12.4  A 9.1   E 7.0   B 3.2
```

| 문서 | Dense 정규화 | BM25 정규화 | 0.5·D + 0.5·B | 최종 |
|---|---|---|---|---|
| C | (0.78−0.70)/0.12 = 0.667 | 1.000 | **0.833** | 1위 |
| A | 1.000 | (9.1−3.2)/9.2 = 0.641 | **0.821** | 2위 |
| B | 0.833 | 0.000 | **0.417** | 3위 |
| E | (목록에 없음) 0 | 0.413 | **0.207** | 4위 |
| D | 0.000 | (목록에 없음) 0 | **0.000** | 5위 |

점수의 크기 차이가 반영되기 때문에, RRF와 달리 BM25에서 압도적으로 높았던 C가 1위로 올라왔습니다.

#### 정규화의 함정

| 함정 | 설명 |
|---|---|
| 최솟값이 0이 된다 | Min-Max에서 목록의 꼴찌는 항상 0이 된다. 위 표의 B는 BM25 점수가 있는데도 0점 처리됐다 |
| 이상치에 민감 | 한 문서만 점수가 튀면 나머지가 모두 0 근처로 눌린다 |
| 질의마다 분포가 다르다 | 같은 α라도 질의에 따라 실제 반영 비율이 달라진다 |
| α 튜닝이 필요 | 평가 세트 없이 고른 α는 근거가 없다 |

Min-Max 대신 Z-score 정규화나, 각 점수 분포의 평균±3표준편차를 범위로 쓰는 DBSF(Distribution-Based Score Fusion) 같은 변형도 있습니다.

### 3-3. 무엇을 쓸까?

| 상황 | 추천 |
|---|---|
| 처음 도입, 평가 세트가 없다 | **RRF (k=60)**. 튜닝 없이 안정적이다 |
| 평가 세트가 있고 질문 유형이 한쪽에 치우쳐 있다 | 가중합으로 α를 튜닝해 본다 |
| 코드·에러 검색이 대부분 | BM25 쪽 가중치를 높인다 |
| 서술형·다국어 질문이 대부분 | Dense 쪽 가중치를 높인다 |
| 결합 결과 순서가 여전히 부정확 | 결합 뒤에 리랭커를 붙인다 |

```text
실무에서 흔한 구성:

Dense top-50 ─┐
              ├─ RRF ─> top-50 ─> Cross-encoder 리랭킹 ─> top-5 ─> LLM
BM25  top-50 ─┘

하이브리드는 "후보를 넓게, 놓치지 않게" (recall)
리랭킹은 "후보 중 진짜를 위로" (precision)
```

## 4. 구현 예시

### 4-1. 직접 구현 (rank_bm25 + sentence-transformers)

```python
import numpy as np
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer

chunks = [
    "ERR-4031: 결제 토큰 만료. 토큰 TTL은 30분이며 refresh_token으로 갱신한다.",
    "ERR-4032: 재고 부족. 주문 수량이 재고보다 많을 때 발생한다.",
    "에러가 발생하면 먼저 애플리케이션 로그를 확인하세요.",
    "유급휴가는 입사 1년 후 연 15일이 부여된다.",
]

# --- Sparse ---
def tokenize(text: str) -> list[str]:
    # 단순 공백 분할. 한국어는 형태소 분석기(예: kiwipiepy)로 바꿔야 조사가 분리된다
    return text.lower().split()

bm25 = BM25Okapi([tokenize(c) for c in chunks])

# --- Dense ---
model = SentenceTransformer("BAAI/bge-m3")
vecs = model.encode(chunks, normalize_embeddings=True)

def dense_rank(q: str, n: int) -> list[int]:
    qv = model.encode([q], normalize_embeddings=True)[0]
    return list(np.argsort(-(vecs @ qv))[:n])

def sparse_rank(q: str, n: int) -> list[int]:
    return list(np.argsort(-bm25.get_scores(tokenize(q)))[:n])

# --- RRF ---
def rrf(rankings: list[list[int]], k: int = 60) -> list[tuple[int, float]]:
    scores: dict[int, float] = {}
    for ranking in rankings:
        for rank, doc_id in enumerate(ranking, start=1):
            scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank)
    return sorted(scores.items(), key=lambda x: -x[1])

def hybrid_search(q: str, top_k: int = 3, n: int = 20):
    fused = rrf([dense_rank(q, n), sparse_rank(q, n)])
    return [(chunks[i], round(s, 4)) for i, s in fused[:top_k]]

print(hybrid_search("ERR-4031 원인"))
```

RRF 함수가 맞게 동작하는지 3-1의 예시로 확인할 수 있습니다.

```python
A, B, C, D, E = range(5)
result = [doc for doc, _ in rrf([[A, B, C, D], [C, A, E, B]])]
assert result == [A, C, B, E, D]
```

### 4-2. pgvector + PostgreSQL 전문 검색

pgvector 자체에는 하이브리드 기능이 없어서, PostgreSQL 전문 검색(`tsvector`)과 pgvector를 각각 질의한 뒤 SQL에서 RRF로 합칩니다.

```sql
WITH dense AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY embedding <=> :query_vec) AS rnk
  FROM chunks
  ORDER BY embedding <=> :query_vec
  LIMIT 50
),
sparse AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY ts_rank_cd(tsv, q) DESC) AS rnk
  FROM chunks, plainto_tsquery('simple', :query_text) q
  WHERE tsv @@ q
  ORDER BY ts_rank_cd(tsv, q) DESC
  LIMIT 50
)
SELECT c.id, c.content,
       COALESCE(1.0 / (60 + d.rnk), 0) + COALESCE(1.0 / (60 + s.rnk), 0) AS rrf_score
FROM dense d
FULL OUTER JOIN sparse s ON d.id = s.id
JOIN chunks c ON c.id = COALESCE(d.id, s.id)
ORDER BY rrf_score DESC
LIMIT 10;
```

| 주의 | 설명 |
|---|---|
| `ts_rank`는 BM25가 아니다 | PostgreSQL 기본 전문 검색 순위 함수는 BM25와 계산식이 다르다. BM25가 꼭 필요하면 ParadeDB의 `pg_search` 같은 확장을 검토한다 |
| 한국어 형태소 분석 | PostgreSQL 기본 설정에는 한국어 사전이 없다. `simple` 설정은 공백 분할만 하므로 조사가 붙은 단어가 따로 색인된다 |

### 4-3. Qdrant (Query API의 prefetch + fusion)

Qdrant는 한 컬렉션에 dense 벡터와 sparse 벡터를 함께 저장하고, 서버에서 결합할 수 있습니다.

```python
from qdrant_client import QdrantClient, models

client = QdrantClient("localhost", port=6333)

results = client.query_points(
    collection_name="docs",
    prefetch=[
        models.Prefetch(query=dense_vec, using="dense", limit=50),
        models.Prefetch(
            query=models.SparseVector(indices=sparse_idx, values=sparse_val),
            using="sparse",
            limit=50,
        ),
    ],
    query=models.FusionQuery(fusion=models.Fusion.RRF),
    limit=10,
)
```

## 5. 주요 저장소의 지원 현황

| 저장소 | Sparse 쪽 | 결합 방식 | 비고 |
|---|---|---|---|
| **Elasticsearch** | BM25 (기본 기능) | `rrf` retriever, 또는 `knn` + `match`를 한 쿼리에 넣어 점수 합산 | 원래 키워드 검색 엔진이라 BM25가 강하다 |
| **OpenSearch** | BM25 | `hybrid` 쿼리 + search pipeline의 정규화 프로세서(min-max/L2 정규화 후 가중 평균), RRF 프로세서 | 정규화·가중치를 파이프라인 설정으로 지정 |
| **Qdrant** | 저장된 sparse 벡터 (BM25 계열 또는 SPLADE 등) | Query API `prefetch` + `Fusion.RRF` / `Fusion.DBSF` | 벡터 DB에서 sparse를 1급으로 지원 |
| **Weaviate** | 내장 BM25 | `hybrid` 쿼리, `alpha`로 가중치, ranked / relative score 결합 | `alpha`=1이면 순수 벡터 검색 |
| **Milvus** | sparse 벡터 필드, 전문 검색 기능 | `hybrid_search` + `RRFRanker` / `WeightedRanker` | 여러 벡터 필드를 한 번에 결합 |
| **pgvector** | PostgreSQL 전문 검색 (`tsvector`) | 내장 없음. SQL로 직접 RRF | 기존 PostgreSQL에 붙이기 쉽다 |

> 세부 문법과 지원 여부는 버전에 따라 자주 바뀝니다. 실제 도입 시 사용하는 버전의 공식 문서를 확인해야 합니다.

### 5-1. 선택 기준

| 상황 | 추천 |
|---|---|
| 이미 PostgreSQL을 쓰고 데이터가 많지 않다 | pgvector + 전문 검색 + SQL RRF |
| 이미 Elasticsearch/OpenSearch로 검색을 운영 중이다 | 기존 클러스터에 벡터 필드를 추가 |
| 벡터 검색이 주력이고 sparse도 함께 관리하고 싶다 | Qdrant, Weaviate, Milvus |
| 한국어 키워드 검색 품질이 중요하다 | 한국어 형태소 분석기(예: Elasticsearch의 nori)를 쓸 수 있는 쪽 |

## 6. 학습형 희소 벡터 (Learned Sparse)

BM25는 문서에 실제로 등장한 단어에만 점수를 줍니다. 학습형 희소 벡터는 언어 모델로 단어의 중요도를 학습하고, 문서에 없는 관련 단어까지 확장해서 희소 벡터를 만듭니다.

### 6-1. SPLADE

2021년 Formal 등이 제안한 **SPLADE(SParse Lexical AnD Expansion model)**가 대표적입니다. BERT 계열의 MLM(Masked Language Model) 헤드를 이용해 어휘 사전 전체에 대한 가중치를 예측하고, 규제(regularization)로 대부분을 0으로 만들어 희소 벡터를 얻습니다.

```text
문서: "유급휴가는 연 15일이 부여된다"

BM25 색인:   {유급휴가: w1, 연: w2, 15일: w3, 부여: w4}

SPLADE 벡터: {유급휴가: 2.1, 휴가: 1.8, 연차: 1.2, 15일: 1.5, 부여: 0.9, ...}
                                    ↑ 문서에 없는 단어도 확장되어 들어간다

질문 "연차 며칠?" → BM25는 0점, SPLADE는 "연차" 차원에서 매칭
```

| | BM25 | 학습형 희소 (SPLADE 등) | Dense |
|---|---|---|---|
| 벡터 형태 | 희소 (등장 단어만) | 희소 (확장 단어 포함) | 밀집 (수백~수천 차원) |
| 어휘 불일치 | 약하다 | 확장으로 일부 해결 | 강하다 |
| 정확한 용어 매칭 | 강하다 | 강하다 | 약하다 |
| 역색인 사용 | 가능 | 가능 | 불가 (ANN 인덱스 필요) |
| 학습 필요 | 없음 | 모델 필요, 도메인·언어 영향을 받는다 | 모델 필요 |
| 해석 가능성 | 높다 | 높다 (단어별 가중치가 보인다) | 낮다 |

### 6-2. 그 밖의 예

- **BGE-M3**: 하나의 모델이 dense, sparse(단어 가중치), multi-vector 표현을 함께 출력한다. 하나의 모델로 하이브리드 검색을 구성할 수 있다.
- **Elastic ELSER**: Elasticsearch에서 제공하는 학습형 희소 검색 모델.

학습형 희소 벡터를 쓰더라도 dense와 결합하는 하이브리드 구성이 흔하며, 결합 방식은 3장과 같습니다.

## 7. 장점과 단점

| 장점 | 설명 |
|---|---|
| 검색 실패가 줄어든다 | 고유명사·코드 질문과 바꿔 말하기 질문을 모두 커버한다 |
| 구현 비용 대비 효과가 크다 | RRF는 수십 줄이면 되고 튜닝이 거의 필요 없다 |
| 설명 가능성이 오른다 | BM25 쪽 결과로 "어떤 단어가 일치했는지" 보여줄 수 있다 |
| 모델 의존도를 낮춘다 | 임베딩 모델이 모르는 신조어·사내 용어를 BM25가 보완한다 |

| 단점 | 설명 |
|---|---|
| 인덱스가 두 벌 | 벡터 인덱스와 역색인을 함께 유지·동기화해야 한다 |
| 지연 시간 | 검색을 두 번 한다 (병렬로 돌리면 대부분 상쇄된다) |
| 언어 처리 | 한국어 BM25는 형태소 분석기 설정이 품질을 좌우한다 |
| 튜닝 포인트 증가 | 가중합을 쓰면 α, 정규화 방식을 정해야 한다 |
| 순서 정확도의 한계 | 결합만으로는 상위 몇 개의 순서가 여전히 부정확할 수 있다 → 리랭킹 |

### 7-1. 하이브리드가 별 도움이 안 되는 경우

- 질문이 거의 서술형·대화형이고 고유명사·코드가 드물다 → Dense만으로 충분할 수 있다.
- 질문이 거의 정확한 코드·ID 조회다 → BM25나 단순 필터 검색이 더 낫다.
- 문서가 매우 적어서 전부 컨텍스트에 넣을 수 있다 → 검색 자체가 필요 없다.

어느 경우든 평가 세트로 Dense 단독, BM25 단독, Hybrid를 비교해 보고 결정해야 합니다.

## 8. 핵심 정리

> 하이브리드 검색은 의미 기반의 Dense 검색과 단어 기반의 Sparse 검색(BM25)을 함께 실행해 결과를 합치는 방식이다. Dense는 에러 코드·고유명사·숫자 같은 정확한 문자열에 약하고, BM25는 동의어·바꿔 말하기·다국어에 약해서, 둘은 실패하는 지점이 서로 다르다. 결합은 순위만 쓰는 RRF(Σ 1/(k+rank), 보통 k=60)와 점수를 정규화해 가중합하는 방식이 있으며, 튜닝 없이 안정적인 RRF가 기본 출발점이다. Elasticsearch·OpenSearch·Qdrant·Weaviate·Milvus는 결합 기능을 내장하고, pgvector는 PostgreSQL 전문 검색과 SQL로 직접 합친다. SPLADE 같은 학습형 희소 벡터는 BM25에 단어 확장을 더해 어휘 불일치를 줄인다. 실무에서는 "하이브리드로 후보를 넓게 → [리랭커](/blog/reranking)로 정밀하게" 구성이 흔하다.
