---
type: "blog"
id: "agentic-rag"
title: "Agentic RAG (Agentic RAG, 에이전틱 RAG)"
summary: "Agentic RAG는 언제, 무엇을, 어떤 도구로 검색할지를 LLM이 스스로 결정하며 검색과 추론을 반복하는 RAG입니다. 검색 단계가 파이프라인에 고정되어 있지 않고, LLM이 도구를 호출하는 루프 안에서 필요할 때마다 검색합니다."
created_at: "2026-10-03"
updated_at: "2026-10-03"
published: true
category: "AI"
tags: ["ai", "rag", "agentic-rag"]
skills: []
related_projects: []
related_blogs: ["rag", "vectorless-rag", "long-context-vs-rag"]
open_questions: []
---

## 1. Agentic RAG란?

**Agentic RAG**는 언제, 무엇을, 어떤 도구로 검색할지를 LLM이 스스로 결정하며 검색과 추론을 반복하는 [RAG](/blog/rag)입니다. 검색 단계가 파이프라인에 고정되어 있지 않고, LLM이 도구를 호출하는 루프 안에서 필요할 때마다 검색합니다.

```text
[고정 파이프라인 RAG]
질문 ──> 검색 (1회, 고정) ──> 프롬프트에 붙이기 ──> 생성 ──> 끝

[Agentic RAG]
질문 ──> LLM ──> "grep으로 찾아보자" ──> 결과
          ▲                                │
          └──── "부족하다. 이 파일을 읽자" ◀─┘
          ▲                                │
          └──── "충분하다" ──> 답변 ──> 끝
```

조사 업무에 비유하면 이렇습니다.

| 구분 | 비유 | 시스템 |
|---|---|---|
| 고정 파이프라인 RAG | 비서가 질문을 듣자마자 **검색어 하나로 자료 5장을 출력**해 책상에 놓고 간다. 맞든 틀리든 그걸로 답한다 | 질문 임베딩 → Top-5 청크 → 생성 |
| Agentic RAG | 조사원이 **직접 자료실을 오가며** 찾아보고, 부족하면 다른 서가도 보고, 사내 DB도 조회하고, 충분하다 싶을 때 보고서를 쓴다 | LLM이 도구를 골라 반복 호출 → 자기 평가 → 생성 |

Anthropic은 에이전트를 "LLM이 루프 안에서 자율적으로 도구를 사용하는 것"에 가깝게 정의합니다. Agentic RAG는 그 도구 중 상당수가 검색 도구인 경우입니다.

## 2. 왜 필요할까?

### 2-1. 고정 파이프라인의 한계

| 한계 | 예시 |
|---|---|
| 검색은 한 번뿐이다 | "A사와 B사 중 매출 성장률이 높은 쪽의 CEO는?" → A사, B사 매출을 각각 찾고, 비교한 뒤, CEO를 다시 찾아야 한다 (다단계) |
| 검색 도구가 하나뿐이다 | 문서는 벡터 DB에, 주문 데이터는 SQL DB에, 최신 뉴스는 웹에 있다 |
| 검색이 실패해도 모른다 | Top-5가 전부 엉뚱해도 그대로 프롬프트에 들어가 환각이 생긴다 |
| 검색이 필요 없어도 한다 | "고마워요"에도 벡터 검색을 돌린다 |

### 2-2. 에이전트 루프가 주는 것

```text
고정 파이프라인이 미리 정해 둔 것         에이전트가 실행 중에 정하는 것
───────────────────────────────          ───────────────────────────────
검색 여부: 항상                          검색할지 말지
검색 횟수: 1회                           몇 번 검색할지
검색 도구: 벡터 DB                       grep / SQL / 웹 / 벡터 중 무엇을 쓸지
검색어: 사용자 질문 그대로               질문을 쪼개고 바꿔 쓴 검색어
결과 검증: 없음                          결과가 충분한지 스스로 판단
```

## 3. 고정 파이프라인 vs 에이전트 루프

