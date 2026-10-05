---
type: "blog"
id: "rag-evaluation"
title: "RAG 평가 (RAG Evaluation, RAG 평가)"
summary: "RAG 평가(RAG Evaluation)는 RAG 시스템이 올바른 문서를 찾았는지, 그리고 찾은 문서로 올바른 답을 만들었는지를 숫자로 측정하는 일입니다."
created_at: "2026-10-03"
updated_at: "2026-10-03"
published: true
category: "AI·RAG"
tags: ["ai", "rag", "evaluation"]
skills: []
related_projects: []
related_blogs: ["rag"]
open_questions: []
---

## 1. RAG 평가란?

RAG 평가(RAG Evaluation)는 [RAG](/blog/rag) 시스템이 올바른 문서를 찾았는지, 그리고 찾은 문서로 올바른 답을 만들었는지를 숫자로 측정하는 일입니다.

청크 크기를 바꾸거나, 임베딩 모델을 교체하거나, 프롬프트를 고쳤을 때 결과가 좋아졌는지 나빠졌는지 말할 수 있어야 평가라고 할 수 있습니다. "몇 개 물어봤더니 괜찮던데요" 정도로는 거기에 답할 수 없습니다.

```text
변경 전                         변경 후
 recall@5        0.72    →     0.81   (개선)
 faithfulness    0.90    →     0.88   (약간 하락)
 answer correct  0.68    →     0.74   (개선)
```

이런 표가 나와야 "청크를 줄인 덕분에 검색은 좋아졌지만, 답변이 근거에서 조금 더 벗어나기 시작했다"처럼 판단할 수 있습니다.

## 2. 왜 검색과 생성을 나눠서 평가해야 하는가?

### 2-1. 최종 답만 보면 원인을 모른다

RAG는 검색과 생성 두 단계로 이루어지므로, 최종 답이 틀렸을 때 원인도 크게 둘로 나뉩니다.

```text
질문 ──> [검색] ──> 문서들 ──> [생성] ──> 답변
           │                     │
     ① 정답 문서를 못 찾음    ② 문서는 맞는데 답을 잘못 만듦
```

| 상황 | 검색 | 생성 | 고칠 곳 |
|---|---|---|---|
| A | 정답 문서 못 찾음 | (당연히) 틀린 답 | 청킹, 임베딩, 쿼리 변환, 하이브리드 검색 |
| B | 정답 문서 찾음 | 문서 무시하고 지어냄 | 프롬프트, 모델, 컨텍스트 양 |
| C | 정답 문서 찾음 | 맞는 답 | - |
| D | 정답 문서 못 찾음 | 우연히 맞는 답 (모델 사전 지식) | 검색. 운이 좋았을 뿐이다 |

최종 정답률만 보면 A와 B가 구분되지 않고, D는 성공으로 집계됩니다. 그래서 검색 지표와 생성 지표를 따로 봅니다.

### 2-2. 비유

시험 답안지 채점과 비슷합니다.

- 검색 평가: 학생이 오픈북 시험에서 맞는 페이지를 펼쳤는가?
- 생성 평가: 펼친 페이지를 제대로 읽고 옮겨 적었는가? 페이지에 없는 내용을 지어내지 않았는가?

## 3. 검색 지표

검색 평가에는 질문마다 어떤 문서(청크)가 정답인지 표시된 데이터가 필요합니다. 아래 예시를 계속 사용합니다.

```text
질문 q1의 정답 문서: {d1, d2, d5}
검색 결과 (순위순, top-5): [d3, d1, d7, d2, d9]
                           1    2   3   4   5
                           ✗    ✓   ✗   ✓   ✗
```

### 3-1. Precision@k

상위 k개 중 정답 문서의 비율입니다. "가져온 것 중에 쓸모 있는 게 얼마나 되나?"

```text
precision@5 = (top-5 중 정답 수) / 5 = 2 / 5 = 0.4
```

