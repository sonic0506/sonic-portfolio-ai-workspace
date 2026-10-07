---
type: "blog"
id: "rag"
title: "RAG (Retrieval-Augmented Generation, 검색 증강 생성)"
summary: "RAG(Retrieval-Augmented Generation)는 LLM이 답하기 전에 외부 문서에서 관련 내용을 검색해 프롬프트에 넣어 주고, 그 내용을 근거로 답을 생성하게 하는 방식입니다. 이름은 2020년 Meta AI(당시 Facebook AI Research)의 Patrick Lewis 등이 발표한 논문 *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks*에서 왔습니다."
created_at: "2026-10-03"
updated_at: "2026-10-03"
published: true
category: "AI"
tags: ["ai", "rag", "llm"]
skills: []
related_projects: []
related_blogs: ["embedding", "vector-database", "bm25", "rag-chunking", "hybrid-search", "reranking", "rag-query-transformation", "rag-evaluation", "vectorless-rag", "agentic-rag", "long-context-vs-rag", "knowledge-graph", "graph-rag", "ontology", "ontology-rag", "rag-selection-guide"]
open_questions: []
---

## 1. RAG란?

RAG(Retrieval-Augmented Generation)는 LLM이 답하기 전에 외부 문서에서 관련 내용을 검색해 프롬프트에 넣어 주고, 그 내용을 근거로 답을 생성하게 하는 방식입니다. 이름은 2020년 Meta AI(당시 Facebook AI Research)의 Patrick Lewis 등이 발표한 논문 *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks*에서 왔습니다.

```text
          ┌────────────┐      ┌─────────────────┐
질문 ───> │  Retriever │ ───> │ 관련 문서 3~10개 │
          └────────────┘      └────────┬────────┘
                                       │
                                       ▼
          ┌────────────────────────────────────────┐
          │ 프롬프트 = 지시문 + 검색된 문서 + 질문  │
          └───────────────────┬────────────────────┘
                              ▼
                        ┌──────────┐
                        │   LLM    │ ───> 근거 있는 답 + 출처
                        └──────────┘
```

시험에 비유하면 이렇습니다.

| 구분 | 시험 | LLM |
|---|---|---|
| 일반 LLM | 외운 것만으로 푸는 **암기 시험(closed book)** | 학습 데이터에 들어간 지식만으로 답한다 |
| RAG | 교재를 펴 놓고 푸는 **오픈북 시험(open book)** | 질문마다 관련 페이지를 찾아 읽고 답한다 |

오픈북 시험 점수는 맞는 페이지를 얼마나 빨리, 정확하게 찾느냐에 달려 있습니다. RAG도 품질의 대부분이 검색(Retrieval)에서 결정됩니다.

## 2. 왜 필요할까?

### 2-1. LLM 단독의 한계

| 문제 | 설명 | 예시 |
|---|---|---|
| **환각(Hallucination)** | 모르는 것도 그럴듯하게 지어낸다 | 존재하지 않는 API 함수, 없는 판례 번호를 만들어 낸다 |
| **지식 컷오프(Knowledge Cutoff)** | 학습 시점 이후의 일을 모른다 | 지난주 바뀐 사내 휴가 규정을 모른다 |
| **사내·비공개 데이터** | 공개되지 않은 데이터는 학습에 없다 | 우리 회사 위키, 고객 계약서, 장애 보고서 |
| **출처 제시 불가** | 답이 어디서 왔는지 말할 수 없다 | "이 답의 근거가 뭔가요?"에 답하지 못한다 |

### 2-2. RAG가 해결하는 방식

```text
질문: "2026년 하반기 재택근무 규정이 어떻게 바뀌었나요?"

[LLM 단독]
"일반적으로 많은 회사는 주 2~3회 재택을 허용합니다..."   ← 일반론 또는 환각

[RAG]
검색 결과: hr-policy-2026-07.pdf 3페이지
  "2026년 7월 1일부터 재택근무는 주 2회로 조정하며, 팀장 승인 시 3회까지..."
답변: "7월 1일부터 주 2회로 조정되었고, 팀장 승인 시 3회까지 가능합니다.
       (출처: hr-policy-2026-07.pdf p.3)"
```