| 항목 | 고정 파이프라인 RAG | Agentic RAG |
|---|---|---|
| 흐름 제어 | 코드가 정한다 | LLM이 정한다 |
| 검색 횟수 | 보통 1회 | 0~N회 |
| 도구 | 대개 하나 (벡터 검색) | 여러 개 중 선택 |
| 다단계 질문 | 약함 | 강함 |
| 검색 실패 대응 | 없음 (또는 코드로 미리 짠 재시도) | 다른 검색어/도구로 재시도 |
| LLM 호출 수 | 1회 | 여러 번 |
| 지연/비용 | 낮고 예측 가능 | 높고 질문마다 다름 |
| 디버깅 | 쉬움 | 어려움 (경로가 매번 다름) |

> 둘 사이에는 중간 형태도 많습니다. 예를 들어 "검색 → 결과 평가 → 부족하면 웹 검색" 같은 분기를 코드로 고정한 워크플로우는 LLM이 판단을 하긴 하지만 흐름은 코드가 쥡니다. 4장의 CRAG가 이런 형태에 가깝습니다.

## 4. 대표 연구: Self-RAG와 Corrective RAG

### 4-1. Self-RAG (2023)

**Self-RAG**(Asai 외, 2023)는 모델이 스스로 검색 여부를 정하고, 검색 결과와 자기 답을 비평하도록 학습시키는 방법입니다. 이를 위해 **반성 토큰(Reflection Token)**이라는 특수 토큰을 씁니다.

| 반성 토큰 | 모델이 스스로 묻는 질문 |
|---|---|
| Retrieve | 지금 검색이 필요한가? |
| IsRel | 검색된 문단이 질문과 관련 있는가? |
| IsSup | 내가 쓴 문장이 검색된 문단으로 뒷받침되는가? |
| IsUse | 전체 답변이 유용한가? |

```text
질문 ──> [Retrieve=예] ──> 문단 여러 개 검색
         각 문단으로 후보 답 생성 ──> [IsRel][IsSup][IsUse]로 채점
         ──> 가장 점수 높은 후보 선택
```

Self-RAG는 모델 자체를 미세 조정해 이 토큰을 생성하게 합니다. 실무에서는 미세 조정 없이 "검색이 필요한가?", "근거로 뒷받침되는가?"를 프롬프트로 물어보는 식으로 아이디어만 빌려 쓰는 경우가 많습니다.

### 4-2. Corrective RAG, CRAG (2024)

**CRAG**(Yan 외, 2024)는 검색 결과가 틀렸을 때를 대비하는 방법입니다. 가벼운 **검색 평가기(Retrieval Evaluator)**가 검색 문서의 품질을 판단하고, 결과에 따라 다른 행동을 합니다.

```text
질문 ──> 검색 ──> 검색 평가기 (논문에서는 미세 조정한 T5)
                     │
       ┌─────────────┼──────────────┐
       ▼             ▼              ▼
    Correct      Ambiguous       Incorrect
  문서를 정제    정제한 문서      문서를 버리고
  (핵심만 추림)  + 웹 검색 결합   웹 검색으로 대체
       └─────────────┼──────────────┘
                     ▼
                   생성
```

문서를 잘게 나눠 관련 없는 부분을 걸러내는 **분해 후 재조합(Decompose-then-Recompose)** 단계도 포함됩니다. 논문은 CRAG를 기존 RAG에 끼워 넣을 수 있는 플러그 앤 플레이 방식이라고 설명합니다.

### 4-3. 비교

| 항목 | Self-RAG | CRAG | 범용 에이전트 루프 |
|---|---|---|---|
| 핵심 아이디어 | 모델이 검색 필요성과 결과를 스스로 비평 | 검색 품질을 평가해 교정 행동 | LLM이 도구를 골라 반복 |
| 흐름 | 모델 내부 (특수 토큰) | 코드로 정한 분기 | LLM이 자유롭게 |
| 학습 필요 | 예 (모델 미세 조정) | 평가기만 학습 | 아니오 (프롬프트 + 도구) |
| 자기 평가 | 반성 토큰 | 검색 평가기 | LLM이 "충분한가?" 판단 |