LLM에 넘기는 문서 중 쓸모없는 문서가 많으면 비용이 낭비되고 답변이 흐트러지므로, precision은 노이즈를 봅니다.

### 3-2. Recall@k

전체 정답 문서 중 상위 k개 안에 들어온 비율입니다. "찾아야 할 것 중에 얼마나 찾았나?"

```text
recall@5 = (top-5 중 정답 수) / (전체 정답 수) = 2 / 3 ≈ 0.667
```

RAG에서는 보통 recall이 더 중요합니다. 정답 문서가 컨텍스트에 아예 없으면 LLM이 맞는 답을 만들 방법이 없기 때문입니다. 질문당 정답 문서가 하나뿐인 데이터셋에서는 recall@k가 "top-k 안에 정답이 있는가(0 또는 1)"가 되며, hit rate라고도 부릅니다.

### 3-3. MRR (Mean Reciprocal Rank)

첫 번째 정답 문서가 몇 위에 나왔는지의 역수를 질문들에 대해 평균 낸 값입니다.

```text
q1: 첫 정답 d1이 2위   → 1/2 = 0.5
q2: 첫 정답이 1위      → 1/1 = 1.0
q3: top-k 안에 정답 없음 → 0

MRR = (0.5 + 1.0 + 0) / 3 = 0.5
```

- "정답 하나만 있으면 된다"는 상황(FAQ 검색 등)에 잘 맞습니다.
- 두 번째 이후 정답 문서의 위치는 반영하지 않습니다.

### 3-4. nDCG@k (normalized Discounted Cumulative Gain)

정답이 위쪽에 있을수록 점수를 더 주고, 이상적인 순서와 비교해 0~1로 정규화한 값입니다. 관련도를 "정답/오답"뿐 아니라 "매우 관련(3), 조금 관련(1)"처럼 등급으로 줄 수도 있습니다.

```text
DCG@k  = Σ  rel_i / log2(i + 1)      (i = 순위, 1부터)
IDCG@k = 정답을 가장 이상적인 순서로 놓았을 때의 DCG
nDCG@k = DCG@k / IDCG@k
```

이진 관련도(정답=1, 오답=0)로 q1을 계산하면:

```text
DCG@5  = 1/log2(3) + 1/log2(5)               (2위, 4위가 정답)
       = 0.631 + 0.431 = 1.062

IDCG@5 = 1/log2(2) + 1/log2(3) + 1/log2(4)   (정답 3개가 1~3위에 있는 이상적 경우)
       = 1 + 0.631 + 0.5 = 2.131

nDCG@5 = 1.062 / 2.131 ≈ 0.498
```

등급 관련도를 쓸 때는 분자를 `2^rel − 1`로 두는 변형도 널리 쓰입니다. 어떤 정의를 쓰는지 팀 안에서 고정해야 숫자를 비교할 수 있습니다.

### 3-5. 지표 비교

| 지표 | 보는 것 | 순서 반영 | 언제 중요한가 |
|---|---|---|---|
| Precision@k | 가져온 것 중 쓸모 있는 비율 | ✗ | 컨텍스트 노이즈, 토큰 비용 |
| Recall@k | 찾아야 할 것 중 찾은 비율 | ✗ | 정답 누락. RAG에서 가장 기본 |
| MRR | 첫 정답의 위치 | ✓ (첫 정답만) | 정답 하나면 충분한 검색 |
| nDCG@k | 정답들의 위치 전체, 등급 | ✓ | 리랭킹 품질 비교 |

### 3-6. 코드