| 문제 | RAG의 해결 방식 |
|---|---|
| 환각 | "아래 문서에 근거해서만 답하라"고 제약해 지어낼 여지를 줄인다 (완전히 없애지는 못한다) |
| 지식 컷오프 | 문서만 갱신하면 된다. 모델을 다시 학습하지 않는다 |
| 사내 데이터 | 사내 문서를 색인해 검색 대상으로 넣는다 |
| 출처 제시 | 검색된 문서의 파일명, 페이지, URL을 함께 돌려준다 |
| 권한 관리 | 검색 단계에서 사용자 권한으로 필터링한다 (학습된 지식은 권한별로 나눌 수 없다) |

## 3. 파인튜닝과의 차이

"우리 데이터를 LLM에게 알려 주는" 방법은 크게 프롬프트에 넣어 주기(RAG)와 모델 가중치에 새기기(파인튜닝) 두 가지입니다.

| 구분 | RAG | 파인튜닝(Fine-tuning) |
|---|---|---|
| 지식이 있는 곳 | 외부 문서 저장소 | 모델 가중치 |
| 지식 갱신 | 문서 추가/삭제로 즉시 | 재학습 필요 |
| 출처 제시 | 가능 | 어렵다 |
| 권한별 접근 제어 | 검색 단계에서 필터링 | 사실상 불가능 |
| 잘하는 것 | **사실·지식**을 정확히 꺼내 쓰기 | **형식·말투·행동 방식** 익히기 |
| 비용 | 색인·검색 인프라, 질의마다 토큰 증가 | 학습 데이터 준비, 학습 비용 |
| 실패 모습 | 엉뚱한 문서를 찾아오면 틀린다 | 학습한 사실을 섞거나 지어낸다 |

정리하면 이렇습니다.

> **"무엇을 아느냐"는 RAG, "어떻게 행동하느냐"는 파인튜닝.**

둘을 함께 쓸 수도 있습니다. 사내 문서 형식에 맞춰 답하도록 파인튜닝한 모델에 RAG를 붙이는 식입니다. 다만 "사내 문서로 질의응답" 같은 요구사항은 대부분 RAG부터 시작하는 것이 정석입니다.

## 4. RAG 파이프라인

RAG는 미리 해 두는 인덱싱(Indexing)과 질문이 올 때마다 도는 질의(Query), 두 단계로 나뉩니다.

### 4-1. 전체 구조

```text
━━━━━━━━━━━━━━━━━━━ 인덱싱 (오프라인, 문서가 바뀔 때) ━━━━━━━━━━━━━━━━━━━

 ┌────────┐    ┌────────┐    ┌──────────┐    ┌──────────────────┐
 │ 로드   │ ─> │ 청킹   │ ─> │ 임베딩   │ ─> │ 저장             │
 │ Load   │    │ Chunk  │    │ Embed    │    │ Vector DB        │
 └────────┘    └────────┘    └──────────┘    │ (+ 원문, 메타데이터)│
 PDF, 위키,     500토큰       텍스트 →        └──────────────────┘
 Notion, DB     단위로 자름   벡터[1024]

━━━━━━━━━━━━━━━━━━━ 질의 (온라인, 질문마다) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 질문 ─> ┌──────────┐    ┌──────────────┐    ┌──────────┐
         │ 검색     │ ─> │ 프롬프트 조립 │ ─> │ 생성     │ ─> 답변 + 출처
         │ Retrieve │    │ Augment      │    │ Generate │
         └──────────┘    └──────────────┘    └──────────┘
         질문 임베딩 →    지시문 + 상위 k개
         유사한 청크 k개   청크 + 질문
```

### 4-2. 인덱싱 단계

| 단계 | 하는 일 | 주의할 점 |
|---|---|---|
| **로드(Load)** | PDF, HTML, 마크다운, DB 등에서 텍스트를 뽑는다 | PDF의 표, 다단 레이아웃, 머리말/꼬리말이 깨지기 쉽다 |
| **청킹(Chunk)** | 문서를 검색 단위로 자른다 | 너무 크면 검색이 흐려지고, 너무 작으면 문맥이 끊긴다 |
| **임베딩(Embed)** | 각 청크를 벡터로 바꾼다 | 질의와 문서에 **같은 모델**을 써야 한다 |
| **저장(Store)** | 벡터 + 원문 + 메타데이터(출처, 날짜, 권한)를 저장한다 | 메타데이터가 없으면 출처 표시, 필터링이 불가능하다 |