> 세 방법은 모두 "방금 검색한 것으로 충분한가, 아니면 더 찾아야 하나?"라는 같은 질문에 답합니다.

## 5. 도구 상자: LLM이 고르는 검색 도구

### 5-1. 대표 도구

| 도구 | 잘 찾는 것 | 예시 질문 |
|---|---|---|
| **grep** (정규식 검색) | 정확한 문자열, 함수명, 에러 코드 | "`ERR_TIMEOUT_42`가 어디서 발생하나?" |
| **glob** (파일 이름 패턴) | 파일 위치, 구조 | "결제 관련 테스트 파일은?" |
| **파일 읽기** | 특정 파일의 전체 맥락 | "이 설정 파일의 기본값은?" |
| **웹 검색** | 최신 정보, 외부 지식 | "이 라이브러리 최신 버전의 변경점은?" |
| **SQL** | 정형 데이터, 집계 | "지난달 환불률은?" |
| **벡터 검색** | 표현이 다른 의미 검색 | "사용자 인증 흐름을 설명한 문서는?" |
| **트리/목차 탐색** | 긴 구조화 문서의 특정 절 | "사업보고서의 위험 요인은?" |

Agentic RAG에서 벡터 검색은 여러 도구 중 하나로 남고, 쓸지 말지는 LLM이 정합니다.

### 5-2. 도구 설명이 곧 라우팅 규칙

LLM은 도구 이름과 설명을 보고 도구를 고르므로, 설명을 잘 써야 합니다.

```text
(X) "search: 검색합니다"
(O) "grep: 저장소 파일에서 정규식과 일치하는 줄을 찾는다.
     함수명, 클래스명, 에러 메시지처럼 정확한 문자열을 알 때 쓴다.
     결과는 '경로:줄번호: 내용' 형식이며 최대 50줄."
```

## 6. 사례: 코딩 에이전트의 에이전틱 검색

### 6-1. Claude Code는 왜 벡터 인덱스를 쓰지 않을까?

Claude Code를 만든 Boris Cherny는 X(트위터)에서 초기 Claude Code는 RAG와 로컬 벡터 DB를 썼지만, 에이전틱 검색이 대체로 더 잘 동작한다는 것을 금방 알게 되었다고 밝혔습니다. 함께 언급된 이유는 다음과 같습니다.

| 이유 | 설명 |
|---|---|
| 더 단순하다 | 임베딩 생성, 인덱스 저장, 동기화 파이프라인이 필요 없다 |
| 인덱스가 낡지 않는다 (Staleness) | 코드는 계속 바뀐다. 벡터 인덱스는 갱신 전까지 옛 코드를 가리킨다. grep은 항상 현재 파일을 본다 |
| 보안과 프라이버시 | 코드를 임베딩해 별도 저장소에 보관할 필요가 없다 |

Anthropic의 컨텍스트 엔지니어링 글도 같은 방향을 설명합니다. 모든 데이터를 미리 넣는 대신, 에이전트가 파일 경로 같은 가벼운 식별자만 들고 있다가 필요할 때 도구로 불러오는 "Just-in-time" 방식을 소개하며, Claude Code에서 `CLAUDE.md`는 처음에 넣고 나머지는 glob과 grep으로 그때그때 찾는 예를 듭니다.

### 6-2. 코드가 에이전틱 검색에 잘 맞는 이유

```text
코드베이스의 성질                      grep/glob이 이용하는 것
──────────────────────────           ──────────────────────────
식별자가 정확한 문자열이다       →    함수명 grep 한 번이면 정의와 호출부가 다 나온다
파일 경로 자체가 의미를 가진다   →    src/payment/refund.ts 이름만으로 위치 추론
import로 서로 연결되어 있다      →    import를 따라 다음 파일을 연다
매 순간 바뀐다                   →    인덱스 없이 현재 상태를 직접 읽는다
```

### 6-3. 에이전틱 검색 흐름 예시