```python
import math

def precision_at_k(retrieved: list[str], relevant: set[str], k: int) -> float:
    return sum(d in relevant for d in retrieved[:k]) / k

def recall_at_k(retrieved: list[str], relevant: set[str], k: int) -> float:
    return sum(d in relevant for d in retrieved[:k]) / len(relevant)

def reciprocal_rank(retrieved: list[str], relevant: set[str]) -> float:
    for i, d in enumerate(retrieved, start=1):
        if d in relevant:
            return 1 / i
    return 0.0

def ndcg_at_k(retrieved: list[str], relevant: set[str], k: int) -> float:
    dcg = sum(1 / math.log2(i + 2) for i, d in enumerate(retrieved[:k]) if d in relevant)
    idcg = sum(1 / math.log2(i + 2) for i in range(min(len(relevant), k)))
    return dcg / idcg

if __name__ == "__main__":
    r, rel = ["d3", "d1", "d7", "d2", "d9"], {"d1", "d2", "d5"}
    assert precision_at_k(r, rel, 5) == 0.4
    assert abs(recall_at_k(r, rel, 5) - 2 / 3) < 1e-9
    assert reciprocal_rank(r, rel) == 0.5
    assert abs(ndcg_at_k(r, rel, 5) - 0.498) < 1e-3
```

MRR은 질문별 `reciprocal_rank`의 평균이고, 다른 지표들도 질문별로 계산해 평균을 냅니다.

## 4. 생성 지표

생성 평가는 "답변이 좋은가?"를 여러 축으로 나눠 봅니다. 대표적인 축은 다음과 같습니다.

```text
           질문
          ╱    ╲
 answer  ╱      ╲  context
relevance        relevance / precision
        ╱        ╲
     답변 ──────── 검색된 문서
         faithfulness
         (groundedness)
```

### 4-1. Faithfulness / Groundedness (충실성, 근거성)

답변의 내용이 검색된 문서에 근거하는지를 봅니다. 환각(hallucination)을 잡는 지표입니다.

계산 방식(대표적인 접근):

```text
1. 답변을 개별 주장(claim)으로 쪼갠다
2. 각 주장이 검색된 문서로 뒷받침되는지 판정한다
3. faithfulness = 뒷받침되는 주장 수 / 전체 주장 수
```

예시:

```text
문서: "구매일로부터 7일 이내에 환불을 신청할 수 있습니다. 단, 개봉한 상품은 제외됩니다."
답변: "구매 후 7일 이내에 환불 신청이 가능하며, 수수료는 무료입니다."

주장 1: 구매 후 7일 이내 환불 신청 가능   → 문서에 있음 ✓
주장 2: 수수료는 무료                    → 문서에 없음 ✗

faithfulness = 1/2 = 0.5
```

"수수료 무료"가 실제로 사실이더라도, 문서에 없으면 근거 없는 주장으로 봅니다. RAG의 목적은 근거 있는 답변이기 때문입니다.

### 4-2. Answer Relevance (답변 관련성)

답변이 질문에 실제로 답하고 있는지를 봅니다. 사실은 맞지만 동문서답인 경우를 잡습니다.

```text
질문: "환불은 며칠 안에 신청해야 하나요?"
답변: "당사는 고객 만족을 위해 다양한 환불 정책을 운영하고 있습니다."
      → 근거가 있어도(faithful) 질문에 답하지 않음 → answer relevance 낮음
```

RAGAS에서는 답변으로부터 "이 답변이 답할 법한 질문"을 LLM으로 여러 개 생성하고, 원래 질문과의 임베딩 유사도 평균을 내는 방식을 씁니다.

### 4-3. Context Precision (컨텍스트 정밀도)

검색된 문서 중 질문에 실제로 필요한 문서가 위쪽에 있는지를 봅니다. 3-1의 precision과 비슷하지만, 정답 문서 ID 라벨 대신 LLM이 각 문서의 관련성을 판정하고, 순위까지 반영하는 구현이 많습니다.

### 4-4. Context Recall (컨텍스트 재현율)

정답(참조 답변)에 필요한 정보가 검색된 문서에 모두 들어 있는지를 봅니다.

```text
참조 답변: "7일 이내 신청 가능하며, 개봉 상품은 제외된다."
  문장 1: 7일 이내 신청 가능   → 검색 문서에서 찾을 수 있음 ✓
  문장 2: 개봉 상품 제외       → 검색 문서에 없음 ✗

context recall = 1/2 = 0.5
```