### 4-3. 질의 단계

| 단계 | 하는 일 | 주의할 점 |
|---|---|---|
| **검색(Retrieve)** | 질문을 임베딩해 가까운 청크 상위 k개를 찾는다 | k가 작으면 놓치고, 크면 노이즈와 비용이 늘어난다 |
| **프롬프트 조립(Augment)** | 지시문, 검색된 청크, 질문을 하나의 프롬프트로 만든다 | "문서에 없으면 모른다고 답하라"를 명시한다 |
| **생성(Generate)** | LLM이 답을 만든다 | 출처를 인용하도록 형식을 지정한다 |

## 5. 최소 구현

외부 프레임워크 없이 `sentence-transformers`, `numpy`, Anthropic SDK만으로 구현한 가장 단순한 RAG입니다. [벡터 DB](/blog/vector-database) 대신 numpy 배열을 씁니다.

### 5-1. 인덱싱

```python
import numpy as np
from sentence_transformers import SentenceTransformer

docs = {
    "hr-policy.md": "재택근무는 주 2회까지 가능하다. 팀장 승인 시 주 3회까지 허용한다. ...",
    "expense.md": "출장비는 출장 종료 후 7일 이내에 정산해야 한다. 숙박비 상한은 1박 15만원이다. ...",
    "security.md": "사내 노트북은 반드시 디스크 암호화를 켜야 한다. ...",
}

def chunk(text: str, size: int = 300, overlap: int = 50) -> list[str]:
    # 가장 단순한 고정 길이 청킹 (문자 단위)
    step = size - overlap
    return [text[i:i + size] for i in range(0, max(len(text) - overlap, 1), step)]

chunks, sources = [], []
for name, text in docs.items():
    for c in chunk(text):
        chunks.append(c)
        sources.append(name)

model = SentenceTransformer("BAAI/bge-m3")   # 다국어 임베딩 모델
vectors = model.encode(chunks, normalize_embeddings=True)  # (N, dim)
```

### 5-2. 검색

```python
def retrieve(question: str, k: int = 3) -> list[tuple[str, str, float]]:
    q = model.encode([question], normalize_embeddings=True)[0]
    scores = vectors @ q                     # 정규화했으므로 내적 = 코사인 유사도
    top = np.argsort(-scores)[:k]
    return [(sources[i], chunks[i], float(scores[i])) for i in top]
```

### 5-3. 프롬프트 조립과 생성

```python
import anthropic

client = anthropic.Anthropic()

def answer(question: str) -> str:
    hits = retrieve(question)
    context = "\n\n".join(
        f"<doc source='{src}'>\n{text}\n</doc>" for src, text, _ in hits
    )
    prompt = f"""아래 문서만 근거로 질문에 답하세요.
문서에 답이 없으면 "문서에서 찾을 수 없습니다"라고 답하세요.
답의 끝에 근거가 된 source를 괄호로 표시하세요.

{context}

질문: {question}"""
    resp = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    return resp.content[0].text

print(answer("출장비는 언제까지 정산해야 하나요?"))
# 출장 종료 후 7일 이내에 정산해야 합니다. (expense.md)
```

이 50줄 남짓이 Naive RAG입니다. 데모에서는 이것만으로도 그럴듯하게 동작하지만, 실제 문서와 실제 질문을 넣으면 문제가 드러납니다.

## 6. Naive RAG의 한계

### 6-1. 검색 실패 (Retrieval Miss)

정답이 있는 청크를 찾지 못하면 LLM은 답할 수 없고, 이것이 RAG 실패의 가장 큰 원인입니다.

| 원인 | 예시 |
|---|---|
| 고유명사·코드·숫자 | "ERR-4031 에러 원인"을 물었는데, 임베딩은 의미 위주라 정확한 코드 문자열 매칭에 약하다 |
| 어휘 불일치 | 질문은 "연차", 문서는 "유급휴가" |
| 모호한 질문 | "그거 어떻게 신청해요?" |
| 질문과 문서의 모양 차이 | 질문은 짧은 의문문, 문서는 긴 서술문이라 벡터가 멀다 |