```text
사용자: "환불 금액이 음수로 저장되는 버그를 찾아줘"

1. grep "refund" --type ts           → 파일 12개
2. glob "**/refund*.ts"              → src/payment/refund.service.ts 외 2개
3. read src/payment/refund.service.ts → calculateRefund() 발견
4. grep "calculateRefund"            → 호출부 3곳
5. read src/order/cancel.ts          → 할인 금액을 두 번 빼는 부분 발견
6. "충분하다" → 원인 설명 + 수정 제안
```

벡터 검색 한 번으로는 1~5 같은 연쇄적인 추적이 어렵습니다.

> 이 방식이 모든 경우에 이기는 것은 아닙니다. 코드가 아닌 자연어 문서, "인증 흐름 같은 것" 같은 모호한 개념 검색, 초대형 코드베이스에서는 의미 검색이 도움이 된다는 주장도 계속 나옵니다. 도구 상자에 벡터 검색을 하나 넣어 두고 LLM이 고르게 하는 것도 방법입니다.

## 7. tool-use 루프 코드 예시

Anthropic Python SDK로 만든 최소한의 Agentic RAG 루프입니다. 도구는 `grep`과 `read_file` 두 개입니다.

```python
import subprocess
from pathlib import Path
import anthropic

client = anthropic.Anthropic()
MODEL = "claude-opus-5-5"
ROOT = Path("./docs").resolve()
MAX_TURNS = 8          # 가드레일: 최대 루프 횟수
MAX_OUTPUT = 4000      # 가드레일: 도구 결과 최대 길이(문자)

TOOLS = [
    {
        "name": "grep",
        "description": "docs 폴더에서 정규식과 일치하는 줄을 찾는다. "
                       "정확한 단어, 조항 번호, 에러 코드를 알 때 쓴다. '경로:줄번호:내용' 형식.",
        "input_schema": {
            "type": "object",
            "properties": {"pattern": {"type": "string"}},
            "required": ["pattern"],
        },
    },
    {
        "name": "read_file",
        "description": "docs 폴더 안 파일 하나의 내용을 읽는다. grep으로 위치를 찾은 뒤 맥락이 필요할 때 쓴다.",
        "input_schema": {
            "type": "object",
            "properties": {"path": {"type": "string"}},
            "required": ["path"],
        },
    },
]


def run_tool(name: str, args: dict) -> str:
    if name == "grep":
        r = subprocess.run(
            ["grep", "-rn", "-E", "--", args["pattern"], str(ROOT)],
            capture_output=True, text=True, timeout=10,
        )
        out = r.stdout or "(결과 없음)"
    elif name == "read_file":
        p = (ROOT / args["path"]).resolve()
        if not p.is_relative_to(ROOT):          # 가드레일: docs 밖 접근 차단
            return "오류: 허용되지 않은 경로"
        out = p.read_text(encoding="utf-8") if p.is_file() else "오류: 파일 없음"
    else:
        out = f"오류: 알 수 없는 도구 {name}"
    return out[:MAX_OUTPUT]


def agentic_rag(question: str) -> str:
    messages = [{"role": "user", "content": question}]
    system = ("docs 폴더의 문서만 근거로 답한다. 필요한 만큼 도구로 찾아보고, "
              "근거가 충분하면 파일 경로를 인용해 답한다. 찾을 수 없으면 모른다고 답한다.")

    for _ in range(MAX_TURNS):
        resp = client.messages.create(
            model=MODEL, max_tokens=2048, system=system,
            tools=TOOLS, messages=messages,
        )
        messages.append({"role": "assistant", "content": resp.content})

        if resp.stop_reason != "tool_use":      # LLM이 "충분하다"고 판단
            return "".join(b.text for b in resp.content if b.type == "text")

        results = [
            {"type": "tool_result", "tool_use_id": b.id, "content": run_tool(b.name, b.input)}
            for b in resp.content if b.type == "tool_use"
        ]
        messages.append({"role": "user", "content": results})

    return "검색 횟수 한도에 도달했습니다. 질문을 더 구체적으로 해 주세요."


if __name__ == "__main__":
    print(agentic_rag("환불 규정에서 '청약 철회' 기한은 며칠인가요?"))
```

흐름을 정리하면 다음과 같습니다.