문서 ID 라벨이 없어도 참조 답변만 있으면 검색의 누락을 잴 수 있다는 장점이 있습니다.

### 4-5. Answer Correctness (정답 일치)

참조 답변이 있다면 생성된 답변과 사실관계가 일치하는지를 직접 비교할 수도 있습니다. 문자열 정확 일치(exact match)는 표현이 조금만 달라도 틀리므로, 보통 LLM 판정이나 의미 유사도를 함께 씁니다.

### 4-6. 지표 정리

| 지표 | 질문 | 필요한 데이터 | 실패하면 의심할 곳 |
|---|---|---|---|
| Faithfulness | 답이 문서에 근거하나? | 답변, 검색 문서 | 프롬프트, 생성 모델 |
| Answer relevance | 답이 질문에 답하나? | 질문, 답변 | 프롬프트, 질문 이해 |
| Context precision | 가져온 문서가 쓸모 있나? | 질문, 검색 문서 (+참조 답변) | 리랭킹, top-k |
| Context recall | 필요한 정보를 다 가져왔나? | 검색 문서, 참조 답변 | 청킹, 임베딩, 쿼리 변환 |
| Answer correctness | 답이 맞나? | 답변, 참조 답변 | 전체 파이프라인 |

## 5. 평가 도구

| 도구 | 특징 |
|---|---|
| RAGAS | RAG 평가용 오픈소스 라이브러리. faithfulness, answer relevancy, context precision/recall 등을 LLM 기반으로 계산한다 (Es et al., 2023) |
| TruLens | context relevance, groundedness, answer relevance를 "RAG triad"로 묶어 추적한다 |
| DeepEval | pytest 스타일로 LLM 앱 테스트를 작성할 수 있다 |
| 각 LLM 관측(observability) 플랫폼 | 운영 로그를 수집해 평가 지표를 붙이고 대시보드로 본다 |

도구들의 지표 이름은 비슷해도 계산 방식과 프롬프트가 다릅니다. 도구를 바꾸면 같은 시스템도 점수가 달라지므로, 도구 간 숫자를 직접 비교하지 않습니다. API도 버전마다 자주 바뀌므로 사용 시점의 공식 문서를 확인합니다.

도구 없이 핵심만 직접 구현해 보면 원리를 이해하기 쉽습니다.

```python
import json
from openai import OpenAI

client = OpenAI()
JUDGE_MODEL = "gpt-4o"  # 판정 모델은 평가 대상 모델과 다르게 두는 것이 좋다

FAITHFULNESS = """주어진 문서(context)와 답변(answer)이 있습니다.
1) 답변을 사실 주장 단위로 나누세요.
2) 각 주장이 문서만으로 뒷받침되는지 판정하세요. 문서에 없는 내용은 false입니다.
JSON으로만 답하세요: {{"claims": [{{"claim": "...", "supported": true}}]}}

context:
{context}

answer:
{answer}"""

def faithfulness(context: str, answer: str) -> float:
    resp = client.chat.completions.create(
        model=JUDGE_MODEL,
        temperature=0,
        response_format={"type": "json_object"},
        messages=[{"role": "user", "content": FAITHFULNESS.format(context=context, answer=answer)}],
    )
    claims = json.loads(resp.choices[0].message.content)["claims"]
    if not claims:
        return 1.0  # 주장이 없는 답변("모르겠습니다")은 지어낸 것도 없다
    return sum(c["supported"] for c in claims) / len(claims)
```

## 6. LLM-as-judge와 그 함정

생성 지표 대부분은 LLM이 채점자 역할을 합니다. 사람이 수천 건을 채점할 수 없으니 현실적인 선택이지만, LLM 채점자도 편향이 있습니다.

### 6-1. 알려진 편향

LLM 판정의 편향은 Zheng et al.(2023) *Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena* 등에서 정리되었습니다.