```text
질문: "ERR-4031은 왜 나요?"
벡터 검색 1위: "에러가 발생하면 로그를 확인하세요..."    ← 의미는 비슷하지만 쓸모없다
실제 정답:     "ERR-4031: 결제 토큰 만료. 토큰 TTL은..." ← 순위 밖
```

### 6-2. 청크 경계 문제

```text
원문:
  ... 숙박비 상한은 1박 15만원이다. │ 단, 서울·제주 지역은 예외로
  1박 20만원까지 인정한다. ...       │
                                  ↑ 청크 경계

청크 A: "...숙박비 상한은 1박 15만원이다. 단, 서울·제주 지역은 예외로"
청크 B: "1박 20만원까지 인정한다. ..."
```

"서울 출장 숙박비 상한은?"이라는 질문에 청크 A만 검색되면 15만원이라고 틀리게 답합니다. 또 청크 B만 떼어 보면 무엇에 대한 이야기인지 알 수 없습니다.

### 6-3. 다중 홉(Multi-hop) 질문

답을 내려면 여러 문서를 차례로 연결해야 하는 질문입니다.

```text
질문: "결제팀 팀장이 승인할 수 있는 최대 출장비는?"

  1단계: 결제팀 팀장이 누구인가?      → org-chart.md: "결제팀 팀장: 김OO (L5)"
  2단계: L5 직급의 승인 한도는?       → approval.md: "L5: 300만원까지 전결"

한 번의 검색으로는 질문과 비슷한 청크 하나를 찾을 뿐, 1단계 결과를 보고
2단계 검색어를 만드는 일은 하지 않는다.
```

### 6-4. 전역 요약(Global) 질문

전체를 훑어야 답할 수 있는 질문입니다.

```text
질문: "지난 1년간 장애 보고서에서 가장 자주 나온 원인은?"
질문: "이 계약서 50개의 공통 위험 조항은?"
```

Top-k 검색은 질문과 비슷한 일부 청크만 가져옵니다. 장애 보고서 300건 중 5개만 보고 "가장 자주 나온 원인"을 답하면 틀릴 수밖에 없습니다. 이 유형은 검색 방식 자체를 바꿔야 합니다.

### 6-5. 그 밖의 문제

| 문제 | 설명 |
|---|---|
| 노이즈 | 관련 없는 청크가 섞이면 LLM이 그쪽에 끌려간다 |
| 오래된 문서 | 2023년 규정과 2026년 규정이 같이 검색되어 섞인다 |
| 표·이미지 | 텍스트 추출 단계에서 구조가 깨진다 |
| 평가 부재 | "잘 되는 것 같다"는 느낌 외에 품질을 측정할 수단이 없다 |

### 6-6. 한계와 개선 방향

| 한계 | 개선 방향 |
|---|---|
| 고유명사·코드 검색 실패 | 키워드 검색(BM25)과 벡터 검색을 합치는 하이브리드 검색 |
| 어휘 불일치, 모호한 질문 | 질의 재작성, 질의 확장, HyDE |
| 상위 k개의 순서가 부정확 | Cross-encoder 리랭킹 |
| 청크 경계, 문맥 손실 | 구조 기반 청킹, parent-child, 문맥 보강 |
| 다중 홉 | 반복 검색, 에이전트형 RAG, 지식 그래프 |
| 전역 요약 | GraphRAG의 커뮤니티 요약, 계층 요약 |
| 품질 측정 불가 | 검색·생성 지표로 평가 |

## 7. Naive → Advanced → Modular / Agentic

RAG의 발전 흐름은 2023년 Gao 등의 서베이 논문 *Retrieval-Augmented Generation for Large Language Models: A Survey*에서 **Naive / Advanced / Modular** 세 단계로 정리되었습니다. 여기에 LLM이 스스로 검색을 계획하는 **Agentic RAG**가 더해졌습니다.