| 단계 | 코드 | 의미 |
|---|---|---|
| 1 | `messages.create(tools=...)` | LLM에게 질문과 사용 가능한 도구 목록을 준다 |
| 2 | `stop_reason == "tool_use"` | LLM이 도구 호출을 요청했다 → 실행한다 |
| 3 | `tool_result`를 user 메시지로 추가 | 결과를 돌려주고 다시 판단하게 한다 |
| 4 | `stop_reason != "tool_use"` | LLM이 더 찾을 필요가 없다고 판단 → 답변 반환 |
| 5 | `MAX_TURNS` 초과 | 무한 루프 방지 |

> SDK에는 이런 루프를 대신 돌려주는 도구 실행기도 있지만, 학습 목적이라면 위처럼 직접 짜 보는 편이 구조를 이해하기 좋습니다.

## 8. 비용, 지연, 무한 루프 위험

### 8-1. 무엇이 문제인가

```text
고정 RAG:     LLM 1회  ─────────────────────────────> 답변
Agentic RAG:  LLM ─ 도구 ─ LLM ─ 도구 ─ LLM ─ 도구 ─ LLM ─> 답변
              (호출마다 지금까지의 대화 전체가 다시 입력으로 들어간다)
```

| 위험 | 원인 |
|---|---|
| **비용 증가** | 루프가 돌 때마다 누적된 대화 + 도구 결과가 다시 입력 토큰이 된다. 후반 호출일수록 비싸다 |
| **지연 증가** | LLM 호출과 도구 실행이 순차적으로 쌓인다 |
| **무한/과잉 루프** | "조금 더 찾아보자"를 반복하거나, 같은 grep을 계속 호출한다 |
| **컨텍스트 폭발** | 큰 파일을 통째로 읽거나 grep 결과가 수천 줄이면 컨텍스트가 넘친다 |
| **예측 불가능성** | 같은 질문도 매번 경로와 비용이 다르다 |
| **도구 오남용** | 위험한 명령, 허용되지 않은 경로 접근, 프롬프트 인젝션이 담긴 문서를 지시로 착각 |

### 8-2. 가드레일

| 가드레일 | 방법 |
|---|---|
| 루프 상한 | `MAX_TURNS`, 총 토큰 예산, 총 시간 제한 |
| 도구 결과 자르기 | 결과 길이 상한, "결과가 잘렸으니 패턴을 좁혀라" 안내 |
| 중복 호출 감지 | 같은 도구 + 같은 인자를 반복하면 경고 메시지를 돌려준다 |
| 권한 최소화 | 읽기 전용 도구만 제공, 경로 화이트리스트, SQL은 읽기 전용 계정 |
| 종료 조건 명시 | 시스템 프롬프트에 "근거가 충분하면 멈춘다", "N번 찾아도 없으면 모른다고 답한다" |
| 도구 결과는 데이터 | 문서 안의 "이전 지시를 무시하라" 같은 문장을 지시로 따르지 않게 한다 |
| 프롬프트 캐싱 | 시스템 프롬프트와 도구 정의를 캐싱해 반복 호출 비용을 줄인다 |
| 관찰 가능성 | 매 턴의 도구 호출, 토큰 수, 소요 시간을 로그로 남긴다 |

```python
# 중복 호출 감지 예시
seen = set()

def guarded_run_tool(name, args):
    key = (name, tuple(sorted(args.items())))
    if key in seen:
        return "이미 같은 호출을 했습니다. 다른 검색어나 다른 도구를 시도하세요."
    seen.add(key)
    return run_tool(name, args)
```

## 9. 장점과 단점

| 장점 | 설명 |
|---|---|
| 다단계 질문 처리 | 찾은 결과를 보고 다음 검색을 정한다 |
| 여러 소스 통합 | 문서, DB, 웹, 코드를 한 루프에서 오간다 |
| 검색 실패에서 회복 | 결과가 부족하면 검색어나 도구를 바꾼다 |
| 인덱스 없이도 가능 | grep, 파일 읽기만으로 최신 상태를 바로 검색한다 |
| 불필요한 검색 생략 | 검색이 필요 없는 질문은 바로 답한다 |