| 편향 | 내용 | 완화 방법 |
|---|---|---|
| 위치 편향 (position bias) | 두 답을 비교할 때 먼저(또는 나중에) 나온 쪽을 선호 | 순서를 바꿔 두 번 판정하고 결과가 일치할 때만 채택 |
| 길이 편향 (verbosity bias) | 길고 자세한 답을 더 좋게 평가 | 채점 기준에 "간결성"을 명시, 길이 통제 |
| 자기 선호 (self-enhancement) | 자기(같은 계열 모델)가 쓴 답을 높게 평가 | 생성 모델과 다른 판정 모델 사용 |
| 점수 척도 불안정 | 1~10점 척도에서 점수가 몰리거나 흔들림 | 이진(예/아니오) 또는 3단계 척도, 기준별 체크리스트 |
| 지식 오염 | 문서에 없지만 "사실인" 내용을 근거 있다고 판정 | 프롬프트에 "문서만 기준으로" 명시, 반례 테스트 |

### 6-2. 판정 프롬프트 설계 원칙

- 점수보다 판정을 쪼갭니다. "답변 품질 1~10점" 대신 "주장별로 문서에 있는가 예/아니오"처럼 작은 판단으로 나눕니다.
- 이유를 먼저 쓰게 합니다. 근거를 쓴 뒤 판정하게 하면 일관성이 올라가는 경우가 많고, 나중에 사람이 검토하기도 쉽습니다.
- temperature를 0으로 두고, 판정 모델과 프롬프트 버전을 고정합니다. 판정 모델을 바꾸면 점수 기준선도 바뀝니다.

### 6-3. 판정자도 검증한다

LLM 판정이 믿을 만한지 사람 판정과 비교합니다.

```text
1. 50~100건을 뽑아 사람이 직접 채점
2. 같은 건을 LLM 판정자로 채점
3. 일치율을 확인 (불일치 사례를 읽어 보고 프롬프트 수정)
4. 일치율이 충분히 높아지면 LLM 판정을 대량 평가에 사용
```

판정 프롬프트를 고칠 때마다 이 과정을 다시 합니다. 판정자를 검증하지 않은 점수는 "그럴듯한 숫자"일 뿐입니다.

## 7. 골든 데이터셋 만들기

골든 데이터셋(Golden Dataset)은 평가의 기준이 되는 질문·정답 묶음입니다. 지표보다 이 데이터셋의 품질이 평가 결과를 더 크게 좌우합니다.

### 7-1. 한 건의 구성

```json
{
  "id": "refund-001",
  "question": "환불은 구매 후 며칠 안에 신청해야 하나요?",
  "reference_answer": "구매일로부터 7일 이내에 신청해야 하며, 개봉한 상품은 제외됩니다.",
  "relevant_doc_ids": ["policy/refund.md#chunk-3"],
  "tags": ["refund", "single-hop"],
  "source": "real-user-log"
}
```

| 필드 | 쓰임 |
|---|---|
| `question` | 평가 입력 |
| `reference_answer` | answer correctness, context recall |
| `relevant_doc_ids` | recall@k, MRR, nDCG |
| `tags` | 유형별 점수 분석 (어느 유형이 약한가) |

> `relevant_doc_ids`를 청크 ID로 저장하면 청킹 방식을 바꾸는 순간 라벨이 깨집니다. 문서 ID + 정답 문장(또는 위치)으로 저장해 두고, 청크가 그 문장을 포함하는지로 판정하면 청킹 변경에도 재사용할 수 있습니다.

### 7-2. 질문은 어디서 오나?

| 출처 | 장점 | 단점 |
|---|---|---|
| 실제 사용자 로그 | 진짜 분포. 실제 어휘, 실제 실수 | 정답 라벨을 사람이 붙여야 한다. 개인정보 처리 필요 |
| 도메인 전문가 작성 | 중요하고 어려운 질문을 의도적으로 포함 | 느리고 비싸다. 수십~수백 건이 현실적 |
| LLM 합성 생성 | 빠르게 수백~수천 건 | 문서 문장을 그대로 베낀 쉬운 질문에 치우치기 쉽다 |