```text
Naive RAG          Advanced RAG                 Modular / Agentic RAG
──────────         ─────────────────────        ──────────────────────────
질문                질문                          질문
 │                  │                             │
 ▼                  ▼ [Pre-retrieval]             ▼
검색 1회            질의 재작성/확장               ┌─────────────┐
 │                  │                             │ LLM이 판단   │◀──┐
 ▼                  ▼                             │ - 검색할까?  │   │
생성               하이브리드 검색                 │ - 어디서?    │   │
                    │                             │ - 충분한가?  │   │
                    ▼ [Post-retrieval]            └──┬──────────┘   │
                   리랭킹, 압축                       ▼              │
                    │                             도구 호출 ─────────┘
                    ▼                             (벡터DB, 웹, SQL, 그래프)
                   생성                               │
                                                     ▼
                                                    생성
```

| 구분 | Naive RAG | Advanced RAG | Modular / Agentic RAG |
|---|---|---|---|
| 흐름 | 검색 → 생성 고정 | 검색 전후에 단계 추가 | 모듈을 조합하거나 LLM이 흐름을 결정 |
| 검색 횟수 | 1회 | 대체로 1회 (질의 여러 개 가능) | 필요한 만큼 반복 |
| 대표 기법 | 벡터 top-k | 질의 변환, 하이브리드, 리랭킹, 청킹 개선 | 라우팅, 반복 검색, 도구 사용, 자기 검증 |
| 장점 | 단순, 빠름, 저렴 | 정확도가 크게 오른다 | 다중 홉, 복잡한 질문에 대응 |
| 단점 | 실제 데이터에서 정확도가 낮다 | 파이프라인이 길어진다 | 느리고 비싸고 예측이 어렵다 |

처음부터 Agentic RAG를 만들 필요는 없습니다. Naive RAG를 만든 뒤 평가 세트로 실패를 측정하고, 실패 유형에 맞는 기법을 하나씩 붙여 나가는 것이 정석입니다.

```text
1. Naive RAG 구현
2. 질문-정답 평가 세트 50~100개 준비
3. 실패 사례 분류 ─┬─ 정답 청크가 검색 안 됨   → 검색 개선 (하이브리드, 질의 변환)
                  ├─ 검색은 됐는데 순위가 낮음 → 리랭킹
                  ├─ 청크에 문맥이 부족함     → 청킹 개선
                  ├─ 여러 문서를 이어야 함    → 에이전트, 그래프
                  └─ 검색은 됐는데 답이 틀림  → 프롬프트, 모델
4. 하나 고치고 다시 측정
```

## 8. 장점과 단점

| 장점 | 설명 |
|---|---|
| 최신·사내 지식 사용 | 모델을 다시 학습하지 않고 문서만 바꾸면 된다 |
| 출처 제시 | 답의 근거를 사용자가 직접 확인할 수 있다 |
| 환각 감소 | 근거 문서로 답의 범위를 제한한다 |
| 권한 제어 | 검색 단계에서 사용자별로 볼 수 있는 문서만 가져온다 |
| 모델 교체가 쉽다 | 검색 파이프라인은 그대로 두고 LLM만 바꿀 수 있다 |

| 단점 | 설명 |
|---|---|
| 검색 품질이 상한선 | 못 찾으면 아무리 좋은 LLM도 답하지 못한다 |
| 파이프라인 운영 | 문서 수집, 파싱, 재색인, 삭제 동기화가 필요하다 |
| 지연과 비용 | 검색 시간 + 프롬프트에 들어가는 토큰 |
| 전역 질문에 약함 | top-k 구조로는 "전체를 요약하라"에 답하기 어렵다 |
| 환각이 0이 되지 않는다 | 검색된 문서를 잘못 해석하거나 섞어서 답할 수 있다 |

### 8-1. RAG가 필요 없는 경우

- 문서 전체가 모델의 컨텍스트 창에 다 들어갈 만큼 작다 → 통째로 넣는 것이 더 단순하고 정확할 수 있다.
- 답에 필요한 것이 지식이 아니라 형식·말투다 → 프롬프트나 파인튜닝.
- 데이터가 정형 데이터(매출 테이블 등)다 → 텍스트 검색보다 SQL 생성(Text-to-SQL)이 맞다.
- 모델이 이미 잘 아는 일반 상식 질문이다.

## 9. 시리즈 지도

RAG 시리즈 노트들의 관계입니다. 위에서 아래로 읽으면 기반 → 개선 → 대안 순서가 됩니다.

### 9-1. 기반