| 단점 | 설명 |
|---|---|
| 비용과 지연 | LLM 호출이 여러 번이고 누적 컨텍스트가 커진다 |
| 예측 불가능 | 경로, 비용, 시간이 질문마다 다르다 |
| 디버깅과 평가가 어렵다 | 실패 원인이 도구인지, 판단인지, 프롬프트인지 추적해야 한다 |
| 모델 능력 의존 | 도구 선택과 종료 판단을 잘하는 모델이 필요하다 |
| 보안 표면 증가 | 도구가 많을수록 오남용 가능성이 커진다 |

### 9-1. 언제 쓰지 않는가

- 질문 유형이 단순하고 반복적이다: FAQ 챗봇. 고정 파이프라인 한 번이면 충분하고 싸다.
- 응답 지연이 엄격하다: 1초 안에 답해야 하는 서비스.
- 비용 예측이 중요하다: 질문당 비용 상한이 정해진 대량 트래픽.
- 검색 대상이 하나고 잘 동작한다: 이미 고정 RAG의 평가 점수가 충분하다면 복잡도를 늘릴 이유가 없다.

> 먼저 고정 파이프라인을 만들고 평가한 뒤, 다단계 질문이나 검색 실패가 실제로 문제일 때 에이전트 루프로 옮기는 순서를 권합니다.

### 9-2. Vectorless RAG와의 관계

| 관점 | Vectorless RAG | Agentic RAG |
|---|---|---|
| 중심 질문 | 인덱스를 **어떤 구조**로 만들까? (목차 트리, 키워드) | 검색을 **누가, 언제, 몇 번** 할까? (도구 호출 루프) |
| 핵심 산출물 | 트리 인덱스 | 도구 목록 + 루프 |
| 겹치는 부분 | 트리 탐색을 도구로 만들면 에이전트 루프 안에서 쓸 수 있다 | grep 기반 에이전틱 검색은 벡터를 쓰지 않으므로 vectorless 이기도 하다 |

## 10. 참고 자료

- Asai et al., Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection (2023): https://arxiv.org/abs/2310.11511
- Yan et al., Corrective Retrieval Augmented Generation (2024): https://arxiv.org/abs/2401.15884
- Singh et al., Agentic Retrieval-Augmented Generation: A Survey on Agentic RAG (2025): https://arxiv.org/abs/2501.09136
- Anthropic, Building effective agents: https://www.anthropic.com/engineering/building-effective-agents
- Anthropic, Effective context engineering for AI agents: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Claude API 문서, Tool use: https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview
- The Pragmatic Engineer, Building Claude Code with Boris Cherny: https://newsletter.pragmaticengineer.com/p/building-claude-code-with-boris-cherny
- Settling the RAG Debate: Why Claude Code Dropped Vector DB-Based RAG: https://smartscope.blog/en/ai-development/practices/rag-debate-agentic-search-code-exploration/

기준일: 2026-10-03

## 11. 핵심 정리

> Agentic RAG는 검색을 파이프라인에 고정하지 않고, LLM이 도구 호출 루프 안에서 검색 여부·도구·검색어·횟수를 스스로 정하는 RAG다. grep, glob, 파일 읽기, 웹 검색, SQL, 벡터 검색이 모두 도구 상자의 한 칸이 되고, LLM은 결과를 보고 "충분한가?"를 판단하며 반복한다. Self-RAG는 반성 토큰으로 검색 필요성과 근거 여부를 모델이 스스로 비평하게 했고, CRAG는 검색 평가기로 결과 품질을 판정해 정제하거나 웹 검색으로 교정한다. Claude Code가 초기의 로컬 벡터 DB 대신 grep/glob 기반 에이전틱 검색을 택한 것처럼, 계속 바뀌는 코드베이스에서는 인덱스 없는 반복 검색이 단순하고 최신성에서 유리하다. 대신 호출이 여러 번이라 비용·지연이 크고 무한 루프 위험이 있으므로 루프 상한, 결과 길이 제한, 중복 호출 감지, 최소 권한 같은 가드레일이 필수다.