현실적으로는 합성 질문으로 양을 채우고, 실제 로그와 전문가 질문으로 품질을 보강합니다.

### 7-3. 합성 질문 생성

문서 청크를 하나 골라 LLM에게 "이 청크로 답할 수 있는 질문과 답"을 만들게 합니다. 정답 문서가 처음부터 정해져 있으므로 검색 라벨이 공짜로 생깁니다.

```python
import json, random

SYNTH = """다음 사내 문서 단락을 읽고, 이 단락만으로 답할 수 있는 질문 하나와 답을 만드세요.
- 실제 직원이 물어볼 법한 구어체로 쓰세요.
- 단락의 문장을 그대로 베끼지 말고 다른 표현을 쓰세요.
JSON으로만 답하세요: {{"question": "...", "answer": "..."}}

단락:
{chunk}"""

def synthesize(chunks: dict[str, str], n: int, seed: int = 0) -> list[dict]:
    rng = random.Random(seed)
    items = []
    for chunk_id in rng.sample(list(chunks), n):
        resp = client.chat.completions.create(
            model=JUDGE_MODEL,
            temperature=0.7,
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": SYNTH.format(chunk=chunks[chunk_id])}],
        )
        qa = json.loads(resp.choices[0].message.content)
        items.append({
            "question": qa["question"],
            "reference_answer": qa["answer"],
            "relevant_doc_ids": [chunk_id],
            "source": "synthetic",
        })
    return items
```

### 7-4. 합성 데이터의 함정과 보완

| 함정 | 설명 | 보완 |
|---|---|---|
| 너무 쉬운 질문 | 문서 문장을 살짝 바꾼 질문이라 검색이 쉽게 맞힌다 | "다른 표현을 써라" 지시, 어휘 겹침이 큰 질문 필터링 |
| 단일 청크 편향 | 모든 질문이 청크 하나로 답해진다 | 두 청크를 주고 둘 다 필요한 질문(multi-hop)을 따로 생성 |
| 답 없는 질문 부재 | 실제로는 문서에 없는 질문도 들어온다 | "문서에 답이 없는 질문"을 일부 섞어 "모른다"고 답하는지 확인 |
| 라벨 누락 | 같은 정보가 다른 청크에도 있는데 하나만 정답으로 표시 | 검색 결과 상위의 "오답" 문서를 샘플링해 사람이 재확인 |
| 품질 미검증 | 이상한 질문이 섞인다 | 생성 후 사람이 일부를 읽고 버린다 |

### 7-5. 얼마나 만들어야 하나?

정해진 숫자는 없고, 다음 기준으로 판단합니다.

- 유형별로 충분해야 합니다. 전체 200건이어도 "비교 질문"이 3건이면 그 유형의 점수는 믿을 수 없습니다.
- 작은 변경의 차이를 보고 싶을수록 더 많이 필요합니다. 50건에서 2%p 차이는 질문 한 건 차이입니다.
- 처음에는 수십 건으로 시작해 실패 사례를 계속 추가하는 방식이 현실적입니다.

## 8. 회귀 테스트로 운영하기

평가는 코드 테스트처럼 변경이 있을 때마다 돌립니다.

### 8-1. 언제 돌리나

```text
변경 사항                         → 평가 실행
─────────────────────────────────────────────
프롬프트 수정                      → 생성 지표
청크 크기 / 임베딩 모델 / top-k 변경 → 검색 지표 + 생성 지표
LLM 모델 버전 변경                  → 생성 지표
문서 대량 추가·수정                  → 검색 지표 (라벨 유효성도 확인)
```

### 8-2. 파이프라인