- [임베딩 (Embedding, 임베딩)](/blog/embedding) — 텍스트를 의미 벡터로 바꾸는 방법과 유사도 계산
- [벡터 데이터베이스 (Vector Database, 벡터 데이터베이스)](/blog/vector-database) — 벡터를 저장하고 근사 최근접 이웃(ANN)으로 빠르게 찾는 저장소
- [BM25 (Okapi BM25, 키워드 검색 랭킹 함수)](/blog/bm25) — 단어 빈도 기반의 고전 키워드 검색 점수

### 9-2. 기본 RAG 개선

- [RAG 청킹 (Chunking, 문서 분할)](/blog/rag-chunking) — 문서를 어떻게 자를지: 고정 길이, 구조 기반, 시맨틱, parent-child, 문맥 보강
- [하이브리드 검색 (Hybrid Search)](/blog/hybrid-search) — 벡터 검색과 키워드 검색을 RRF 등으로 결합
- [Reranking (Reranking, 리랭킹)](/blog/reranking) — 1차 검색 결과를 cross-encoder로 다시 정렬
- [RAG 쿼리 변환 (RAG Query Transformation, RAG 쿼리 변환)](/blog/rag-query-transformation) — 질의 재작성, 분해, 확장, HyDE
- [RAG 평가 (RAG Evaluation, RAG 평가)](/blog/rag-evaluation) — 검색과 생성 품질을 측정하는 지표와 평가 세트

### 9-3. 임베딩 없는 RAG와 에이전트

- [Vectorless RAG (Vectorless RAG, 벡터 없는 RAG)](/blog/vectorless-rag) — 벡터 없이 키워드 검색, 문서 구조 탐색, LLM 추론으로 찾는 방식
- [Agentic RAG (Agentic RAG, 에이전틱 RAG)](/blog/agentic-rag) — LLM이 검색 여부, 검색 대상, 반복 횟수를 스스로 결정
- [Long Context vs RAG (Long Context vs RAG, 롱 컨텍스트 vs RAG)](/blog/long-context-vs-rag) — 긴 컨텍스트 창에 다 넣을지, 검색해서 넣을지

### 9-4. 그래프와 온톨로지

- [지식 그래프 (Knowledge Graph, 지식 그래프)](/blog/knowledge-graph) — 개체와 관계를 그래프로 표현한 지식 저장 방식
- [Graph RAG (Graph Retrieval-Augmented Generation, 그래프 RAG)](/blog/graph-rag) — 지식 그래프와 커뮤니티 요약으로 다중 홉·전역 질문에 대응
- [온톨로지 (Ontology, 온톨로지)](/blog/ontology) — 개념, 관계, 제약을 명시적으로 정의한 스키마
- [온톨로지 RAG (Ontology-guided RAG, 온톨로지 기반 RAG)](/blog/ontology-rag) — 온톨로지로 검색과 추론의 정확도를 높이는 RAG

### 9-5. 정리

- [RAG 방식 선택 가이드 (RAG Selection Guide)](/blog/rag-selection-guide) — 상황별로 어떤 RAG 기법을 고를지 정리한 선택 가이드

## 10. 핵심 정리

> RAG는 LLM이 답하기 전에 외부 문서를 검색해 프롬프트에 넣고, 그 문서를 근거로 답하게 하는 방식이다. 환각, 지식 컷오프, 사내 데이터, 출처 제시 문제를 모델 재학습 없이 해결한다. 파인튜닝이 "어떻게 행동하느냐"를 바꾼다면 RAG는 "무엇을 아느냐"를 바꾼다. 파이프라인은 인덱싱(로드 → 청킹 → 임베딩 → 저장)과 질의(검색 → 프롬프트 조립 → 생성)로 나뉘고, 품질의 상한은 검색이 정한다. Naive RAG는 고유명사 검색 실패, 청크 경계, 다중 홉 질문, 전역 요약 질문에 약하며, 이를 하이브리드 검색·리랭킹·질의 변환·청킹 개선(Advanced), 반복 검색과 도구 사용(Agentic), 그래프 기반 검색(GraphRAG)으로 보완한다. 처음에는 Naive RAG와 평가 세트로 시작하고, 측정된 실패에 맞춰 기법을 하나씩 더하는 것이 정석이다.