```text
PR 생성
  │
  ▼
골든 데이터셋으로 RAG 실행 (결과 캐싱)
  │
  ▼
검색 지표 계산 (빠름, LLM 불필요)  ──┐
생성 지표 계산 (LLM 판정, 느림)    ──┤
  │                                 │
  ▼                                 ▼
기준선(main 브랜치 결과)과 비교 → 하락 폭이 임계값을 넘으면 실패 처리
  │
  ▼
리포트: 지표 변화 + 새로 틀린 질문 목록 + 새로 맞힌 질문 목록
```

```python
BASELINE = {"recall@5": 0.78, "faithfulness": 0.91, "answer_correctness": 0.72}
TOLERANCE = 0.02  # 판정 노이즈를 감안한 허용 하락폭

def check_regression(current: dict[str, float]) -> list[str]:
    return [
        f"{name}: {BASELINE[name]:.3f} -> {value:.3f}"
        for name, value in current.items()
        if name in BASELINE and value < BASELINE[name] - TOLERANCE
    ]

if __name__ == "__main__":
    assert check_regression({"recall@5": 0.79, "faithfulness": 0.85}) == ["faithfulness: 0.910 -> 0.850"]
```

### 8-3. 운영 팁

- 평균과 함께 질문별 차이를 봅니다. 평균이 같아도 10건이 새로 틀리고 10건이 새로 맞았을 수 있습니다. 새로 틀린 질문 목록이 가장 유용한 정보입니다.
- 검색 지표를 먼저, 자주 돌립니다. LLM 호출이 없어서 빠르고 싸고 결정적입니다. 생성 지표는 비용이 드니 필요할 때 돌립니다.
- LLM 판정 노이즈를 감안합니다. 같은 입력을 두 번 판정해도 점수가 조금 다를 수 있습니다. 허용 오차를 두고, 의심스러우면 여러 번 돌려 평균을 냅니다.
- 운영 로그에서 데이터셋을 키웁니다. 사용자가 "싫어요"를 누른 질문, 답변에 "모르겠습니다"가 나온 질문을 검토해서 골든 데이터셋에 추가합니다.
- 문서가 바뀌면 라벨도 바뀝니다. 정책 문서가 개정되면 참조 답변도 고쳐야 합니다. 데이터셋에도 버전을 붙입니다.

## 9. 흔한 실수

| 실수 | 왜 문제인가 |
|---|---|
| 최종 답만 평가 | 검색 문제인지 생성 문제인지 알 수 없다 |
| 몇 개 질문으로 눈대중 평가 | 변경의 효과를 숫자로 비교할 수 없다 |
| 합성 데이터만 사용 | 실제 사용자 질문보다 쉬워서 점수가 부풀려진다 |
| 판정 모델·프롬프트를 수시로 변경 | 점수 기준선이 흔들려 이전 결과와 비교할 수 없다 |
| LLM 판정자를 검증하지 않음 | 편향된 채점자가 낸 숫자를 믿게 된다 |
| 평가셋으로 튜닝을 반복 | 평가셋에만 맞춘 과적합. 일부를 튜닝에 쓰지 않는 검증용으로 떼어 둔다 |

## 10. 핵심 정리

> RAG 평가는 "올바른 문서를 찾았는가(검색)"와 "그 문서로 올바른 답을 만들었는가(생성)"를 나눠서 측정해야 원인을 찾을 수 있다. 검색은 recall@k, precision@k, MRR, nDCG로 정답 문서의 포함 여부와 위치를 보고, 생성은 faithfulness(근거성), answer relevance, context precision/recall, answer correctness로 본다. 생성 지표는 대부분 LLM이 채점하므로 위치·길이·자기 선호 편향을 알고, 판정을 작게 쪼개고, 사람 판정과 비교해 검증한다. 평가의 기반은 골든 데이터셋이며, 합성 질문으로 양을 채우고 실제 로그와 전문가 질문으로 보강한다. 이렇게 만든 평가를 변경 때마다 회귀 테스트로 돌려, 평균뿐 아니라 새로 틀린 질문을 확인하며 운영한다.
