---
type: "blog"
id: "hindsight"
title: "Hindsight"
summary: "AI 에이전트가 대화와 문서를 \"저장했다가 다시 찾는\" 수준을 넘어, 쌓인 기억을 사실·믿음·정리된 문서로 다듬어 시간이 지날수록 더 잘 알게 만드는 오픈소스 에이전트 메모리 서버입니다."
created_at: "2026-09-29"
updated_at: "2026-09-29"
published: true
category: "AI 도구"
tags: []
skills: []
related_projects: []
related_blogs: []
open_questions: []
---

## 개요

> AI 에이전트가 대화와 문서를 "저장했다가 다시 찾는" 수준을 넘어, 쌓인 기억을 사실·믿음·정리된 문서로 다듬어 시간이 지날수록 더 잘 알게 만드는 오픈소스 에이전트 메모리 서버입니다.

## 30초 요약

| 항목 | 내용 |
|---|---|
| 무엇인가? | PostgreSQL 위에서 동작하는 에이전트 전용 메모리 서버. `retain`(저장)·`recall`(검색)·`reflect`(추론) 세 연산을 HTTP API, SDK, MCP로 제공 |
| 왜 사용하는가? | 세션이 끝나면 모든 것을 잊는 에이전트에 사용자·프로젝트·업무에 대한 장기 기억을 붙이기 위해 |
| 해결하는 문제 | 단순 벡터 검색으로는 풀기 어려운 시간 질의("지난봄에"), 여러 사실을 잇는 질의, 바뀐 사실 반영, 기억 중복 누적 |
| 주요 사용처 | 사용자별 개인화 챗봇, 고객 상담 에이전트, 코딩 에이전트의 프로젝트 기억, 업무 자동화 에이전트 |
| 핵심 개념 | Memory Bank, World·Experience fact, Observation, Mental Model, Knowledge Page, Retain·Recall·Reflect |
| Client 사용 | △ (브라우저에서 직접 쓰지 않음. 개발자 PC의 코딩 에이전트·MCP 클라이언트에서 사용) |
| Server 사용 | O (독립 서버로 띄우고 애플리케이션 백엔드가 SDK로 호출) |
| 대표 대안 | 직접 구현한 RAG(pgvector 등), Mem0, Zep(Graphiti), Letta, LangGraph 장기 메모리 |

- **대화를 저장하지 않고 사실을 저장한다**: LLM이 입력에서 사실·시간·엔티티·관계를 뽑아 구조화된 기억으로 바꿉니다.
- **네 갈래 검색을 합친다**: 의미(벡터), 키워드(BM25), 그래프(엔티티 연결), 시간 범위 검색을 동시에 돌려 순위를 합칩니다.
- **기억이 스스로 정리된다**: 백그라운드에서 비슷한 사실을 근거가 달린 Observation으로 통합하고, 새 증거가 오면 덮어쓰지 않고 다듬습니다.
- **답을 미리 써 둔다**: 자주 묻는 질문은 Mental Model·Knowledge Page로 만들어 두면 읽기는 DB 조회 한 번으로 끝납니다.
- **어디에나 붙인다**: Python·TypeScript·Go SDK, 내장 MCP 엔드포인트, LLM 클라이언트 래퍼, 60개 이상의 통합을 제공합니다.

---

## 어떤 라이브러리인가?

AI 상담 챗봇을 하나 운영한다고 생각해 보겠습니다. 사용자는 이런 말을 기대합니다.

- "지난번에 말씀드린 그 환불 건 어떻게 됐어요?"
- "저 원래 iOS 앱 쓰다가 지금은 웹으로 옮겼다고 했잖아요."
- "제가 3월에 무슨 문의를 했었죠?"

LLM은 대화 창 안의 내용만 알고, 세션이 끝나면 모두 잊습니다. 그래서 개발자는 보통 대화 기록을 DB에 쌓아 두고, 질문이 오면 벡터 검색으로 비슷한 조각을 찾아 프롬프트에 넣습니다. Hindsight는 **이 "기억 계층"을 통째로 대신 맡는 서버**입니다.

기술적으로 정의하면, Hindsight는 **Vectorize가 만든 MIT 라이선스의 에이전트 메모리 시스템**입니다. Python으로 작성된 API 서버(`hindsight-api`)가 PostgreSQL(+ pgvector 등 벡터 확장)에 기억을 저장하고, 웹 UI(Control Plane), CLI, 클라이언트 SDK, MCP 엔드포인트가 이 서버에 붙습니다. 저장할 때 LLM이 사실을 추출하고, 검색할 때는 여러 전략을 병렬로 실행해 합치며, 백그라운드 워커가 기억을 계속 정리합니다.

README가 스스로 밝히는 방향은 한 문장입니다.

> Hindsight is focused on making agents that learn, not just remember.

"기억만 하는 에이전트"가 아니라 "배우는 에이전트"를 만든다는 뜻입니다. 같은 사용자가 "React가 좋다"고 했다가 몇 주 뒤 "Vue로 옮겼다"고 하면, 두 문장을 따로 쌓아 두는 대신 "React를 좋아했지만 지금은 Vue로 옮겼다"는 하나의 믿음으로 갱신하는 식입니다.

설계 배경은 논문 "Hindsight is 20/20: Building Agent Memory that Retains, Recalls, and Reflects"(arXiv 2512.12818, 2025년 12월)에 정리되어 있습니다. 논문은 기존 메모리 시스템이 "근거(evidence)와 추론(inference)의 경계를 흐린다"고 지적하고, 기억을 세상에 대한 사실·에이전트의 경험·엔티티 요약·변하는 믿음으로 나눠 다루는 구조를 제안합니다.

### 주요 사용 사례

- **사용자별 개인화**: 사용자마다 bank를 두고 선호, 이력, 문의 내용을 기억해 다음 대화에 반영합니다.
- **상담·영업 에이전트**: 고객의 과거 문의와 상태 변화를 추적하고, `reflect`로 "이 고객에게 지금 무엇을 제안해야 하나"를 근거와 함께 답합니다.
- **코딩 에이전트의 프로젝트 기억**: 저장소마다 bank를 만들고 git 이력과 과거 세션에서 "왜 이렇게 결정했는지"를 기억해 새 세션에 넣어 줍니다.
- **팀 지식 문서화**: Knowledge Page로 "이 서비스의 구성 요소", "에러 처리 규칙" 같은 문서를 기억에서 자동으로 써 두고 계속 갱신합니다.
- **기존 에이전트에 끼워 넣기**: OpenAI·Anthropic SDK 래퍼, LangGraph·CrewAI·Vercel AI SDK 같은 프레임워크 통합, MCP로 코드 변경을 최소화해 붙입니다.

주요 용어는 [핵심 개념과 동작 구조](#h-hindsight-핵심-개념과-동작-구조)에서 자세히 다룹니다.

---

## 어떤 문제를 해결하는가?

```text
요구사항: 에이전트가 여러 세션에 걸쳐 사용자와 업무를 기억하고, 바뀐 사실까지 반영해 답하게 하고 싶다
 ↓
일반적인 구현: 대화 원문을 청크로 잘라 벡터 DB에 넣고, 질문과 비슷한 top-k 청크를 프롬프트에 붙인다
 ↓
문제 발생: 시간 질의·여러 사실을 잇는 질의에 약하고, 옛 사실과 새 사실이 함께 나오며, 중복이 계속 쌓인다
 ↓
Hindsight로 해결: 저장 시 사실을 구조화하고, 네 갈래 검색을 합치고, 백그라운드에서 믿음을 통합·갱신한다
```

### 상황 예시

온라인 쇼핑몰의 상담 챗봇이 사용자 "민지"와 몇 달 동안 대화했습니다.

- 3월: "iOS 앱에서 결제가 자꾸 실패해요."
- 4월: "연간 구독으로 바꿨어요."
- 6월: "이제 앱 안 쓰고 웹으로만 들어와요."
- 9월: "지난봄에 제가 문의했던 결제 문제 해결됐나요?"

9월 질문에 제대로 답하려면 "지난봄"을 3~5월로 해석하고, 그 기간의 결제 문의를 찾고, 지금은 웹만 쓴다는 최신 상태까지 알아야 합니다.

### 일반적인 구현 방식

```ts
// 흔히 쓰는 "대화 로그 + 벡터 검색" 방식
import OpenAI from 'openai';
import { sql } from './db'; // pgvector가 설치된 PostgreSQL

const openai = new OpenAI();

async function embed(text: string) {
  const res = await openai.embeddings.create({ model: 'text-embedding-3-small', input: text });
  return res.data[0].embedding;
}

// 저장: 메시지를 그대로 임베딩해서 넣는다
export async function saveMessage(userId: string, text: string) {
  const vector = await embed(text);
  await sql`insert into memories (user_id, text, embedding, created_at)
            values (${userId}, ${text}, ${JSON.stringify(vector)}, now())`;
}

// 검색: 질문과 코사인 거리가 가까운 5개를 가져온다
export async function searchMemories(userId: string, query: string) {
  const vector = await embed(query);
  return sql`select text from memories
             where user_id = ${userId}
             order by embedding <=> ${JSON.stringify(vector)}
             limit 5`;
}
```

### 이 방식에서 발생하는 문제

- **시간을 모릅니다**: "지난봄"은 벡터 공간에서 "봄"이라는 단어와 비슷한 문장을 찾을 뿐, 3~5월이라는 날짜 범위로 해석되지 않습니다.
- **연결된 사실을 못 찾습니다**: "민지가 겪은 문제"를 물으면 "민지"가 들어간 문장은 찾지만, "iOS 앱 결제 모듈 장애"처럼 민지라는 단어가 없는 관련 사실은 놓칩니다.
- **옛 사실과 새 사실이 섞입니다**: "iOS 앱 사용"과 "이제 웹만 사용"이 둘 다 비슷한 점수로 나와서 LLM이 어느 쪽이 최신인지 판단해야 합니다.
- **중복이 쌓입니다**: 같은 선호를 열 번 말하면 열 개의 비슷한 행이 생기고, top-5 자리를 같은 내용이 차지합니다.
- **고유명사·코드에 약합니다**: 주문번호, 에러 코드 같은 문자열은 임베딩이 뭉개기 쉬워 키워드 검색을 따로 붙여야 합니다.
- **"몇 개"를 가져올지 정하기 어렵습니다**: 에이전트는 컨텍스트를 토큰 단위로 쓰는데, top-k는 결과 개수 기준입니다.

### Hindsight를 사용하면

같은 요구사항이 세 번의 호출로 바뀝니다. 설치와 호출 방법은 [설치와 첫 사용](#h-hindsight-설치와-첫-사용)에서 다룹니다.

- 대화를 `retain`하면 LLM이 "민지는 2026년 3월 iOS 앱 결제 실패를 문의했다" 같은 사실과 날짜, 엔티티(민지, iOS 앱, 결제)를 뽑아 저장합니다.
- `recall("지난봄에 문의한 결제 문제")`는 "지난봄"을 날짜 범위로 바꾸고, 의미·키워드·그래프·시간 검색을 합친 뒤 지정한 토큰 예산만큼 돌려줍니다.
- 백그라운드 통합이 "민지는 예전에 iOS 앱을 썼지만 지금은 웹만 쓴다"는 Observation을 만들어, 옛 사실과 새 사실을 하나의 믿음으로 정리합니다.
- `reflect`를 쓰면 에이전트 루프가 필요한 기억을 스스로 찾아 근거가 달린 답을 만듭니다.

> **핵심:** 사실 추출, 시간 해석, 다중 검색 결합, 중복 통합, 믿음 갱신을 개발자가 직접 구현하는 대신, Hindsight가 **retain·recall·reflect 세 API 뒤에서 처리**해 줍니다.

---

## 왜 주목받고 있는가?

Hindsight는 2025년 10월 공개 이후 GitHub Star 약 4.5만 개, Fork 약 5,900개를 기록했습니다(2026년 10월 기준). 2026년 9월에는 일주일 사이 Star가 수천 개씩 늘 정도로 관심이 몰렸습니다.

**에이전트의 병목이 "기억"으로 옮겨 갔습니다.** 모델의 단발성 답변 품질은 충분히 올라왔지만, 여러 세션에 걸쳐 같은 사용자·같은 프로젝트를 이어서 다루는 능력은 여전히 약합니다. 장기 실행 에이전트, 개인 비서, 코딩 에이전트가 늘면서 "세션 밖에 무엇을 어떻게 남길 것인가"가 실제 제품 문제가 되었습니다.

**벤치마크 결과가 구체적입니다.** 논문은 오픈소스 20B 모델 기준으로 같은 모델에 전체 대화를 다 넣는 방식(39%)보다 정확도를 83.6%까지 올렸고, 더 큰 모델에서는 LongMemEval 91.4%, LoCoMo 89.61%를 보고합니다. README는 이 결과를 Virginia Tech 연구진과 The Washington Post가 독립적으로 재현했고, 다른 시스템의 점수는 각 벤더가 자체 보고한 값이라고 밝힙니다.

**"검색"이 아니라 "학습"을 전면에 둡니다.** Observation 통합, Mental Model 자동 갱신, Knowledge Page처럼 기억을 계속 정리하고 문서로 만드는 기능이 핵심에 있습니다. 대부분의 메모리 도구가 "잘 찾아 주기"에 집중하는 것과 방향이 다릅니다.

**붙이는 비용이 낮습니다.** Docker 이미지 하나로 서버와 UI가 뜨고, OpenAI·Anthropic 클라이언트를 래퍼로 감싸면 호출 전후로 기억 검색과 저장이 자동으로 일어납니다. 코딩 에이전트용 패키지는 명령 한 줄로 Claude Code, Codex, Cursor CLI 등 여러 에이전트에 연결됩니다.

**개발 속도가 매우 빠릅니다.** 2026년 7월 이후 1~3주 간격으로 릴리스가 나오고 있고, 최신 버전은 v0.10.2(2026년 9월 29일)입니다. 열린 PR 대부분이 메인테이너의 수정이며, 문서의 모든 코드 예시를 실제로 실행되는 테스트 스니펫에서 가져오도록 바꾸는 등 문서 품질에도 투자하고 있습니다.

RAG나 다른 메모리 도구와의 항목별 차이는 [장단점과 대안 비교](#h-hindsight-장단점과-대안-비교)에 정리했습니다.

---

## 언제 사용하면 좋은가?

- **같은 사용자와 여러 번, 오래 대화하는 제품**: 개인 비서, 상담 챗봇, 튜터처럼 "지난번에 말한 것"이 품질을 좌우하는 경우입니다. 사용자별 bank 하나로 격리와 개인화를 함께 얻습니다.
- **사실이 시간에 따라 바뀌는 도메인**: 고객의 요금제, 프로젝트 상태, 담당자처럼 최신 상태와 이력이 모두 중요한 정보는 Observation의 "덮어쓰지 않고 다듬는" 갱신 방식이 잘 맞습니다.
- **"언제", "누가", "왜"를 묻는 질의가 많은 경우**: 시간 범위 검색과 엔티티 그래프가 단순 벡터 검색과의 차이를 가장 크게 만드는 영역입니다.
- **코딩 에이전트를 여러 개 쓰는 팀**: 저장소 단위 bank를 Claude Code, Codex, Cursor가 함께 쓰므로 어떤 에이전트로 작업해도 같은 프로젝트 기억이 이어집니다.
- **메모리 계층을 직접 만들 여력이 없는 경우**: 사실 추출, 엔티티 정규화, 하이브리드 검색, 재순위화, 중복 통합을 직접 구현하면 몇 주가 걸리는 작업입니다.

---

## 언제 사용하지 않는 것이 좋은가?

- **정적인 문서 Q&A**: 사내 규정집, 제품 매뉴얼처럼 바뀌지 않는 문서에서 답을 찾는 것이 전부라면 일반 RAG가 더 단순하고 저렴합니다. 공식 문서도 이런 경우에는 RAG를 권합니다.
  > 예: 200쪽짜리 API 문서에 대한 검색 챗봇은 청크 분할 + 벡터 검색으로 충분합니다. 문서마다 LLM으로 사실을 추출하는 비용을 낼 이유가 없습니다.
- **단순한 워크플로 자동화**: README도 n8n 같은 단순 워크플로에는 과할 수 있다고 직접 적습니다.
  > 예: "슬랙 메시지를 요약해서 노션에 올리기"는 기억이 필요 없습니다.
- **쓰기 비용과 지연에 민감한 경우**: 모든 `retain`이 LLM 호출을 동반하고 백그라운드 통합도 LLM을 씁니다. 초당 수천 건의 이벤트 로그를 모두 기억으로 넣는 용도에는 맞지 않습니다.
- **대화 한 번 안에서만 맥락이 필요한 경우**: 세션이 끝나면 버려도 되는 정보라면 대화 기록을 그대로 프롬프트에 두는 것이 가장 정확하고 단순합니다.
- **추가 인프라를 둘 수 없는 환경**: 운영에서는 PostgreSQL(벡터 확장 포함), API 서버, 워커, LLM 키, 필요하면 임베딩·리랭커 모델까지 관리해야 합니다. Hindsight Cloud를 쓰면 이 부담은 줄지만 외부 서비스에 데이터를 맡기게 됩니다.
- **결정적인(deterministic) 결과가 반드시 필요한 경우**: 사실 추출은 LLM 판단이라 같은 문서에서도 실행마다 결과가 조금 다를 수 있습니다. 감사 로그처럼 원문 그대로가 중요한 데이터는 원래 저장소에 두고, Hindsight에는 보조 기억만 넣습니다.

---

## 한눈에 정리

| 항목 | 내용 |
|---|---|
| 라이브러리 | Hindsight (`vectorize-io/hindsight`, PyPI `hindsight-api`·`hindsight-client`, npm `@vectorize-io/hindsight-client`) |
| 주요 목적 | 에이전트에 장기 기억을 붙이고, 기억을 믿음과 문서로 정리해 시간이 지날수록 더 잘 알게 만들기 |
| 해결하는 문제 | 시간·관계 질의에 약한 벡터 검색, 옛 사실과 새 사실의 충돌, 기억 중복 누적, 세션 간 맥락 손실 |
| 핵심 개념 | Bank, World·Experience fact, Observation, Mental Model, Knowledge Page, Retain·Recall·Reflect |
| 주요 사용처 | 개인화 챗봇, 상담·영업 에이전트, 코딩 에이전트 프로젝트 기억, 팀 지식 문서 |
| Client 활용 | 개발자 로컬의 코딩 에이전트 플러그인, MCP 클라이언트(Claude Code 등), Knowledge Page의 파일 마운트 |
| Server 활용 | 독립 메모리 서버(Docker·Helm·pip), 백엔드에서 SDK 호출, 사용자별 bank·태그 격리, 인증·모니터링 |
| 장점 | 구조화된 기억, 4중 검색과 재순위화, 자동 통합·갱신, 토큰 예산 기반 결과, 풍부한 통합 |
| 단점 | 쓰기마다 LLM 비용, 운영 인프라, 빠른 변경 속도, LLM 추출의 비결정성, 기본 인증 꺼짐 |
| 추천 상황 | 여러 세션에 걸친 사용자·프로젝트 기억, 변하는 사실, 시간·관계 질의가 많은 경우 |
| 비추천 상황 | 정적 문서 Q&A, 단순 워크플로, 대량 이벤트 로그 저장, 세션 안에서 끝나는 맥락 |
| 대표 대안 | 직접 구현한 RAG, Mem0, Zep(Graphiti), Letta, LangGraph 장기 메모리 |

---

## 핵심 정리

### 한 문장으로

> Hindsight는 에이전트가 세션마다 잊어버리는 사용자·업무 맥락을 **사실 추출 → 4중 검색 → 백그라운드 통합**으로 다뤄, 기억할 뿐 아니라 배우는 에이전트를 만들기 위한 메모리 서버입니다.

### 이것만 기억하기

1. **왜 사용하는가?**
   - 여러 세션에 걸쳐 같은 사용자·프로젝트를 다루는 에이전트에, 직접 만들기 어려운 구조화된 장기 기억을 붙이기 위해서입니다.

2. **어떤 문제를 해결하는가?**
   - 벡터 검색만으로는 약한 시간 질의와 관계 질의, 옛 사실과 새 사실의 충돌, 같은 기억의 중복 누적 문제입니다.

3. **어떻게 동작하는가?**
   - `retain`이 LLM으로 사실·시간·엔티티를 추출해 저장하고, `recall`이 네 가지 검색을 병렬로 돌려 RRF와 cross-encoder로 순위를 매기며, 백그라운드 워커가 Observation과 Mental Model을 계속 갱신합니다. `reflect`는 이 계층을 위에서부터 훑는 에이전트 루프입니다.

4. **실제 프로젝트에서는 어디에 사용하는가?**
   - 사용자별 bank를 둔 상담·개인화 챗봇, 저장소별 bank를 둔 코딩 에이전트, 팀 지식을 Knowledge Page로 정리하는 내부 도구에 씁니다.

5. **언제 사용하지 않는가?**
   - 정적 문서 Q&A, 단순 자동화, 쓰기량이 매우 많은 로그 저장, 한 세션 안에서 끝나는 맥락에는 과합니다.

6. **비슷한 기술과 가장 큰 차이는 무엇인가?**
   - 검색 품질만이 아니라 **기억을 스스로 정리하는 계층(Observation → Mental Model → Knowledge Page)** 이 기본으로 들어 있다는 점입니다. 그만큼 쓰기 비용이 들기 때문에 **무엇을 기억시킬지 고르는 것**이 Hindsight를 잘 쓰는 핵심입니다.

## Hindsight 핵심 개념과 동작 구조

> Hindsight를 이루는 Memory Bank, 기억의 네 가지 층(Fact·Observation·Mental Model·Knowledge Page), 세 연산(Retain·Recall·Reflect)이 각각 무엇이고 어떻게 맞물려 동작하는지 다룹니다.

### 용어 한눈에 보기

| 키워드 | 설명 |
|---|---|
| Memory Bank | 사용자·에이전트·프로젝트 하나에 대응하는 격리된 기억 저장소. bank 사이에는 기억이 섞이지 않음 |
| World fact | 바깥 세상에 대한 사실. "민지는 연간 구독 중이다" |
| Experience fact | bank 주인인 에이전트 자신이 한 일. "나는 민지에게 웹 결제를 안내했다" |
| Observation | 여러 사실을 백그라운드에서 통합한, 근거와 증거 개수(proof count)가 달린 믿음 |
| Mental Model | 개발자가 정한 질문에 대해 Hindsight가 써 두고 계속 고쳐 쓰는 "상시 답변" 문서 |
| Knowledge Page | 폴더 구조로 정리된 Mental Model. 위키처럼 탐색·검색하고 Markdown 파일로 내보낼 수 있음 |
| Retain | 기억 저장. LLM이 사실·시간·엔티티·관계를 추출 |
| Recall | 기억 검색. 네 가지 전략을 병렬 실행 후 순위 결합 |
| Reflect | 기억을 근거로 답을 만드는 에이전트 루프 |
| Tag | 한 bank 안에서 기억의 공개 범위를 나누는 라벨. `user:minji`, `team:cs` 등 |
| Disposition | reflect의 해석 성향. 회의감·문자 그대로 해석·공감을 1~5로 지정 |

---

### 1. Memory Bank (격리된 기억 저장소)

#### 쉽게 설명하면

사람마다 머릿속이 따로 있는 것처럼, bank는 "뇌 하나"입니다. 상담원 A의 기억이 상담원 B에게 새지 않듯이, 사용자 민지의 bank에 들어간 내용은 다른 사용자의 bank에서 검색되지 않습니다.

#### 개발 관점에서는

모든 API가 `bank_id`를 첫 인자로 받습니다. 처음 `retain`할 때 bank가 없으면 자동으로 만들어지므로, 사용자 ID를 그대로 bank ID로 쓰는 패턴이 가장 흔합니다. bank는 기억만이 아니라 설정도 가집니다.

- **retain 설정**: 무엇을 추출할지(`retain_mission`), 추출 모드(`concise`, `verbose`, `verbatim`, `chunks` 등)
- **통합 설정**: Observation을 어떤 기준으로 만들지(`observations_mission`), 자동 통합 여부
- **reflect 설정**: 정체성(`reflect_mission`), 반드시 지킬 규칙(Directive), 성향(Disposition)
- **검색 설정**: 키워드·시간·그래프 검색과 재순위화를 bank별로 끄고 켜기

설정은 "전역 환경 변수 → 테넌트 → bank" 순서로 덮어씁니다. 한 서버에서 bank마다 다른 정책을 둘 수 있다는 뜻입니다.

#### 예제

```ts
import { HindsightClient } from '@vectorize-io/hindsight-client';

const client = new HindsightClient({ baseUrl: 'http://localhost:8888' });

// bank 생성 또는 갱신: 이 bank가 무엇을 기억하고 어떻게 답할지 정한다
await client.createBank('user-minji', {
  retainMission: '결제, 구독, 사용 기기, 불편 사항을 중심으로 기억한다. 인사말은 무시한다.',
  reflectMission: '나는 쇼핑몰 상담 에이전트다. 고객의 이전 문의와 현재 상태를 근거로 답한다.',
});
```

`createBank`의 `mission`, `disposition` 옵션은 Deprecated입니다. 지금은 `reflectMission`을 쓰고, 성향은 `updateBankConfig({ dispositionSkepticism, ... })`로 지정합니다.

#### 핵심

> bank는 "누구의 기억인가"를 정하는 가장 강한 경계입니다. 섞이면 안 되는 단위(사용자, 고객사, 저장소)는 태그가 아니라 bank로 나눕니다.

### 2. Fact (World와 Experience)

#### 쉽게 설명하면

일기장에 "오늘 민지 씨가 연간 구독으로 바꿨다"(남에 대한 사실)와 "오늘 내가 민지 씨에게 할인 쿠폰을 보냈다"(내가 한 일)를 구분해서 적는 것과 같습니다.

#### 개발 관점에서는

`retain`에 넣은 텍스트는 원문 그대로 저장되지 않고, LLM이 다음을 뽑아 **fact** 단위로 저장합니다.

- 핵심 사실과 그 이유·감정 같은 맥락
- 엔티티(사람, 조직, 장소, 제품, 개념)와 엔티티 정규화("Alice", "Alice Chen"을 한 사람으로)
- 사실 사이의 연결: 같은 엔티티, 가까운 시간, 비슷한 의미, 원인과 결과
- 두 종류의 시간: **사건이 일어난 시점**과 **Hindsight가 그 사실을 알게 된 시점**

world와 experience를 가르는 기준은 문법이 아니라 **누가 말했는가**입니다. 사용자가 "저 테슬라 샀어요"라고 하면 그것은 에이전트의 경험이 아니라 사용자에 대한 world fact입니다. 그래서 `context`에 화자를 적어 주는 것이 중요합니다.

#### 예제

```ts
await client.retain(
  'user-minji',
  [
    '민지 (2026-03-12T10:02:00Z): iOS 앱에서 카드 결제가 계속 실패해요.',
    '상담봇 (2026-03-12T10:03:00Z): 웹에서 결제하시면 우회하실 수 있어요.',
  ].join('\n'),
  {
    context: '고객 민지와 상담봇의 대화. "상담봇"의 1인칭 발화만 에이전트 자신의 경험이다',
    timestamp: '2026-03-12T10:03:00Z',
    documentId: 'chat-2026-03-12-minji',
  },
);
```

메시지마다 `이름 (시각): 내용` 형식으로 적는 것은 공식 예제가 권하는 방식입니다. 이렇게 하면 LLM이 사실을 올바른 사람에게 붙이고 "지난주" 같은 상대 시간을 실제 날짜로 풀 수 있습니다.

#### 핵심

> Hindsight는 대화를 저장하지 않고 대화에서 나온 **사실**을 저장합니다. 추출 품질은 `context`와 시각 정보를 얼마나 잘 주느냐에 크게 좌우됩니다.

### 3. Observation (통합된 믿음)

#### 쉽게 설명하면

같은 이야기를 여러 번 들으면 메모를 열 장 쓰지 않고 "민지 씨는 원래 앱을 썼는데 지금은 웹만 쓴다" 한 줄로 정리합니다. 새 이야기를 들으면 그 한 줄을 고쳐 씁니다.

#### 개발 관점에서는

`retain`이 끝나면 백그라운드 워커가 **consolidation**을 실행합니다.

1. 새 fact를 기존 Observation과 비교합니다.
2. 관련 fact를 묶어 새 Observation을 만들거나 기존 것을 다듬습니다.
3. Observation마다 근거 fact(정확한 인용 포함)와 proof count를 기록합니다.
4. 새 증거가 기존 믿음과 충돌하면 덮어쓰지 않고 **변화 자체를 기록**합니다. "React를 좋아했지만 지금은 Vue로 옮겼다"처럼요.

통합이 아직 따라오지 못한 상태에서는 `reflect`가 해당 Observation을 "오래됨(stale)"으로 보고 원본 fact로 다시 확인합니다. 원본 fact를 지우면 거기서 나온 Observation도 함께 정리되고, 남은 fact는 다시 통합 대상이 됩니다.

#### 예제

| 시점 | 들어온 사실 | Observation |
|---|---|---|
| 3월 | "iOS 앱 결제가 실패한다" | "민지는 iOS 앱 결제 문제를 겪었다" |
| 4월 | "연간 구독으로 바꿨다" | (별도 Observation) "민지는 연간 구독 중이다" |
| 6월 | "이제 웹으로만 들어온다" | "민지는 iOS 앱에서 결제 문제를 겪은 뒤 웹으로 옮겨 지금은 웹만 쓴다" |

#### 핵심

> Observation은 "요약"이 아니라 **근거가 달린 믿음**입니다. 그래서 recall 결과에 같은 내용이 반복되는 문제와, 옛 사실과 새 사실이 충돌하는 문제를 함께 줄입니다.

### 4. Mental Model과 Knowledge Page (미리 써 둔 답)

#### 쉽게 설명하면

자주 받는 질문의 답을 매번 새로 생각하지 않고, 정리된 답안지를 서랍에 넣어 두었다가 꺼내 읽는 것입니다. 새 정보가 생기면 답안지를 고쳐 둡니다.

#### 개발 관점에서는

**Mental Model**은 "이 고객의 현재 상태와 주의할 점은?"처럼 개발자가 정한 질문(`source_query`)에 대해 Hindsight가 백그라운드에서 답을 써 두는 문서입니다.

- 읽기는 **DB 조회 한 번**입니다. 검색도 LLM 호출도 없습니다.
- 갱신은 통합 직후 또는 cron 일정으로 일어나며, **자기 범위(태그) 안에서 변경이 있을 때만** 실행됩니다.
- delta 모드에서는 문서를 통째로 다시 쓰지 않고 바뀐 부분만 고칩니다. LLM에게 "나머지는 그대로 둬"라고 부탁하면 표현이 조금씩 흘러가는 문제를 피하기 위해서입니다.
- 이전 버전과 근거(어떤 fact·Observation으로 썼는지)를 보존합니다.

**Knowledge Page**는 Mental Model을 위키처럼 쓰기 쉽게 감싼 형태입니다. 폴더 트리로 정리되고, Observation만을 재료로 쓰며, 다른 페이지를 읽지 않아서 서로를 인용하는 순환이 생기지 않습니다. CLI의 `hindsight fs mount`로 실제 Markdown 파일로 내려받아 `grep`이나 에디터로 볼 수도 있습니다.

#### 예제

```ts
// 매일 03:00(UTC)에 확인하고, 범위 안의 기억이 바뀌었을 때만 다시 쓴다
await client.createMentalModel(
  'user-minji',
  '고객 현황',
  '이 고객의 현재 구독 상태, 사용 환경, 미해결 문의는 무엇인가?',
  { trigger: { refreshCron: '0 3 * * *' } },
);
```

#### 핵심

> Observation이 자동으로 생기는 "한 줄짜리 믿음"이라면, Mental Model은 개발자가 고른 질문에 대한 "항상 최신인 문서"입니다. 응답 지연이 중요한 화면에서는 reflect 대신 Mental Model을 읽습니다.

### 5. Retain · Recall · Reflect (세 가지 연산)

#### 쉽게 설명하면

- Retain: 기억하기
- Recall: 떠올리기 (관련 기억을 꺼내 보여 주기)
- Reflect: 곰곰이 생각해서 답하기

#### 개발 관점에서는

| 연산 | 입력 | 출력 | LLM 호출 | 대표 지연 |
|---|---|---|---|---|
| `retain` | 텍스트(또는 이미지가 섞인 블록), 시각, context, 태그 | 저장 결과(비동기면 operation ID) | 있음 (사실 추출) | 배치당 0.5~2초 |
| `recall` | 질문, 토큰 예산, 검색 깊이, 타입·태그 필터 | 순위가 매겨진 기억 목록 | 없음 (임베딩·재순위화 모델만) | 0.1~0.6초 |
| `reflect` | 질문, context, 태그 | 답변 텍스트, 근거, 선택적으로 구조화 출력 | 있음 (에이전트 루프) | 0.8~3초 |

지연 수치는 공식 성능 문서가 제시하는 대표 범위입니다. 무거운 일(사실 추출, 엔티티 정리, 연결 생성)을 **쓰기 시점에 미리** 끝내서 읽기 경로를 빠르게 만드는 것이 기본 설계입니다.

`reflect`는 단일 검색이 아니라 도구를 가진 에이전트 루프입니다. Mental Model 검색 → Observation 검색 → 원본 fact recall 순서로 내려가며 최대 10회까지 근거를 모으고, 실제로 가져온 ID만 인용하도록 검증합니다. 같은 사실이라도 bank의 mission, directive, disposition에 따라 답의 관점이 달라집니다. 반면 `recall`은 누가 물어도 같은 기억을 돌려줍니다.

#### 예제

```ts
const memories = await client.recall('user-minji', '지난봄에 문의한 결제 문제', {
  budget: 'mid',
  maxTokens: 2048,
});
for (const m of memories.results) console.log(m.type, m.text);

const answer = await client.reflect('user-minji', '이 고객에게 지금 무엇을 안내해야 할까?');
console.log(answer.text);
```

#### 핵심

> 내 코드가 직접 추론하려면 `recall`, Hindsight가 근거를 모아 답까지 써 주길 원하면 `reflect`입니다. 검색 내부 동작은 [Recall 파이프라인 깊이 보기](#h-hindsight-recall-파이프라인-깊이-보기)에서 다룹니다.

### 6. Tag와 Observation Scope (bank 안의 칸막이)

#### 쉽게 설명하면

같은 서랍장 안에서 칸을 나누는 것입니다. 서랍장(bank)을 따로 두기는 과하지만, 내용은 구분하고 싶을 때 씁니다.

#### 개발 관점에서는

`retain` 때 `tags`를 붙이고, `recall`·`reflect`에서 `tags`와 `tagsMatch`로 거릅니다. `tagsMatch`의 기본값 `any`는 **태그가 없는 기억도 함께 돌려준다**는 점이 중요합니다. 태그 있는 기억만 원하면 `any_strict`나 `all_strict`를 씁니다.

Observation도 태그 범위(scope)별로 따로 통합됩니다. 그래서 세션 ID처럼 매번 달라지는 태그를 붙이면 세션마다 거의 같은 Observation이 하나씩 생깁니다. 이런 경우 retain에 `observationScopes: 'shared'`를 주면 Observation은 전역 하나로 모으고, 원본 fact에는 세션 태그를 남겨 검색 필터로만 씁니다.

#### 핵심

> 보안 경계는 bank, 검색 범위 조절은 tag입니다. 태그로 사용자를 나눌 때는 `tagsMatch` 기본값이 태그 없는 기억까지 섞는다는 점을 반드시 기억합니다.

---

### 7. 전체 동작 구조

Hindsight는 애플리케이션 안에 import되는 라이브러리가 아니라, **애플리케이션과 LLM 사이에 놓이는 별도의 메모리 서버**입니다.

```mermaid
flowchart LR
    APP[애플리케이션 / 에이전트] -->|SDK · REST · MCP| API[Hindsight API 서버]

    subgraph HS[Hindsight]
        API -->|retain| EX[사실 추출<br/>엔티티 · 시간 · 연결]
        API -->|recall| RC[4중 검색<br/>RRF · 재순위화]
        API -->|reflect| RF[에이전트 루프]
        W[백그라운드 워커<br/>통합 · Mental Model 갱신]
    end

    EX --> DB[(PostgreSQL<br/>+ 벡터 확장)]
    RC --> DB
    RF --> RC
    W <--> DB
    EX -->|추출 요청| LLM[LLM 제공자]
    RF -->|추론 요청| LLM
    W -->|통합 요청| LLM
```

한 번의 대화가 기억으로 바뀌고 다시 쓰이는 순서는 다음과 같습니다.

1. **시작점**: 애플리케이션이 대화나 문서를 `retain`으로 보냅니다. `async: true`면 즉시 반환되고 작업은 큐에 들어갑니다.
2. **Hindsight가 개입하는 시점**: LLM이 사실·엔티티·시간을 추출하고, 엔티티를 기존 것과 맞춰 정규화하며, 임베딩과 키워드 인덱스, 엔티티·시간·의미·인과 연결을 만들어 PostgreSQL에 저장합니다.
3. **내부 처리**: 저장이 끝나면 워커가 consolidation을 돌려 Observation을 만들거나 다듬고, 범위 안에서 바뀐 것이 있는 Mental Model·Knowledge Page를 갱신합니다.
4. **외부 시스템과의 연결**: 다음 대화에서 애플리케이션이 `recall`이나 `reflect`를 호출합니다. recall은 LLM 없이 DB와 임베딩·재순위화 모델만 쓰고, reflect와 retain·통합은 설정한 LLM 제공자(OpenAI, Anthropic, Groq, Ollama 등)를 호출합니다.
5. **결과 반환**: recall은 토큰 예산에 맞춘 기억 목록을, reflect는 답변과 근거(`based_on`)를 돌려줍니다. 애플리케이션은 이것을 자기 LLM 프롬프트에 넣거나 그대로 사용자에게 보여 줍니다.

하나의 fact가 거치는 상태 변화를 보면 "기억이 정리되는 흐름"이 더 잘 보입니다.

```mermaid
stateDiagram-v2
    [*] --> Extracted: retain
    Extracted --> Indexed: 임베딩 · 키워드 · 연결 생성
    Indexed --> Consolidated: 워커가 Observation에 반영
    Consolidated --> Synthesized: 범위 안 Mental Model 갱신
    Indexed --> Indexed: recall 검색 대상
    Consolidated --> Reconsolidate: 근거 fact 삭제 또는 초기화
    Reconsolidate --> Consolidated: 다음 통합에서 다시 반영
```

## Hindsight 설치와 첫 사용

> 서버를 띄우는 방법을 고르는 기준, 기본 설정, 가장 간단한 retain·recall·reflect 실행, 설치할 때 자주 겪는 문제를 다룹니다.

### 설치

Hindsight는 **서버**와 **클라이언트**를 따로 설치합니다. 서버는 기억을 저장·처리하고, 클라이언트는 애플리케이션에서 서버를 부르는 SDK입니다. 어느 경우든 사실 추출과 reflect에 쓸 **LLM API 키**가 필요합니다.

#### 서버: 상황별로 하나를 고릅니다

| 방법 | 언제 | 저장소 |
|---|---|---|
| Docker 단일 컨테이너 | 로컬 개발, 빠른 체험 | 내장 PostgreSQL(pg0) |
| Docker Compose | 외부 PostgreSQL과 함께 띄울 때 | 별도 PostgreSQL 컨테이너 |
| `pip install hindsight-api` | 컨테이너 없이 직접 실행 | 내장 pg0 또는 외부 DB |
| `pip install hindsight-all` | Python 프로세스 안에 서버를 내장 | 내장 pg0 |
| Helm | Kubernetes 운영 | 차트 내장 또는 외부 PostgreSQL |
| Hindsight Cloud | 서버를 운영하고 싶지 않을 때 | 관리형 |

**방법 1. Docker (공식 권장 시작 경로)**

```bash
export OPENAI_API_KEY=sk-xxx

docker run -it --pull always --name hindsight --restart unless-stopped --shm-size=1g \
  -p 8888:8888 -p 9999:9999 \
  -e HINDSIGHT_API_LLM_API_KEY=$OPENAI_API_KEY \
  -v hindsight-data:/home/hindsight/.pg0 \
  ghcr.io/vectorize-io/hindsight:latest
```

- API: `http://localhost:8888`
- 웹 UI(Control Plane): `http://localhost:9999`

`latest`는 임베딩·재순위화 모델을 이미지 안에서 돌리는 전체 이미지(AMD64 기준 약 9GB)입니다. 임베딩과 재순위화를 OpenAI, Cohere, TEI 같은 외부 서비스에 맡길 수 있다면 약 500MB인 `latest-slim`을 씁니다.

**방법 2. 외부 PostgreSQL과 함께 (Docker Compose)**

```bash
git clone https://github.com/vectorize-io/hindsight.git
cd hindsight/docker/docker-compose/external-pg
export HINDSIGHT_API_LLM_API_KEY=sk-xxx
export HINDSIGHT_DB_PASSWORD=choose-a-password
docker compose up -d
```

이 Compose 파일은 `pgvector/pgvector` 이미지로 PostgreSQL을 띄우고 Hindsight 컨테이너가 `HINDSIGHT_API_DATABASE_URL`로 그 DB를 쓰게 연결합니다. 같은 폴더 옆에는 vchord, pg_search, TEI(외부 임베딩), 로컬 LLM, CUDA 등 조합별 예제가 함께 있습니다. README의 짧은 안내에는 `docker/docker-compose`에서 바로 실행하라고 되어 있지만, 2026년 10월 기준 저장소에서는 이처럼 용도별 하위 폴더로 나뉘어 있습니다.

**방법 3. pip로 직접 실행 (Python 3.11 이상)**

```bash
pip install hindsight-api
export HINDSIGHT_API_LLM_API_KEY=sk-xxx
hindsight-api
```

**방법 4. Python 프로세스 안에 내장**

```bash
pip install hindsight-all -U
```

```python
import os
from hindsight import HindsightServer, HindsightClient

# with 블록이 살아 있는 동안만 내장 서버가 동작한다
with HindsightServer(
    llm_provider="openai",
    llm_model="gpt-5-mini",
    llm_api_key=os.environ["OPENAI_API_KEY"],
) as server:
    client = HindsightClient(base_url=server.url)
    client.retain(bank_id="demo", content="민지는 연간 구독 중이다")
    print(client.recall(bank_id="demo", query="민지의 구독 상태는?"))
```

노트북 실험이나 테스트에 편하지만, 프로세스가 끝나면 서버도 내려가므로 서비스용으로는 방법 1~3이나 Helm을 씁니다.

#### 클라이언트

```bash
npm install @vectorize-io/hindsight-client      # Node.js / TypeScript (Deno는 npm: 지정자로 바로 import)
pnpm add @vectorize-io/hindsight-client
pip install hindsight-client -U                 # Python
go get github.com/vectorize-io/hindsight/hindsight-clients/go
curl -fsSL https://hindsight.vectorize.io/get-cli | bash   # CLI
```

### 기본 설정

서버 설정은 모두 `HINDSIGHT_API_*` 환경 변수입니다. 처음에는 LLM 관련 값만 정하면 됩니다.

```bash
# LLM 제공자와 키 (제공자만 정하면 그 제공자의 권장 기본 모델이 쓰인다)
export HINDSIGHT_API_LLM_PROVIDER=openai          # anthropic, gemini, groq, ollama, litellm ...
export HINDSIGHT_API_LLM_API_KEY=sk-xxx
# export HINDSIGHT_API_LLM_MODEL=gpt-5-mini       # 기본 모델을 바꾸고 싶을 때

# 사실 추출만 다른 제공자로 (연산별 LLM 분리)
# export HINDSIGHT_API_RETAIN_LLM_PROVIDER=groq

# 운영 DB (지정하지 않으면 내장 pg0 사용)
# export HINDSIGHT_API_DATABASE_URL=postgresql://user:pass@db:5432/hindsight

# API 키 인증 (기본은 꺼져 있음)
# export HINDSIGHT_API_TENANT_EXTENSION=hindsight_api.extensions.builtin.tenant:ApiKeyTenantExtension
# export HINDSIGHT_API_TENANT_API_KEY=change-me
```

LLM은 25개 이상의 제공자를 지원합니다. Ollama, LM Studio 같은 로컬 모델, OpenAI 호환 엔드포인트, LiteLLM 게이트웨이를 쓸 수 있고, `claude-code`, `openai-codex`, `cursor`, `github-copilot`처럼 이미 쓰고 있는 구독을 API 키 없이 연결하는 제공자도 있습니다.

### 가장 간단한 예제

서버를 띄운 상태에서 TypeScript로 세 연산을 한 번씩 실행해 봅니다.

```ts
// quickstart.mts  (실행: npx tsx quickstart.mts)
import { HindsightClient } from '@vectorize-io/hindsight-client';

const client = new HindsightClient({ baseUrl: 'http://localhost:8888' });
const bank = 'quickstart-minji';

// 1) 기억하기: async: false 이므로 사실 추출이 끝날 때까지 기다린다
await client.retain(bank, '민지는 2026년 3월에 iOS 앱 결제 실패를 문의했고, 6월부터는 웹으로만 접속한다.', {
  context: '상담 기록 요약',
  timestamp: '2026-06-20T09:00:00Z',
  async: false,
});

// 2) 떠올리기: 관련 기억을 토큰 예산 안에서 가져온다
const recalled = await client.recall(bank, '민지는 요즘 어떤 기기로 접속하나요?', { maxTokens: 1024 });
for (const r of recalled.results) {
  console.log(`[${r.type}] ${r.text}`);
}

// 3) 생각해서 답하기: 기억을 근거로 답을 만든다
const answer = await client.reflect(bank, '민지에게 결제 관련 안내를 할 때 주의할 점은?');
console.log(answer.text);
```

1. **무엇을 생성하는가**: 처음 `retain`할 때 `quickstart-minji` bank가 자동으로 만들어지고, 문장 하나에서 "3월에 iOS 앱 결제 실패 문의", "6월부터 웹으로만 접속" 같은 fact가 날짜와 함께 생성됩니다.
2. **어떤 값을 전달하는가**: `context`는 추출 LLM에게 이 텍스트가 무엇인지 알려 주고, `timestamp`는 "6월부터" 같은 표현을 실제 날짜로 고정하는 기준이 됩니다.
3. **Hindsight가 무엇을 처리하는가**: `recall`은 질문을 임베딩하고 의미·키워드·그래프·시간 검색을 동시에 실행해 순위를 합친 뒤 1,024토큰 안에 들어가는 만큼 돌려줍니다. `reflect`는 에이전트 루프로 필요한 기억을 찾아 답을 씁니다.
4. **어떤 결과를 반환하는가**: `recall`은 `results` 배열(각 항목에 `text`, `type`, 엔티티, 날짜, `documentId` 등)을, `reflect`는 `text`와 선택적으로 근거 목록을 돌려줍니다.

백그라운드 통합이 끝나면 `types: ['observation']`으로 recall했을 때 Observation도 함께 보입니다. 웹 UI(`http://localhost:9999`)에서 bank를 열면 추출된 fact, 엔티티 그래프, Observation, 진행 중인 작업을 눈으로 확인할 수 있어서 처음 동작을 이해하는 데 도움이 됩니다.

---

### 설치할 때 주의할 점

- **내장 pg0는 개발용입니다.** 운영에서는 PostgreSQL 14 이상과 벡터 확장(pgvector, pgvectorscale, vchord, AlloyDB의 scann 중 하나)을 따로 둡니다. Supabase, Neon, RDS, Cloud SQL 같은 관리형 PostgreSQL도 됩니다.
- **Docker 데이터는 named volume으로 둡니다.** 컨테이너는 UID 1000으로 실행되므로, 호스트 디렉터리를 bind mount하려면 그 디렉터리를 `chown -R 1000:1000`으로 맞춰야 합니다. `--user`로 다른 UID를 지정하면 시작 단계에서 오류가 납니다.
- **운영에서는 `HINDSIGHT_API_WORKER_ID`를 고정합니다.** 기본값이 컨테이너 호스트명이라 재시작할 때마다 바뀌고, 처리 중이던 작업이 옛 ID 아래에 남아 아무도 가져가지 않습니다.
- **Intel Mac에서는 `-slim` 패키지를 씁니다.** `pip install hindsight-all`은 Intel Mac용 wheel이 없어 몇 달 전 릴리스로 조용히 내려갑니다. `hindsight-all-slim` / `hindsight-api-slim`과 외부 임베딩·재순위화(또는 `hindsight-api-slim[local-onnx]`)를 조합합니다.
- **Docker 이미지에는 llama.cpp가 없습니다.** 로컬 추론을 하려면 Ollama, LM Studio, vLLM 등을 옆에 띄우고 `HINDSIGHT_API_LLM_BASE_URL`로 연결합니다.
- **LLM의 출력 토큰 한도를 확인합니다.** 공식 문서는 사실 추출의 안정성을 위해 출력 토큰을 충분히(약 65,000 이상) 지원하는 모델을 요구하고, 그보다 작은 모델은 `HINDSIGHT_API_RETAIN_MAX_COMPLETION_TOKENS`를 낮추는 방법을 안내합니다(이 값은 `HINDSIGHT_API_RETAIN_CHUNK_SIZE`보다 커야 합니다).
- **인증은 기본으로 꺼져 있습니다.** REST API와 MCP 엔드포인트가 모두 열려 있으므로, 로컬 밖에 노출하기 전에 API 키 인증을 켭니다. 자세한 내용은 [서버 운영과 실전 프로젝트](#h-hindsight-활용-예시-③-서버-운영과-실전-프로젝트)에서 다룹니다.

## Hindsight 활용 예시 ① 사용자를 기억하는 상담 챗봇

> 쇼핑몰 상담 챗봇에 사용자별 장기 기억을 붙이는 과정과, 이미 운영 중인 LLM 호출 코드에 래퍼만 씌워 기억을 붙이는 방법을 다룹니다.

### 예제 1. 사용자별 기억을 가진 상담 챗봇

#### 요구사항

> 상담 챗봇이 같은 고객의 이전 문의, 구독 상태, 사용 기기를 기억해서 "지난번 그 건"을 다시 설명하게 만들지 않는다. 고객 사이에 기억이 절대 섞이면 안 된다. 챗봇은 환불 금액을 직접 약속하면 안 된다. 사용자 응답 속도는 기억 기능 때문에 눈에 띄게 느려지면 안 된다.

#### 구현

**1. bank 준비: 고객마다 하나, 처음 한 번만**

```ts
// src/memory/bank.ts
import { HindsightClient } from '@vectorize-io/hindsight-client';

export const hindsight = new HindsightClient({
  baseUrl: process.env.HINDSIGHT_API_URL!,
  apiKey: process.env.HINDSIGHT_API_KEY, // 서버에서 API 키 인증을 켰을 때
});

export const bankIdOf = (customerId: string) => `support::${customerId}`;

const prepared = new Set<string>();

export async function ensureCustomerBank(customerId: string) {
  const bankId = bankIdOf(customerId);
  if (prepared.has(bankId)) return bankId;

  // 같은 ID로 다시 호출하면 설정만 갱신된다 (create or update)
  await hindsight.createBank(bankId, {
    retainMission:
      '구독·결제·배송·환불·사용 기기·불편 사항과 그 날짜를 기억한다. 인사말과 감사 표현은 무시한다.',
    reflectMission:
      '나는 쇼핑몰 상담 에이전트다. 고객의 이전 문의와 현재 상태를 근거로 짧고 정확하게 답한다.',
  });

  // reflect가 반드시 지킬 규칙
  await hindsight.createDirective(bankId, '환불 금액 약속 금지', '환불 금액이나 보상액을 확정해서 말하지 않는다. 담당 부서 확인이 필요하다고 안내한다.');

  prepared.add(bankId);
  return bankId;
}
```

실제 서비스에서는 `prepared` 대신 "bank 준비 완료" 여부를 고객 테이블에 저장합니다. 여기서는 흐름을 보이기 위해 메모리 집합을 썼습니다.

**2. 대화 한 턴 처리: 떠올리기 → 답하기 → 기억하기**

```ts
// src/chat/handle-message.ts
import OpenAI from 'openai';
import { hindsight, ensureCustomerBank } from '../memory/bank';

const openai = new OpenAI();

type Turn = { customerId: string; sessionId: string; customerName: string; message: string };

export async function handleMessage({ customerId, sessionId, customerName, message }: Turn) {
  const bankId = await ensureCustomerBank(customerId);

  // 1) 떠올리기: 빠른 응답이 우선이므로 얕은 검색 + 작은 토큰 예산
  const memories = await hindsight
    .recall(bankId, message, {
      budget: 'low',
      maxTokens: 1500,
      types: ['observation', 'world', 'experience'],
      preferObservations: true, // Observation으로 통합된 원본 fact는 중복으로 내보내지 않음
    })
    .catch(() => null); // 기억 서버 장애가 상담 자체를 막지 않게 한다

  const memoryBlock = memories?.results.map((m) => `- ${m.text}`).join('\n') ?? '(기억 없음)';

  // 2) 답하기: 기억은 "참고 자료"로만 넣는다
  const completion = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    messages: [
      {
        role: 'system',
        content: [
          '너는 쇼핑몰 상담원이다. 환불 금액은 확정해서 말하지 않는다.',
          '아래는 이 고객에 대해 이전 대화에서 알게 된 내용이다. 현재 대화와 충돌하면 현재 대화를 따른다.',
          memoryBlock,
        ].join('\n\n'),
      },
      { role: 'user', content: message },
    ],
  });
  const reply = completion.choices[0].message.content ?? '';

  // 3) 기억하기: 응답을 막지 않도록 비동기로, 세션 문서에 이어 붙인다
  const now = new Date().toISOString();
  void hindsight
    .retain(bankId, `${customerName} (${now}): ${message}\n상담봇 (${now}): ${reply}`, {
      context: `고객 ${customerName}과 상담봇의 대화. "상담봇"의 1인칭 발화만 에이전트 자신의 경험이다`,
      timestamp: now,
      documentId: `session::${sessionId}`,
      updateMode: 'append', // 같은 세션 문서에 새 턴만 추가
      async: true,
    })
    .catch((err) => console.error('retain failed', err));

  return reply;
}
```

**3. 상담원 화면용 요약: 질문을 미리 정해 두고 읽기만 한다**

```ts
// src/memory/customer-brief.ts
import { hindsight, ensureCustomerBank } from './bank';

const BRIEF_ID = 'customer-brief';

export async function createCustomerBrief(customerId: string) {
  const bankId = await ensureCustomerBank(customerId);
  await hindsight.createMentalModel(
    bankId,
    '고객 브리핑',
    '이 고객의 구독 상태, 사용 기기, 미해결 문의, 응대 시 주의할 점은 무엇인가?',
    { id: BRIEF_ID, trigger: { refreshAfterConsolidation: true } },
  );
}

export async function readCustomerBrief(customerId: string) {
  // LLM 호출 없이 저장된 최신 버전만 읽는다
  const model = await hindsight.getMentalModel(`support::${customerId}`, BRIEF_ID);
  return model.content;
}
```

#### 실행 흐름

```text
고객: "지난봄에 문의했던 결제 문제 해결됐나요?"
 ↓
handleMessage: support::c-1024 bank 준비 확인
 ↓
recall(budget low, 1500 tokens): "지난봄" → 3~5월 범위, 결제·iOS 앱 관련 Observation과 fact 반환
 ↓
OpenAI 호출: 기억을 system 메시지에 넣고 답변 생성
 ↓
고객에게 답변 반환  ← 여기까지가 사용자 응답 경로
 ↓ (비동기)
retain(append): 이번 턴을 session::s-88 문서에 추가 → 사실 추출
 ↓ (백그라운드)
consolidation: "결제 문제는 웹 결제로 우회했고 9월에 해결 여부를 다시 물었다"로 Observation 갱신
 ↓
Mental Model "고객 브리핑" 갱신 → 상담원 화면은 다음 조회 때 최신 브리핑을 읽음
```

#### 코드 설명

1. **bank를 고객 단위로 나눕니다.** `support::{customerId}`처럼 고객마다 bank를 두면 다른 고객의 기억이 검색될 가능성이 구조적으로 사라집니다. 하나의 bank에 태그로 고객을 나누는 방식은 `tagsMatch` 설정을 한 번만 실수해도 섞일 수 있습니다.
2. **recall은 응답 경로에, retain은 응답 경로 밖에 둡니다.** recall은 LLM을 부르지 않아 짧지만, retain은 사실 추출 LLM을 부릅니다. `async: true`로 큐에 넣고 결과를 기다리지 않습니다.
3. **`updateMode: 'append'`와 세션 단위 `documentId`를 함께 씁니다.** 기본값 `replace`로 같은 `documentId`를 보내면 이전 내용과 그 기억이 지워지고 새 내용으로 바뀝니다. append는 기존 문서 뒤에 붙이고, 바뀌지 않은 부분은 다시 추출하지 않습니다.
4. **화자를 `context`에 적습니다.** 고객의 "저 연간 구독으로 바꿨어요"가 에이전트 자신의 경험으로 저장되지 않게 하기 위해서입니다.
5. **기억은 참고 자료로만 넣습니다.** 기억은 이전 대화에서 추출된 것이므로 틀리거나 오래됐을 수 있습니다. 시스템 프롬프트에 "현재 대화와 충돌하면 현재 대화를 따른다"를 넣은 이유입니다.
6. **규칙은 Directive로 둡니다.** "환불 금액을 약속하지 않는다"는 bank의 reflect가 반드시 지키는 규칙으로 등록했습니다. 다만 Directive는 Hindsight의 `reflect`에만 적용되므로, 직접 OpenAI를 부르는 2단계에서는 시스템 프롬프트에도 같은 규칙을 넣었습니다.
7. **상담원 화면은 Mental Model을 읽습니다.** 화면을 열 때마다 reflect를 돌리면 매번 LLM 비용과 수 초의 지연이 생깁니다. 질문을 미리 정해 두면 Hindsight가 통합 직후 답을 갱신하고, 화면은 DB 조회 한 번으로 최신 브리핑을 보여 줍니다.

#### 왜 이렇게 사용하는가?

상담 챗봇에서 기억 기능의 실패는 두 가지입니다. 하나는 **다른 고객의 정보가 섞이는 것**, 다른 하나는 **기억 처리 때문에 답이 느려지는 것**입니다. 이 구성은 첫 번째를 bank 분리로, 두 번째를 "읽기는 동기·짧게, 쓰기는 비동기"로 막습니다. 그 사이의 어려운 일, 즉 "지난봄"의 날짜 해석, 옛 상태와 새 상태의 정리, 중복 제거는 Hindsight가 맡습니다.

reflect 대신 recall을 응답 경로에 쓴 것도 의도적인 선택입니다. 답을 만드는 LLM이 이미 있으므로, Hindsight에서 또 한 번 LLM 루프를 돌리면 비용과 지연이 두 배가 됩니다. reflect는 "이 고객에게 다음에 무엇을 제안할까"처럼 판단 자체를 맡길 때 씁니다.

### 예제 2. 기존 LLM 호출에 래퍼만 씌우기

#### 요구사항

> 이미 OpenAI SDK로 운영 중인 Python 챗봇이 있다. 대화 로직은 건드리지 않고 기억 기능만 먼저 붙여 효과를 확인하고 싶다.

#### 구현

```bash
pip install hindsight-litellm
```

```python
# app/llm.py
from openai import OpenAI
from hindsight_litellm import wrap_openai

def client_for(user_id: str):
    # 기본 연결 대상은 Hindsight Cloud이므로 자체 서버는 주소를 꼭 지정한다
    return wrap_openai(
        OpenAI(),
        bank_id=f"support::{user_id}",
        hindsight_api_url="http://localhost:8888",
    )

def answer(user_id: str, message: str) -> str:
    client = client_for(user_id)
    response = client.chat.completions.create(
        model="gpt-5-mini",
        messages=[{"role": "user", "content": message}],
    )
    return response.choices[0].message.content
```

래퍼는 `chat.completions.create` 호출 직전에 관련 기억을 recall해서 프롬프트에 넣고, 호출이 끝나면 대화를 retain합니다. Anthropic SDK는 `wrap_anthropic()`을 쓰고, LiteLLM 아래에서 동작하므로 100개 이상의 모델에 같은 방식이 적용됩니다. 검색 깊이, 가져올 기억 타입, recall 대신 reflect 사용 여부는 `hindsight_*` 키워드 인자로 호출마다 바꿀 수 있습니다.

#### 왜 이렇게 사용하는가?

래퍼는 **"기억이 있으면 우리 서비스가 실제로 나아지는가"를 가장 싸게 확인하는 방법**입니다. 다만 무엇을 언제 저장하고 검색할지 제어할 수 없으므로, 효과를 확인한 뒤에는 예제 1처럼 SDK를 직접 호출하는 구조로 옮기는 것이 좋습니다. 공식 문서도 저장·검색 시점을 명시적으로 제어해야 하면 SDK나 REST API를 직접 쓰라고 안내합니다.

## Hindsight 활용 예시 ② 코딩 에이전트와 MCP

> 개발자 한 명의 로컬 환경에서 Claude Code·Codex 같은 코딩 에이전트에 저장소 단위 장기 기억을 붙이는 방법과, MCP로 직접 연결하는 방법을 다룹니다.

Hindsight는 브라우저나 모바일 앱에서 직접 호출하는 클라이언트 라이브러리가 아닙니다. 사용자의 기기에서 Hindsight를 쓰는 대표적인 경우는 **개발자 PC의 코딩 에이전트**이므로, 이 문서에서는 이것을 클라이언트 관점으로 봅니다.

### 활용할 수 있는 기능

- **코딩 에이전트 통합 패키지** `@vectorize-io/hindsight-coding-agents`: 명령 한 줄로 Claude Code, Codex CLI, Cursor CLI, GitHub Copilot CLI, opencode, Kimi Code, Devin CLI 등 20개 가까운 에이전트에 Hook·MCP·Skill을 설치합니다.
- **저장소 단위 bank**: 기본 bank 이름이 `coding-agent::{gitProject}`라서, 같은 저장소에서 일하는 모든 에이전트가 하나의 기억을 공유합니다.
- **자동 수집**: git 커밋 이력과 에이전트 세션 대화가 백그라운드에서 bank로 들어갑니다. 별도 수집 명령이 없습니다.
- **첫 프롬프트 주입**: 세션의 첫 프롬프트에 맞춰 reflect 요약, 관련 Knowledge Page, 또는 recall 결과 중 하나를 넣어 줍니다(`autoInject`).
- **기본 Knowledge Page 5종**: Component map, Core concepts, Conventions and patterns, Key decisions and rationale, Initiatives and enhancements. 기본적으로 매시간, 바뀐 것이 있을 때만 갱신합니다.
- **내장 MCP 엔드포인트**: 패키지 없이도 어떤 MCP 클라이언트든 `http://localhost:8888/mcp/{bank_id}/`에 붙여 retain·recall·reflect·Mental Model·Knowledge Page 도구를 쓸 수 있습니다.
- **파일로 보는 지식**: `hindsight fs mount`로 bank의 Knowledge Page를 로컬 Markdown 파일로 내려받아 에디터나 `rg`로 읽습니다.

### 실제 예제

#### 1. 코딩 에이전트에 설치하기

```bash
# 기억을 어디에 둘지 고르며 설치 (터미널에서 실행하면 직접 물어본다)
npx @vectorize-io/hindsight-coding-agents install claude-code --server daemon

# 이미 띄운 자체 서버를 쓰는 경우
npx @vectorize-io/hindsight-coding-agents install claude-code codex \
  --server self-hosted --api-url http://localhost:8888

# 설치한 것만 정확히 제거
npx @vectorize-io/hindsight-coding-agents uninstall all
```

기억을 둘 곳은 세 가지입니다.

| 모드 | 동작 | 필요한 것 |
|---|---|---|
| `cloud` (기본) | Hindsight Cloud에 저장 | API 토큰 |
| `self-hosted` | 직접 운영하는 서버에 저장 | 서버 URL |
| `daemon` | 내 PC에서 `hindsight-embed`를 `127.0.0.1:9077`로 실행 | `uv`, 사실 추출용 LLM 키(없으면 Claude Code CLI 사용), macOS는 최신 Rust 툴체인 |

Claude Code에 설치하면 `~/.claude/settings.json`에 Hook 3개(세션 시작, 프롬프트 제출, 응답 종료)가 등록되고, `claude mcp add`로 사용자 범위 MCP 서버와 동반 Skill이 추가됩니다. 설정 파일은 `~/.hindsight/coding-agent.json` 하나입니다.

#### 2. 회사 코드는 기억시키지 않기

기본값은 "모든 저장소에서 기억 켜짐"입니다. 고객사 코드처럼 외부로 나가면 안 되는 저장소가 섞여 있다면 허용 목록 방식으로 바꿉니다.

```jsonc
// ~/.hindsight/coding-agent.json
{
  "serverMode": "self-hosted",
  "apiUrl": "http://localhost:8888",

  // 허용한 경로 아래 저장소에서만 기억을 쓴다. 나머지는 bank도 만들지 않는다
  "optInOnly": true,
  "optInPaths": ["~/work/my-product", "~/oss"],

  // 세션 첫 프롬프트에는 LLM 없이 관련 Knowledge Page만 넣는다
  "autoInject": "pages",

  // 커밋 메시지만 수집 (full 이면 커밋별 diff까지 수집)
  "gitIngest": "message",

  "banks": {
    // 이 저장소는 페이지 질문을 도메인에 맞게 바꾼다
    "coding-agent::my-product": {
      "pages": {
        "Key decisions and rationale": {
          "source_query": "결제·정산 관련 기술 결정과 그 이유는 무엇이며, 새 코드에 어떤 제약을 거는가?"
        }
      }
    }
  }
}
```

#### 3. 패키지 없이 MCP로 직접 연결하기

통합 패키지가 하는 자동 수집·주입이 필요 없고, 에이전트가 필요할 때 기억 도구를 직접 부르게 하고 싶다면 MCP만 연결합니다.

```bash
# 인증을 켜지 않은 로컬 서버: URL에 bank를 넣는다
claude mcp add --transport http hindsight http://localhost:8888/mcp/my-product/

# 인증을 켠 서버: 공통 엔드포인트 + 헤더로 bank 지정
claude mcp add --transport http hindsight http://localhost:8888/mcp \
  --header "Authorization: Bearer $HINDSIGHT_API_KEY" \
  --header "X-Bank-Id: my-product"
```

bank별 엔드포인트(`/mcp/{bank_id}/`)는 도구 호출에 bank ID를 넣을 필요가 없고, 공통 엔드포인트(`/mcp/`)는 `list_banks`, `create_bank` 같은 bank 관리 도구까지 노출하는 대신 호출마다 bank를 지정합니다. bank 설정의 `mcp_enabled_tools`로 노출할 도구를 줄일 수도 있습니다.

#### 4. Knowledge Page를 파일로 보기

```bash
# bank의 Knowledge Page 트리를 실제 디렉터리와 Markdown 파일로 내려받고 계속 동기화한다
hindsight fs mount --bank coding-agent::my-product
# 이후에는 내려받은 폴더에서 일반 파일처럼 검색한다
rg "retry"
```

페이지는 YAML frontmatter가 붙은 일반 Markdown 파일이고, 백그라운드 갱신 루프가 최신 상태로 유지합니다. 에이전트가 파일 도구만으로 프로젝트 지식을 읽을 수 있다는 점이 핵심입니다.

### 실제 서비스에서는

> 결제 서비스를 개발하는 개발자가 월요일 아침 Claude Code를 열고 "환불 금액 반올림 버그 고쳐줘"라고 입력합니다. 세션 시작 Hook이 `coding-agent::payments-api` bank를 확인하고, 첫 프롬프트에 맞춰 "Key decisions and rationale" 페이지에서 "환불 금액은 원 단위 내림, 2025년 11월 정산팀 요청으로 변경"이라는 내용을 찾아 넣어 줍니다. 에이전트는 코드만 보고는 알 수 없는 이 결정을 근거로 수정 방향을 잡습니다. 세션이 끝나면 대화가 bank에 들어가고, 오후에 같은 저장소에서 Codex를 쓰는 동료도 같은 기억을 이어받습니다.

공식 문서가 이 패키지의 전제로 드는 것도 같은 지점입니다. 수정의 대부분은 코드에서 추론할 수 있지만, 마지막 한 걸음은 반올림 규칙, 재시도 허용 목록 같은 **코드에 없는 프로젝트 결정**에 달려 있는 경우가 많고, 그런 결정은 git 이력과 과거 대화에 남아 있습니다.

로컬에서 쓸 때 알아 둘 비용과 위험도 있습니다.

- **기본 저장 위치가 Cloud입니다.** 설치할 때 묻지만, 스크립트로 설치하면서 `--server`를 빠뜨리면 코드 관련 대화가 외부 서비스로 갈 수 있습니다. 회사 정책을 먼저 확인합니다.
- **처음 보는 저장소에서는 구조 조사(codebase survey)가 자동으로 돕니다.** Claude Code에서는 `claude -p`로 실행되며 기본 비용 상한이 2달러(`surveyBudgetUsd`)입니다. 필요 없으면 `codebaseSurvey: false`로 끕니다.
- **페이지 하나 갱신은 LLM 합성 한 번입니다.** 페이지 수와 갱신 주기가 곧 비용이므로, 필요 없는 기본 페이지는 `pages`에서 `false`로 끄는 것이 좋습니다.

## Hindsight 활용 예시 ③ 서버 운영과 실전 프로젝트

> Hindsight를 서비스 백엔드 옆의 독립 메모리 서버로 운영하는 방법과, 학습 플랫폼의 AI 튜터에 실제로 도입하는 과정을 다룹니다.

### 서버 환경에서의 활용

Hindsight는 애플리케이션 프로세스 안에 들어가는 라이브러리가 아니라 **별도로 배포하는 상태 저장 서비스**입니다. 애플리케이션 서버는 SDK로 HTTP 호출만 하고, 모든 상태는 Hindsight 뒤의 PostgreSQL에 있습니다.

#### 활용 사례

- **사용자별 장기 기억 서비스**: 웹·앱 백엔드가 사용자 ID를 bank ID로 써서 retain·recall을 호출합니다. 여러 백엔드 서비스가 같은 기억 서버를 공유할 수 있습니다.
- **멀티 테넌트 격리**: 내장 `ApiKeyTenantExtension`은 공유 API 키 하나로 전체 API를 보호합니다. 고객사별로 DB 스키마를 나눠야 하면 사용자·키를 환경 변수로 선언하는 StaticKeys 확장이나 Supabase JWT 확장(별도 이미지)을 쓰고, 그 외에는 `TenantExtension`을 직접 구현합니다.
- **백그라운드 작업 분리**: 기본적으로 API 서버가 통합·갱신 작업도 처리합니다. 쓰기량이 많아지면 `HINDSIGHT_API_WORKER_ENABLED=false`로 API에서 떼어 내고 `hindsight-worker`를 여러 개 띄웁니다. 워커는 PostgreSQL을 작업 큐로 씁니다.
- **운영 관측**: Prometheus 메트릭(LLM 호출 수, 토큰, 지연), 상태 확인 엔드포인트, retain·통합·갱신 완료를 알리는 Webhook, 막힌 작업을 정리하는 Admin CLI를 제공합니다.
- **데이터 이동**: bank 단위 export/import(transfer), 한 번의 호출로 bank 복제, 무중단 ID 변경을 위한 bank alias가 0.10 계열에 추가되었습니다.

#### 애플리케이션 구조

```text
사용자 (브라우저 · 앱)
 ↓
애플리케이션 서버 (Next.js Route Handler, NestJS, FastAPI ...)
 ├─ 대화 LLM 호출 (OpenAI · Anthropic · 사내 게이트웨이)
 └─ Hindsight SDK 호출 ──────────┐
                                  ↓
                     Hindsight API (stateless, 수평 확장 가능)
                     Hindsight Worker (통합 · Mental Model 갱신)
                                  ↓
                     PostgreSQL + pgvector (기억 · 작업 큐)
                                  ↓
                     Webhook → 애플리케이션 서버 (완료 알림 · 감시)
```

#### 실제 코드

**API 키 인증을 켠 단일 서버 구성**

```bash
# 운영 환경 변수 예시
export HINDSIGHT_API_DATABASE_URL=postgresql://hindsight:***@db.internal:5432/hindsight
export HINDSIGHT_API_LLM_PROVIDER=openai
export HINDSIGHT_API_LLM_BASE_URL=https://llm-gateway.internal.example.com/v1   # OpenAI 호환 게이트웨이
export HINDSIGHT_API_LLM_API_KEY="$GATEWAY_TOKEN"
export HINDSIGHT_API_TENANT_EXTENSION=hindsight_api.extensions.builtin.tenant:ApiKeyTenantExtension
export HINDSIGHT_API_TENANT_API_KEY="$HINDSIGHT_SHARED_KEY"
export HINDSIGHT_API_WORKER_ID=hindsight-prod-1    # 재시작해도 같은 워커로 인식되게 고정
hindsight-api
```

**처리량이 늘었을 때: 워커 분리**

```bash
HINDSIGHT_API_WORKER_ENABLED=false hindsight-api
hindsight-worker --worker-id worker-1
hindsight-worker --worker-id worker-2

# 워커를 줄이기 전에는 잡고 있던 작업을 먼저 반납
hindsight-admin decommission-worker worker-2
```

**계층별로 Hindsight가 어디에 들어가는가**

| 위치 | Hindsight 사용 방식 | 이유 |
|---|---|---|
| Controller / Route Handler | 사용자 ID → bank ID 변환, 권한 확인 | bank ID를 요청 값에서 그대로 받으면 남의 기억을 조회할 수 있으므로 인증된 세션에서만 만든다 |
| Service (비즈니스 로직) | recall로 맥락 조회, 응답 후 retain(비동기) | 기억은 대화 생성의 입력이자 부산물이므로 대화 흐름을 담당하는 계층에 둔다 |
| Repository / 외부 API Adapter | `HindsightClient` 생성과 재시도·타임아웃 정책 | 기억 서버 장애가 핵심 기능을 멈추지 않도록 실패를 여기서 흡수한다 |
| 배치 · 이벤트 소비자 | 과거 데이터 대량 retain, Webhook 처리 | 쓰기는 LLM 비용과 지연이 크므로 사용자 요청 경로 밖에서 처리한다 |

---

### 실전 프로젝트 적용: 온라인 코딩 강의의 AI 튜터

#### 요구사항

온라인 코딩 강의 플랫폼에 "나를 기억하는 AI 튜터"를 붙입니다.

- 스택: Next.js(App Router) + Vercel AI SDK, 자체 호스팅 Hindsight, PostgreSQL(pgvector)
- 튜터는 학습자의 이전 질문, 막혔던 개념, 선호하는 설명 방식을 기억한다
- 튜터는 과제 정답 코드를 그대로 주지 않는다
- 강사는 대시보드에서 학습자별 요약을 바로 볼 수 있어야 한다(열 때마다 LLM을 부르면 안 됨)
- 학습자 데이터는 회사 인프라 안에 둔다. LLM은 사내 게이트웨이를 거친다
- 기억이 제대로 쌓이지 않는 경우(추출 결과 0건)를 감지한다

#### 전체 구조

```mermaid
flowchart LR
    L[학습자 브라우저] -->|질문| R[Next.js<br/>/api/tutor]
    I[강사 브라우저] -->|대시보드| P[Next.js<br/>강사 페이지]

    R -->|recall 도구| HS[Hindsight API]
    R -->|retain 비동기| HS
    R -->|대화 생성| GW[사내 LLM 게이트웨이]
    P -->|Mental Model 조회| HS

    HS --> DB[(PostgreSQL<br/>pgvector)]
    HS -->|사실 추출 · 통합| GW
    HS -->|retain.completed Webhook| WH[Next.js<br/>/api/hindsight-webhook]
    WH -->|추출 0건 알림| AL[Slack 알림]
```

#### 폴더 구조

```text
code-tutor/
├── infra/
│   └── docker-compose.yml            # PostgreSQL + Hindsight API
├── scripts/
│   └── setup-learner-bank.ts         # 학습자 bank 설정 · 규칙 · Mental Model 생성
├── apps/web/
│   ├── lib/hindsight.ts              # 클라이언트와 bank ID 규칙
│   ├── app/api/tutor/route.ts        # 튜터 대화
│   ├── app/api/hindsight-webhook/route.ts  # 완료 이벤트 수신
│   └── app/instructor/[learnerId]/page.tsx # 강사용 학습자 요약
└── package.json
```

#### 구현

**1. 인프라: PostgreSQL + Hindsight API**

공식 `external-pg` Compose 예제를 바탕으로 인증과 게이트웨이 설정을 더했습니다.

```yaml
# infra/docker-compose.yml
services:
  db:
    image: pgvector/pgvector:pg18
    environment:
      POSTGRES_USER: hindsight
      POSTGRES_PASSWORD: ${HINDSIGHT_DB_PASSWORD:?set HINDSIGHT_DB_PASSWORD}
      POSTGRES_DB: hindsight
    volumes:
      - pg_data:/var/lib/postgresql/18/docker

  hindsight:
    image: ghcr.io/vectorize-io/hindsight-api:${HINDSIGHT_VERSION:?pin a reviewed version}
    ports:
      - "127.0.0.1:8888:8888"   # 외부에 직접 노출하지 않는다
    environment:
      HINDSIGHT_API_DATABASE_URL: postgresql://hindsight:${HINDSIGHT_DB_PASSWORD}@db:5432/hindsight
      HINDSIGHT_API_LLM_PROVIDER: openai
      HINDSIGHT_API_LLM_BASE_URL: ${LLM_GATEWAY_URL}
      HINDSIGHT_API_LLM_API_KEY: ${LLM_GATEWAY_TOKEN}
      HINDSIGHT_API_TENANT_EXTENSION: hindsight_api.extensions.builtin.tenant:ApiKeyTenantExtension
      HINDSIGHT_API_TENANT_API_KEY: ${HINDSIGHT_API_KEY}
      HINDSIGHT_API_WORKER_ID: tutor-hindsight-1
    depends_on:
      - db

volumes:
  pg_data:
```

**2. 클라이언트와 bank 규칙**

```ts
// apps/web/lib/hindsight.ts
import { HindsightClient } from '@vectorize-io/hindsight-client';

export const hindsight = new HindsightClient({
  baseUrl: process.env.HINDSIGHT_API_URL!,
  apiKey: process.env.HINDSIGHT_API_KEY!,
});

// bank ID는 반드시 인증된 세션의 사용자 ID로만 만든다
export const learnerBank = (learnerId: string) => `tutor::${learnerId}`;
export const PROFILE_MODEL_ID = 'learner-profile';
```

**3. 학습자 bank 준비 (가입 시 한 번)**

```ts
// scripts/setup-learner-bank.ts
import { hindsight, learnerBank, PROFILE_MODEL_ID } from '../apps/web/lib/hindsight';

export async function setupLearnerBank(learnerId: string) {
  const bankId = learnerBank(learnerId);

  await hindsight.createBank(bankId, {
    retainMission:
      '학습자가 막힌 개념, 반복한 실수, 이해한 개념, 선호하는 설명 방식(예시 위주, 그림 위주 등), 진행 중인 과제를 기억한다. 인사와 잡담은 무시한다.',
    observationsMission:
      '학습자의 지속적인 강점·약점·학습 습관을 기록한다. 하루짜리 상태는 기록하지 않는다.',
    reflectMission: '나는 코딩 튜터다. 학습자가 스스로 답에 도달하도록 돕는다.',
  });

  await hindsight.createDirective(
    bankId,
    '정답 코드 금지',
    '과제의 정답 코드를 그대로 제시하지 않는다. 힌트, 질문, 부분 예시로 안내한다.',
  );

  // 강사 대시보드용: 통합이 끝날 때마다 갱신되는 학습자 요약
  await hindsight.createMentalModel(
    bankId,
    '학습자 프로필',
    '이 학습자가 현재 어려워하는 개념, 반복하는 실수, 잘 통하는 설명 방식, 진행 중인 과제는 무엇인가?',
    { id: PROFILE_MODEL_ID, trigger: { refreshAfterConsolidation: true } },
  );
}
```

**4. 튜터 대화: 검색은 모델이, 저장은 서버가**

```ts
// apps/web/app/api/tutor/route.ts
import { generateText, stepCountIs } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createHindsightTools } from '@vectorize-io/hindsight-ai-sdk';
import { hindsight, learnerBank } from '@/lib/hindsight';
import { requireLearner } from '@/lib/auth';

const gateway = createOpenAI({
  baseURL: process.env.LLM_GATEWAY_URL,
  apiKey: process.env.LLM_GATEWAY_TOKEN,
});

export async function POST(req: Request) {
  const learner = await requireLearner(req); // 세션에서 학습자 확인
  const { question, lessonId } = await req.json();
  const bankId = learnerBank(learner.id);

  // 요청마다 도구를 만들어 이 학습자의 bank에 고정한다
  const memoryTools = createHindsightTools({
    client: hindsight,
    bankId,
    recall: { budget: 'low', maxTokens: 1500, types: ['observation', 'world', 'experience'] },
  });

  const { text } = await generateText({
    model: gateway.chat('gpt-5-mini'), // 게이트웨이가 Chat Completions만 지원하는 경우가 많아 명시
    system: [
      '너는 코딩 튜터다. 과제 정답 코드를 그대로 주지 말고 힌트와 질문으로 안내한다.',
      '학습자의 과거 어려움이나 선호가 답에 도움이 되면 recall 도구로 먼저 확인한다.',
    ].join('\n'),
    prompt: question,
    tools: { recall: memoryTools.recall }, // 모델에게는 조회만 허용
    stopWhen: stepCountIs(4),
  });

  // 저장은 모델 판단에 맡기지 않고 매 턴 서버가 비동기로 남긴다
  const now = new Date().toISOString();
  void hindsight
    .retain(bankId, `학습자 (${now}): ${question}\n튜터 (${now}): ${text}`, {
      context: `강의 ${lessonId}에서 학습자와 튜터의 대화. "튜터"의 1인칭 발화만 에이전트 자신의 경험이다`,
      timestamp: now,
      documentId: `lesson::${lessonId}`,
      updateMode: 'append',
      tags: [`lesson:${lessonId}`],
      observationScopes: 'shared', // 강의 태그와 무관하게 학습자 단위로 믿음을 통합
      async: true,
    })
    .catch((err) => console.error('[hindsight] retain failed', err));

  return Response.json({ answer: text });
}
```

**5. 강사 대시보드: LLM 없이 요약 읽기**

```tsx
// apps/web/app/instructor/[learnerId]/page.tsx
import { hindsight, learnerBank, PROFILE_MODEL_ID } from '@/lib/hindsight';
import { requireInstructor } from '@/lib/auth';

export default async function LearnerPage({ params }: { params: Promise<{ learnerId: string }> }) {
  await requireInstructor();
  const { learnerId } = await params;

  const profile = await hindsight.getMentalModel(learnerBank(learnerId), PROFILE_MODEL_ID);

  return (
    <article>
      <h1>학습자 요약</h1>
      <p>마지막 갱신: {profile.last_refreshed_at ?? '아직 생성 중'}</p>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{profile.content}</pre>
    </article>
  );
}
```

**6. Webhook: 기억이 쌓이지 않는 문서 감시**

```ts
// apps/web/app/api/hindsight-webhook/route.ts
import { createHmac, timingSafeEqual } from 'node:crypto';

const TOLERANCE_SECONDS = 300;

function verify(secret: string, rawBody: string, header: string | null) {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=', 2)));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > TOLERANCE_SECONDS) return false; // 재전송 공격 방지

  const expected = createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
  const received = String(parts.v1 ?? '');
  return expected.length === received.length && timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

export async function POST(req: Request) {
  const rawBody = await req.text(); // 파싱 전 원문으로 서명을 검증해야 한다
  if (!verify(process.env.HINDSIGHT_WEBHOOK_SECRET!, rawBody, req.headers.get('x-hindsight-signature-v2'))) {
    return new Response('invalid signature', { status: 401 });
  }

  const event = JSON.parse(rawBody);
  if (event.event === 'retain.completed' && event.data?.memory_unit_count === 0) {
    // 추출 결과가 0건이면 recall·reflect로 찾을 수 없는 문서가 된다
    await fetch(process.env.SLACK_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: `[hindsight] ${event.bank_id} / ${event.data.document_id}: 추출된 기억 0건` }),
    });
  }
  return new Response('ok'); // 같은 이벤트가 두 번 올 수 있으므로 처리는 멱등하게
}
```

#### 실제 실행 흐름

"재귀 함수가 계속 이해가 안 돼요"라는 질문을 예로 듭니다.

1. **사용자 행동**: 학습자가 3강 화면에서 질문을 보냅니다. 요청은 `/api/tutor`로 갑니다.
2. **애플리케이션 처리**: Route Handler가 세션에서 학습자를 확인하고 `tutor::{learnerId}` bank에 고정된 recall 도구를 만듭니다. 학습자가 보낸 값으로 bank ID를 만들지 않으므로 다른 학습자의 기억에 접근할 길이 없습니다.
3. **기억 조회**: 모델이 recall 도구를 호출합니다. Hindsight는 "2주 전 1강에서 for 반복문의 종료 조건을 헷갈렸다", "그림으로 설명했을 때 이해가 빨랐다"는 Observation을 1,500토큰 안에서 돌려줍니다.
4. **답변 생성**: 모델은 그림 비유를 써서, 종료 조건이라는 같은 약점에 초점을 맞춘 힌트를 만듭니다. 시스템 프롬프트에 따라 정답 코드는 주지 않습니다.
5. **기억 저장**: 응답을 돌려준 뒤 서버가 이번 대화를 `lesson::3` 문서에 append합니다. 학습자는 이 처리를 기다리지 않습니다.
6. **백그라운드 정리**: 워커가 사실을 추출하고 "종료 조건 이해가 반복적인 약점"이라는 Observation을 강화합니다. 통합이 끝나면 "학습자 프로필" Mental Model이 갱신되고, 추출이 0건이면 Webhook을 통해 Slack 알림이 갑니다.
7. **강사 확인**: 다음 날 강사가 대시보드를 열면 페이지는 Mental Model을 DB에서 읽기만 해서 바로 "재귀·반복문의 종료 조건에 약함, 그림 설명이 효과적"이라는 최신 요약을 보여 줍니다.

이 구조에서 **모델에게는 조회(recall)만 맡기고 저장(retain)은 서버가 매 턴 실행**한 점이 중요합니다. 저장까지 도구로 주면 모델이 기억할 가치를 판단하므로, 같은 내용을 여러 번 저장하거나 중요한 내용을 빠뜨리는 일이 생깁니다. Vercel AI SDK 통합 문서도 "무엇을 기억하고 찾을지는 에이전트, 비용·태그·비동기 같은 인프라 결정은 애플리케이션"으로 역할을 나누는데, 이 프로젝트는 그 경계를 한 단계 더 보수적으로 잡은 것입니다.

## Hindsight 장단점과 대안 비교

> Hindsight의 장점과 단점, 그리고 직접 구현한 RAG·Mem0·Zep·Letta·LangGraph 장기 메모리 같은 대안과 비교해 상황별로 무엇을 고를지 다룹니다.

### 직접 만든 "대화 로그 + 벡터 검색"과 무엇이 달라지나

| 항목 | 직접 구현한 벡터 검색 메모리 | Hindsight |
|---|---|---|
| 저장 단위 | 메시지나 청크 원문 | LLM이 추출한 사실 + 엔티티·시간·관계 |
| 검색 방식 | 임베딩 유사도 하나 | 의미 + 키워드(BM25) + 엔티티 그래프 + 시간 범위, RRF 결합 후 재순위화 |
| 시간 질의 | "봄"이라는 단어 유사도 | "지난봄"을 날짜 범위로 해석해 검색 |
| 여러 사실 연결 | 같은 단어가 있어야 찾음 | 공유 엔티티·인과 연결을 따라가 찾음 |
| 바뀐 사실 | 옛 문장과 새 문장이 함께 나옴 | Observation이 변화를 반영해 하나의 믿음으로 갱신 |
| 중복 | 같은 말이 쌓임 | 통합과 근사 중복 정리 |
| 결과 크기 | top-k 개수 | 토큰 예산(`max_tokens`) |
| 쓰기 비용 | 임베딩 1회 | LLM 추출 + 임베딩 + 백그라운드 통합 |
| 운영 부담 | 기존 DB에 테이블 하나 | 별도 서버, 워커, 모델, 버전 관리 |
| 동작 예측 가능성 | 높음 (저장한 그대로 나옴) | 중간 (LLM 추출 결과에 따라 달라짐) |

---

### 장점과 단점

#### 장점

##### 기억을 "정리된 지식"으로 바꿔 준다

대부분의 메모리 계층은 저장과 검색까지만 다룹니다. Hindsight는 fact → Observation → Mental Model → Knowledge Page로 이어지는 정리 계층을 기본으로 갖고 있습니다. 같은 사용자가 몇 달에 걸쳐 남긴 이야기가 "근거가 달린 몇 개의 믿음"과 "항상 최신인 요약 문서"로 바뀌므로, 프롬프트에 넣는 기억의 밀도가 높아집니다.

##### 검색 품질에 들어가는 공학이 이미 되어 있다

하이브리드 검색, RRF, cross-encoder 재순위화, 최신성·시간 근접성·근거 수 보정, 토큰 예산 패킹을 직접 구현하면 각각이 작은 프로젝트입니다. Hindsight는 이것을 기본값으로 제공하고, 각 단계를 bank 설정이나 환경 변수로 끄고 켤 수 있습니다. 내부 동작은 [Recall 파이프라인 깊이 보기](#h-hindsight-recall-파이프라인-깊이-보기)에서 다룹니다.

##### 읽기 경로가 빠르다

무거운 처리를 쓰기 시점과 백그라운드로 옮기는 설계라 recall은 LLM 호출이 없고, Mental Model은 DB 조회 한 번입니다. 사용자 응답 경로에 기억을 넣어도 지연을 통제하기 쉽습니다.

##### 붙이는 방법이 다양하다

Python·TypeScript·Go SDK, REST, 내장 MCP, LLM 클라이언트 래퍼, LangGraph·CrewAI·Pydantic AI·Vercel AI SDK 등 프레임워크 통합, 코딩 에이전트 패키지까지 있어서 기존 구조를 크게 바꾸지 않고 시작할 수 있습니다.

##### 공개된 연구와 활발한 개발

설계와 평가가 논문으로 공개되어 있고, README는 벤치마크 결과가 외부 연구진에 의해 재현되었다고 밝힙니다. 릴리스가 1~3주 간격으로 나오고 이슈 대응이 빠릅니다. MIT 라이선스라 자체 호스팅과 수정에 제약이 적습니다.

#### 단점

##### 쓰기마다 LLM 비용과 지연이 든다

`retain` 한 번에 사실 추출 LLM 호출이 일어나고, 이후 통합과 Mental Model 갱신도 LLM을 씁니다. 대화량이 많은 서비스에서는 이 비용이 대화 생성 비용과 비슷한 규모가 될 수 있습니다. 공식 문서가 작은 고속 모델(예: Groq의 gpt-oss-20b)을 추출용으로 권하는 이유입니다. 정확한 호출 횟수와 토큰 비용은 내용 길이와 설정에 따라 달라지므로 직접 측정해야 합니다.

##### 운영해야 할 것이 늘어난다

PostgreSQL과 벡터 확장, API 서버, 워커, 임베딩·재순위화 모델(전체 이미지는 AMD64 기준 약 9GB), LLM 키, 인증 확장을 관리해야 합니다. 관리형 Cloud를 쓰면 줄어들지만 데이터가 외부로 나갑니다.

##### 결과가 LLM 판단에 좌우된다

무엇이 fact가 되고 어떤 엔티티가 합쳐질지는 추출 모델이 정합니다. 같은 문서도 실행마다 결과가 조금 다를 수 있고, 이름이 비슷한 다른 사람이 하나의 엔티티로 합쳐지는 경우도 공식 문서가 직접 경고합니다. "저장한 그대로 꺼내야 하는" 데이터에는 맞지 않습니다.

##### 변화가 빠르다

0.10.0에서 bank profile·background 엔드포인트가 제거되었고, `createBank`의 `mission`·`disposition` 옵션은 Deprecated가 되었으며, Supabase 테넌트 확장은 내장에서 별도 이미지로 옮겨졌습니다. 외부 튜토리얼의 코드가 현재 API와 다를 수 있고, 업그레이드할 때마다 릴리스 노트를 확인해야 합니다.

##### 기본 설정이 개발용에 맞춰져 있다

내장 pg0, 꺼진 인증, 열린 MCP 엔드포인트, Cloud가 기본인 코딩 에이전트 패키지처럼 "바로 써 보기 좋은" 기본값이 운영에서는 위험 요소가 됩니다. 운영 전에 바꿔야 할 항목은 [주의할 점과 FAQ](#h-hindsight-주의할-점과-faq)에 정리했습니다.

---

### 비슷한 라이브러리와 비교

메모리 계층 도구들은 빠르게 바뀌고 있어서, 아래 비교는 각 도구의 일반적인 설계 방향 수준으로 봐야 합니다. 벤치마크 수치는 대부분 각 벤더가 자체 보고한 값이라 직접 비교하기 어렵습니다.

| 라이브러리 | 특징 | 장점 | 단점 | 추천 상황 |
|---|---|---|---|---|
| Hindsight | 사실 추출 + 4중 검색 + 백그라운드 통합(Observation·Mental Model)을 갖춘 독립 메모리 서버 | 시간·관계 질의, 믿음 갱신, 정리된 문서까지 한 번에 | 쓰기 LLM 비용, 운영 인프라, 빠른 변경 | 장기간 같은 사용자·프로젝트를 다루는 에이전트 |
| 직접 구현한 RAG (pgvector 등) | 청크 임베딩과 유사도 검색 | 가장 단순하고 예측 가능, 기존 DB 재사용 | 시간·관계·갱신 처리는 직접 구현해야 함 | 정적 문서 Q&A, 짧은 기억, 작은 프로젝트 |
| Mem0 | 대화에서 기억할 항목을 추출해 저장·갱신하는 메모리 계층(라이브러리 + 관리형) | 도입이 가볍고 생태계가 넓음 | 정리 계층의 깊이와 검색 구성은 Hindsight와 방향이 다름 | 개인화 기억을 빠르게 붙이고 싶은 앱 |
| Zep / Graphiti | 시간 정보를 가진 지식 그래프 중심의 메모리 | 엔티티 관계와 시간에 따른 사실 변화 표현에 강함 | 그래프 저장소 운영과 모델링 부담 | 관계 구조가 핵심인 도메인 |
| Letta | 기억을 스스로 관리하는 에이전트 런타임(MemGPT 계열) | 에이전트 실행과 기억 관리를 함께 제공 | 기존 에이전트 프레임워크를 바꿔야 할 수 있음 | 상태를 가진 장기 실행 에이전트를 새로 만들 때 |
| LangGraph 장기 메모리 | 그래프 실행 프레임워크의 저장소(Store) 기능 | LangGraph 안에서는 추가 서비스 없이 사용 | 사실 추출·통합 같은 정리는 직접 설계 | 이미 LangGraph를 쓰고 단순한 키-값·검색 기억이면 충분할 때 |

#### 어떤 것을 선택하면 될까?

##### Hindsight

같은 사용자나 프로젝트를 **몇 주, 몇 달 단위로** 다루고, "언제", "누가", "지금은 어떤가"를 묻는 질문이 많으며, 기억이 쌓일수록 정리된 요약이 필요한 경우에 선택합니다. 쓰기 비용과 서버 운영을 감당할 수 있어야 합니다.

##### 직접 구현한 RAG

검색 대상이 정적이고, 기억이 몇 세션 안에서 끝나며, 동작을 완전히 이해하고 통제하는 것이 중요할 때 선택합니다. 대부분의 사내 문서 검색은 여기서 시작하는 것이 맞습니다. RAG로 만든 뒤 "옛 정보가 계속 나온다", "지난달 얘기를 못 찾는다"는 문제가 반복될 때가 Hindsight 같은 메모리 서버를 검토할 시점입니다.

##### Mem0

추가 인프라를 최소화하고 개인화 기억부터 빠르게 붙이고 싶을 때 검토합니다. 기억 정리 방식과 검색 구성이 다르므로, 같은 데이터로 두 도구를 직접 비교해 보고 고르는 것이 안전합니다.

##### Zep / Graphiti

조직도, 고객-계약-제품 관계처럼 **관계 구조 자체**가 답의 핵심이고 그래프를 직접 다루고 싶을 때 적합합니다.

##### Letta · LangGraph 장기 메모리

기억만이 아니라 에이전트 실행 구조까지 새로 정할 수 있다면 Letta를, 이미 LangGraph로 에이전트를 만들었고 간단한 저장·검색이면 충분하다면 LangGraph의 Store를 먼저 씁니다. Hindsight는 LangGraph 통합을 제공하므로, LangGraph 위에서 더 깊은 기억이 필요해지면 그때 연결할 수도 있습니다.

## Hindsight Recall 파이프라인 깊이 보기

> `recall()` 한 번이 질의 분석, 네 갈래 병렬 검색, RRF 결합, cross-encoder 재순위화, 보정 점수, 토큰 예산 패킹을 거쳐 결과가 되기까지를 실제 소스 코드와 함께 따라갑니다.

Recall은 Hindsight에서 가장 자주 호출되는 연산이고, `reflect`의 에이전트 루프와 Observation 통합도 내부에서 같은 검색을 씁니다. 그래서 recall이 어떻게 순위를 매기는지 알면 "왜 이 기억이 나왔고 저 기억은 안 나왔는가"를 설명할 수 있게 됩니다. 아래 코드 인용은 `hindsight-api-slim/hindsight_api/engine/search/` 아래 파일(2026년 10월, v0.10.2 기준)에서 가져왔습니다.

### 왜 검색을 네 갈래로 나누는가

질문의 종류마다 잘 맞는 검색 방식이 다릅니다.

| 질문 | 필요한 능력 | 담당 검색 |
|---|---|---|
| "민지의 직업이 뭐였지?" | 표현이 달라도 뜻이 같은 문장 찾기 | Semantic (벡터 유사도) |
| "주문번호 A-20391 건" | 정확한 문자열 일치 | Keyword (BM25) |
| "민지가 겪은 문제" | 민지라는 단어가 없어도 연결된 사실 찾기 | Graph (엔티티·의미·인과 연결) |
| "지난봄에 무슨 일이 있었지?" | 시간 표현을 날짜 범위로 바꿔 거르기 | Temporal (시간 범위) |

어느 하나도 모든 질문을 잘 처리하지 못하므로, Hindsight는 네 가지를 **모두 실행하고 결과를 합칩니다.** 공식 문서에서는 이 구성을 TEMPR라는 이름으로 설명합니다.

---

### 전체 흐름

```mermaid
flowchart TD
    Q[recall 요청<br/>query · budget · max_tokens · tags] --> T[시간 표현 추출<br/>CPU 작업, DB 접근 전]
    Q --> E[질의 임베딩]
    T --> S[저장소의 recall_unified 한 번 호출<br/>fact 타입별 네 갈래 검색]
    E --> S
    S --> C[갈래별 상한 자르기]
    C --> F[RRF 결합 k=60]
    F --> B[선택: 전략 부스트<br/>순위 공간에서 적용]
    B --> P[재순위화 후보 상한<br/>기본 300개]
    P --> X[Cross-encoder 재순위화<br/>점수를 0~1로 정규화]
    X --> M[보정 점수<br/>최신성 · 시간 근접 · 근거 수]
    M --> K[토큰 예산 패킹]
    K --> R[결과 반환]
```

---

### 1단계. 시간 표현 추출: 검색 전에 끝낸다

```python
# search/retrieval.py (요약)
temporal_constraint = None
if enable_temporal_retrieval:
    if temporal_window is not None:
        # 호출자가 범위를 이미 알고 있으면 분석하지 않는다
        temporal_constraint = (temporal_window.start, temporal_window.end)
    else:
        # 순수 CPU 작업이므로 이벤트 루프 밖에서 실행한다
        temporal_constraint = await extract_temporal_constraint_async(
            query_text, reference_date=question_date, analyzer=query_analyzer
        )
```

"지난봄", "2023년에", "작년" 같은 표현을 `(시작, 끝)` 날짜 범위로 바꿉니다. 기준 시각은 `query_timestamp`(없으면 서버 현재 시각)입니다. 이 단계에서 범위가 나오지 않으면 시간 검색 갈래는 아예 실행되지 않습니다.

여기서 알아 둘 점이 두 가지 있습니다.

- 소스 주석에 따르면 이 분석은 단일 워커에서 직렬로 도는 CPU 작업이라, 문서 길이의 질의 텍스트에서는 최대 1.3초 정도 걸릴 수 있습니다. 질의가 길거나 기간을 이미 알고 있다면 `temporalWindow`를 직접 넘기는 편이 빠릅니다.
- `temporalWindow`는 범위 밖 기억을 **버리는 필터가 아닙니다.** 범위 안 기억의 순위를 올리는 신호입니다. 특정 기간만 보고 싶다면 태그나 다른 필터를 함께 씁니다.

### 2단계. 네 갈래를 한 번의 저장소 호출로 실행한다

```python
# search/retrieval.py (요약)
unified = await get_memories().recall_unified(
    conn=pool, bank_id=bank_id, fact_types=fact_types,
    query_embedding=query_embedding_str, query_text=query_text,
    limit=thinking_budget,                 # budget(low/mid/high)이 정한 검색 깊이
    temporal_window=temporal_constraint,
    tags=tags, tags_match=tags_match,
    enable_text_search=enable_text_search,
    enable_graph=enable_graph_retrieval,
)
```

world·experience·observation 같은 fact 타입마다 네 갈래 결과를 한꺼번에 받아 옵니다. 갈래를 각각 따로 호출하지 않고 저장소 인터페이스 하나(`recall_unified`)로 모은 덕분에, PostgreSQL에서는 SQL 조합으로, 자체 인덱스를 가진 저장소에서는 단일 질의로 구현할 수 있습니다.

각 갈래가 하는 일은 다음과 같습니다.

- **Semantic**: pgvector 등의 근사 최근접 검색. 후보 수만큼 `hnsw.ef_search`를 맞춥니다(최대 1000).
- **Keyword**: 다섯 가지 백엔드 중 하나. 기본 `native`는 PostgreSQL `tsvector` + `ts_rank_cd`로, 엄밀한 BM25가 아니라 TF-IDF 계열입니다. 진짜 BM25가 필요하면 `vchord`, `pg_search`(ParadeDB, Citus 호환), `pgroonga`, `pg_textsearch`를 고릅니다.
- **Graph**: 질의와 엔티티를 공유하거나 의미·인과 연결로 이어진 기억을 찾습니다.
- **Temporal**: 범위 안 기억을 **최신순이 아니라 질의 관련도 순**으로 고르고, 범위를 시간 구간으로 나눠 각 구간의 최선 후보부터 뽑습니다. "2023년에 무슨 일이"에 12월 기억만 몰려 나오지 않게 하기 위해서입니다.

`budget`은 이 단계의 깊이를 정합니다.

| budget | 검색 깊이(고정 모드) | 영향 |
|---|---|---|
| `low` | 100 | 각 갈래 SQL의 `LIMIT`, 그래프 탐색 노드 수 |
| `mid` (기본) | 300 | 위와 같음 |
| `high` | 1000 | 위와 같음. 여러 단계 건너 연결된 사실까지 탐색 |

`HINDSIGHT_API_RECALL_BUDGET_FUNCTION=adaptive`로 바꾸면 `max_tokens`에 비례해(low 2.5%, mid 7.5%, high 25%) 20~2000 사이에서 정해집니다.

### 3단계. RRF로 합친다: 점수가 아니라 순위로

```python
# search/fusion.py (요약)
def reciprocal_rank_fusion(result_lists, k: int = 60):
    source_names = ["semantic", "bm25", "graph", "temporal"]
    for source_idx, results in enumerate(result_lists):
        for rank, retrieval in enumerate(results, start=1):
            doc_id = retrieval.id
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + 1.0 / (k + rank)
            source_ranks[doc_id][f"{source_names[source_idx]}_rank"] = rank
    # rrf_score 내림차순으로 정렬해 MergedCandidate 목록을 만든다
```

갈래마다 점수 체계가 다릅니다. 코사인 유사도 0.85와 BM25 12.5는 같은 척도가 아니어서 더하거나 비교할 수 없습니다. RRF는 점수를 버리고 **각 갈래 안의 순위만** 씁니다.

```text
score(d) = Σ 1 / (60 + rank_i(d))     (d가 등장한 갈래 i에 대해서만 합산)

의미 검색 1위 + 키워드 5위인 기억 : 1/61 + 1/65 = 0.0318
의미 검색 1위에만 있는 기억       : 1/61         = 0.0164
```

여러 갈래가 동시에 찾은 기억이 위로 올라갑니다. "합의(consensus)"가 곧 관련성의 증거가 되는 구조입니다. 네 갈래의 가중치는 같고, 결합 전에 `cap_per_source`로 갈래별 결과 수를 잘라 한 갈래가 후보 풀을 독차지하지 못하게 합니다.

#### 선택 단계: 전략 부스트는 왜 "순위 공간"에서 적용할까

`HINDSIGHT_API_RECALL_STRATEGY_BOOSTS=graph:high`처럼 특정 갈래를 우대할 수 있습니다. `search/recall_boost.py`의 주석은 이 기능이 왜 지금 모양이 되었는지 설명합니다.

- 처음에는 해당 갈래의 RRF 기여분 `1/(k+rank)`에 가중치 `w`를 곱했습니다(일반적인 weighted RRF).
- 그런데 k=60인 RRF는 300개 후보 구간 전체에서 점수 폭이 `1/61 → 1/360`, 약 5.9배밖에 되지 않습니다. `high`의 가중치 7은 이 폭을 넘어서, 정렬이 사실상 "부스트된 갈래가 무조건 먼저"로 바뀌었고, 큰 bank에서는 300개 자리를 그 갈래가 모두 차지했습니다.
- 그래서 지금은 점수를 곱하는 대신 **순위를 나눠서**(`rank / rank_divisor`) 그 갈래 후보가 더 높은 순위에 있었던 것처럼 계산합니다. 다른 갈래의 상위 결과를 밀어내지 않으면서 우대한 갈래를 더 깊이 살릴 수 있습니다.

이 부스트는 RRF 점수 자체를 바꾸지 않고, 재순위화 후보를 자르기 직전과 cross-encoder 재순위화 직후에만 적용됩니다.

### 4단계. Cross-encoder 재순위화

RRF는 질의와 기억을 실제로 함께 읽지 않습니다. 키워드 갈래에서 흔한 단어 덕분에 1위가 된, 의도와 무관한 기억도 위에 남을 수 있습니다. 그래서 상위 후보만 골라 cross-encoder가 **(질의, 기억) 쌍을 함께 읽고** 관련도를 다시 매깁니다.

- **후보 상한**: RRF 상위 300개(`HINDSIGHT_API_RERANKER_MAX_CANDIDATES`)만 재순위화합니다. 이 값은 `budget`과 **독립적**이라, `high`로 1000개를 찾아도 재순위화는 300개까지만 됩니다.
- **점수 정규화**: 이미 0~1 범위인 점수(Cohere, Jina 같은 외부 재순위화 API)는 그대로 쓰고, 범위 밖의 원시 logit은 시그모이드 `1 / (1 + e^-x)`로 0~1로 바꿉니다.
- **배치**: 로컬 모델은 32쌍, TEI는 128쌍씩 처리합니다.
- **재순위화 모델이 없을 때**: slim 이미지에 외부 재순위화를 연결하지 않았다면, RRF 순위를 0.1~1.0 사이의 합성 점수로 바꿔 다음 단계가 계속 동작하게 합니다.

기본 모델은 `cross-encoder/ms-marco-MiniLM-L-6-v2`이고, 공식 문서는 CPU에서는 이 단계가 recall 지연의 주된 병목이라고 설명합니다. 운영에서 recall이 느리면 GPU나 외부 재순위화 서비스로 옮기거나 `budget`을 낮추는 것이 첫 번째 조치입니다.

### 5단계. 보정 점수: 관련도를 넘지 않게 곱한다

```python
# search/reranking.py (요약)
_RECENCY_ALPHA = 0.2
_TEMPORAL_ALPHA = 0.2
_PROOF_COUNT_ALPHA = 0.1   # 근거 수는 보수적으로 최대 ±5%

recency_boost     = 1 + recency_alpha     * (recency     - 0.5)
temporal_boost    = 1 + temporal_alpha    * (temporal    - 0.5)
proof_count_boost = 1 + proof_count_alpha * (proof_norm  - 0.5)
combined_score    = CE_normalized * recency_boost * temporal_boost * proof_count_boost
```

| 신호 | 계산 | 최대 영향 |
|---|---|---|
| 최신성 | 기준 시각부터 365일에 걸쳐 1.0 → 0.1로 선형 감소. 날짜 없으면 0.5 | ±10% |
| 시간 근접성 | 질의에 시간 표현이 있을 때만. 범위 중심 1.0, 경계 0.0, 그 외 0.5 | ±10% |
| 근거 수 | Observation에만 적용. `0.5 + ln(proof_count)/10`을 0~1로 자름 | ±5% |

세 신호가 모두 최대여도 약 +27%, 모두 최소여도 약 -23%입니다. **더하지 않고 곱하는 이유**가 핵심입니다. `CE + 0.1 × 최신성`처럼 더하면 관련 없는 최신 기억이 관련 높은 옛 기억을 앞지를 수 있습니다. 곱하면 보정 폭이 원래 관련도에 비례하므로, 부가 신호가 관련도 판단을 뒤집지 못합니다. 최신성 곡선은 `exponential`(기본 반감 기준 90일)이나 `none`으로 바꿀 수 있습니다.

### 6단계. 토큰 예산 패킹

```text
final_score 내림차순으로 정렬
 → 위에서부터 기억 텍스트의 토큰 수를 더해 max_tokens(기본 4096)까지 채움
 → 남은 예산보다 긴 기억은 건너뛰고 다음 기억으로 계속
 → 하나도 들어가지 않으면 1위 기억 하나는 통째로 반환
```

에이전트는 컨텍스트를 "몇 개"가 아니라 "몇 토큰"으로 계산하므로 결과도 토큰 예산으로 받습니다. 메타데이터는 예산에 포함되지 않고 기억 텍스트만 셉니다. 긴 기억 하나 때문에 뒤의 짧은 기억들을 잃지 않도록 건너뛰기 방식으로 채우는 점도 눈여겨볼 만합니다.

---

### 그래프 갈래의 점수는 왜 더할까

보정 점수는 곱하는데, 그래프 갈래 내부 점수는 세 신호를 **더합니다.**

```text
graph_score = tanh(공유 엔티티 수 × 0.5) + 의미 연결 가중치(0.7~1.0) + 인과 연결 가중치(0~1.0)
```

- 그래프 신호들은 "기본 점수를 조정하는 값"이 아니라 **서로 독립된 증거 경로**입니다. 인과 연결로만 이어진 기억은 공유 엔티티가 0인데, 곱하면 점수가 0이 되어 사라집니다.
- 공유 엔티티 수에 `tanh`를 씌우는 이유는 "사용자" 같은 흔한 엔티티가 50개씩 겹쳐 다른 신호를 덮는 것을 막기 위해서입니다. 1개면 0.46, 2개면 0.76, 3개면 0.91로 빠르게 포화됩니다.

같은 파이프라인 안에서도 "독립 증거는 더하고, 보조 신호는 곱한다"는 원칙이 일관되게 적용되어 있습니다.

### 같은 검색을 다른 목적에 쓸 때: 통합용 interleave 결합

`search/fusion.py`에는 RRF 말고 `interleave_fusion`도 있습니다. Observation 통합에서 "새 사실과 거의 같은 기존 Observation"을 찾을 때 쓰입니다.

RRF는 여러 갈래의 순위를 합산하므로, 의미 검색에서 1위지만 다른 갈래에는 없는 기억이 평균에 묻혀 밀려납니다. 통합에서는 바로 그 기억이 합쳐야 할 쌍둥이인 경우가 많아서, 놓치면 중복 Observation이 생깁니다. interleave는 각 갈래의 1위, 각 갈래의 2위 순서로 번갈아 뽑아 **모든 갈래의 상위 결과에 자리를 보장**합니다. 사용자 질의에는 합의를 중시하는 RRF가, 중복 탐지에는 어느 한 갈래의 강한 신호도 놓치지 않는 interleave가 맞다는 판단입니다.

---

### 실전에서 recall을 다루는 방법

**결과를 이해하려면 trace부터 켭니다.**

```ts
const res = await client.recall('support::c-1024', '지난봄 결제 문제', { budget: 'mid', trace: true });
// trace에는 단계별 시간, 갈래별 순위, 재순위화 후보에서 잘린 개수 등이 들어 있다
```

**질문 성격에 맞게 두 축을 따로 조절합니다.** `budget`은 얼마나 깊이 찾을지, `maxTokens`는 얼마나 많이 돌려받을지입니다. 챗봇 응답은 `low` + 2048 안팎, 여러 단계 연결을 따라가야 하는 분석 질의는 `high` + 8192처럼 조합합니다.

**필요 없는 갈래는 bank 단위로 끕니다.** 시간 표현이 없는 도메인이면 `enableTemporalRetrieval: false`로 시간 분석 비용을 없애고, 순수 벡터 검색만 원하면 `enableTextSearch: false`로 키워드 갈래를 SQL에서 아예 뺍니다. 재순위화 없이 RRF 순서를 그대로 쓰려면 `enableReranking: false`입니다.

**품질이 낮은 결과는 하한으로 자릅니다.** `minScores: { semantic: 0.2, final: 0.5 }`처럼 단계별 최소 점수를 둘 수 있습니다. semantic·keyword는 검색 단계에서, reranker·final은 재순위화 뒤에 적용됩니다.

**Observation과 원본 fact가 겹치면 하나만 받습니다.** `types`에 observation과 world·experience를 함께 넣고 `preferObservations: true`를 주면, 반환된 Observation의 근거가 된 원본 fact는 빠집니다. 같은 내용이 두 번 프롬프트에 들어가는 것을 막습니다.

## Hindsight 주의할 점과 FAQ

> 운영하면서 신경 써야 할 비용·보안·데이터 격리·성능·버전 문제와, 처음 쓸 때 자주 헷갈리는 질문을 다룹니다.

### 사용할 때 주의할 점

**비용**
- `retain`마다 사실 추출 LLM 호출이 일어나고, 통합·Mental Model·Knowledge Page 갱신도 LLM을 씁니다. 공식 문서는 추출에 큰 모델이 필요 없다고 보고 작은 고속 모델(예: Groq의 gpt-oss-20b)을 권합니다. `HINDSIGHT_API_RETAIN_LLM_*`, `HINDSIGHT_API_REFLECT_LLM_*`, `HINDSIGHT_API_CONSOLIDATION_LLM_*`로 연산마다 다른 모델을 지정할 수 있습니다.
- Mental Model과 Knowledge Page는 갱신 한 번이 합성 한 번입니다. `refreshAfterConsolidation`은 가장 최신이지만 가장 비쌉니다. 대시보드용이면 cron 갱신으로도 충분한 경우가 많습니다.
- retain 한 건당 정확한 LLM 호출 수와 토큰 비용은 공식 문서에 고정값으로 나와 있지 않습니다. 내용 길이, 추출 모드, 청크 크기에 따라 달라지므로 Prometheus 메트릭의 LLM 호출·토큰 수로 직접 측정합니다.

**성능**
- 쓰기는 느리고 읽기는 빠르게 설계되었습니다. 사용자 응답 경로에서는 `retain`을 `async: true`로 보내고, `recall`만 동기로 기다립니다.
- recall 지연의 주된 병목은 CPU에서 도는 cross-encoder입니다. GPU, 외부 재순위화 서비스, 낮은 `budget`으로 줄입니다. 자세한 내용은 [Recall 파이프라인 깊이 보기](#h-4단계-cross-encoder-재순위화)에 있습니다.
- 전체 이미지는 내장 임베딩·재순위화 모델 때문에 메모리를 최소 1.5GB, 권장 2GB 씁니다. slim 이미지는 512MB~1GB지만 외부 임베딩·재순위화 제공자가 필요합니다.

**보안**
- REST API와 MCP 엔드포인트 모두 **기본으로 인증이 꺼져 있습니다.** 로컬 밖에 노출한다면 `ApiKeyTenantExtension` 등으로 인증을 켜고, 네트워크에서도 내부망으로 제한합니다.
- bank ID를 요청 본문이나 쿼리 문자열에서 그대로 받으면 다른 사용자의 기억을 조회하는 통로가 됩니다. bank ID는 항상 인증된 세션에서 서버가 만듭니다.
- 비밀값·개인정보 마스킹(Memory Defense)은 bank별 **옵트인**입니다. 켜면 45개 정규식 패턴으로 API 키, DB 연결 문자열, 일부 PII를 `[REDACTED:type]`로 바꾸거나 항목을 차단합니다. 다만 켠 이후의 retain에만 적용되고 기존 기억은 다시 검사하지 않으며, PII 패턴은 미국 형식이 기본입니다. 주민등록번호 같은 한국 형식은 저장 전에 애플리케이션에서 직접 걸러야 합니다.
- Webhook은 비밀값을 등록하고 `X-Hindsight-Signature-V2`(타임스탬프 포함)로 검증합니다. 같은 이벤트가 두 번 올 수 있으므로(at-least-once) `operation_id`로 중복을 거릅니다.
- 코딩 에이전트 패키지는 기본 저장 위치가 Hindsight Cloud입니다. 회사 코드를 다룬다면 `self-hosted`나 `daemon` 모드와 `optInOnly`를 검토합니다.

**데이터 품질**
- `documentId` 없이 같은 내용을 다시 retain하면 매번 새 문서가 되어 기억이 중복됩니다. 반대로 같은 `documentId`를 기본값(`replace`)으로 다시 보내면 **이전 내용과 그 기억이 지워집니다.** 대화처럼 늘어나는 문서는 `updateMode: 'append'`를 씁니다.
- `retainMission`을 좁게 잡으면 아무 사실도 추출되지 않는 문서가 생기고, 그 문서는 recall·reflect로 찾을 수 없습니다. `retain.completed` Webhook의 `memory_unit_count: 0`이나 `outcome="no_facts"` 메트릭으로 감시하고, 미션을 넓힌 뒤 reprocess 엔드포인트로 다시 추출합니다.
- 엔티티 정규화는 이름 유사도 기반 판단이라, 기록이 많은 bank에서는 이름이 비슷한 다른 사람이 기존 엔티티에 합쳐질 수 있습니다. 중요한 엔티티는 retain의 `entities`로 명시하거나 엔티티 매칭을 더 엄격하게 설정합니다.
- 세션 ID처럼 매번 바뀌는 태그를 붙이면 Observation이 세션마다 따로 생깁니다. `observationScopes: 'shared'`로 통합 범위를 분리합니다.

**운영**
- 내장 pg0는 개발용입니다. 운영은 PostgreSQL 14 이상 + 벡터 확장을 따로 둡니다.
- `HINDSIGHT_API_WORKER_ID`를 고정하지 않으면 재시작 후 처리 중이던 작업이 남겨집니다. 워커를 줄이기 전에는 `hindsight-admin decommission-worker`로 작업을 반납합니다.
- Observation 근사 중복 정리는 PostgreSQL에서만 동작하고 Oracle에서는 건너뜁니다. README는 Oracle AI Database를 기능 동등으로 소개하지만, 이처럼 문서 곳곳에 저장소별 차이가 있으므로 Oracle을 쓸 계획이라면 해당 항목을 따로 확인합니다.

**Breaking Change와 Deprecated 사용 방식 (2026년 10월 기준)**
- v0.10.0에서 bank profile·background 엔드포인트가 제거되었습니다. `getBankProfile()`은 서버에서 410을 돌려주므로 `getBankConfig()`로 바꿉니다.
- `createBank`의 `name`, `mission`, `background`, `disposition` 옵션은 Deprecated입니다. `reflectMission`을 쓰고, 성향은 `updateBankConfig({ dispositionSkepticism, dispositionLiteralism, dispositionEmpathy })`로 지정합니다. 공식 예제 중에도 옛 옵션을 쓰는 코드가 남아 있으니 그대로 복사하지 않습니다.
- Supabase 테넌트 확장은 내장 모듈에서 별도 확장 이미지(`hindsight_ext_supabase_tenant`)로 옮겨졌습니다. 옛 경로를 쓰는 설치는 시작 시 `ModuleNotFoundError`가 납니다.
- 코딩 에이전트 설정의 `autoReflect`는 Deprecated이고 `autoInject`로 대체되었습니다.
- 릴리스가 1~3주 간격으로 나오므로, Docker 태그와 패키지 버전은 `latest` 대신 검토한 버전으로 고정하고 업그레이드할 때 릴리스 노트를 확인합니다.

**라이선스**
MIT 라이선스입니다. 자체 호스팅과 수정에 제약이 적습니다. Hindsight Cloud는 별도 유료 서비스(사용량 기반 과금, 시작 시 무료 크레딧)이며 세부 요금은 공식 가격 페이지에서 확인해야 합니다.

---

### 자주 헷갈리는 부분

#### Q. Hindsight는 벡터 DB인가요?

아닙니다. 벡터 검색은 네 갈래 검색 중 하나일 뿐이고, 저장소는 PostgreSQL(+ pgvector 등)입니다. Hindsight는 그 위에서 **사실 추출, 엔티티 그래프, 시간 해석, 통합, 추론**을 담당하는 메모리 서버입니다. 벡터 DB를 대체한다기보다 "벡터 DB로 메모리를 직접 만들던 코드"를 대체합니다.

#### Q. recall과 reflect 중 무엇을 써야 하나요?

내 애플리케이션이 이미 답을 만드는 LLM을 갖고 있다면 `recall`로 기억을 가져와 프롬프트에 넣는 것이 기본입니다. LLM 호출이 없어서 빠르고 저렴합니다. "이 고객에게 무엇을 제안할까"처럼 **판단까지** Hindsight에 맡기고 싶을 때, 또는 bank의 mission·directive·성향을 일관되게 적용하고 싶을 때 `reflect`를 씁니다. 같은 질문을 반복해서 묻는다면 둘 다 아니고 Mental Model을 만들어 읽습니다.

#### Q. Observation과 Mental Model은 무엇이 다른가요?

Observation은 통합 과정이 **자동으로** 만드는 한 줄짜리 믿음이고, 사실 묶음마다 하나씩 생깁니다. Mental Model은 개발자가 **질문을 정해서** 만드는 문서이고, 그 질문에 대한 답을 Observation과 사실을 재료로 써 둡니다. reflect는 Mental Model → Observation → 원본 fact 순서로 내려가며 찾습니다.

#### Q. 사용자를 bank로 나눌까요, 태그로 나눌까요?

섞이면 안 되는 단위는 bank로 나눕니다. 태그 필터의 기본 `tagsMatch: 'any'`는 **태그가 없는 기억도 함께 돌려주기 때문에**, 실수로 태그 없이 저장된 기억이 다른 사용자 결과에 섞일 수 있습니다. 태그는 한 사용자 안에서 "강의별", "프로젝트별"처럼 검색 범위를 좁히는 용도로 쓰고, 태그로 격리해야 한다면 `any_strict`·`all_strict`·`exact`를 씁니다.

#### Q. 기억이 틀리면 어떻게 고치나요?

원본 fact는 보존되므로, 잘못된 문서나 기억을 지우면 거기서 나온 Observation도 함께 삭제되고 남은 근거로 다시 통합됩니다. 사실이 바뀐 경우라면 지우지 말고 새 사실을 retain하는 것이 맞습니다. Observation은 "예전에는 A였지만 지금은 B"처럼 변화를 기록하도록 설계되어 있습니다. Mental Model은 버전 이력이 남으므로 무엇이 언제 바뀌었는지 확인할 수 있습니다.

#### Q. retain한 직후에 recall하면 바로 나오나요?

동기 retain(`async: false`)이 끝났다면 추출된 fact는 바로 검색됩니다. 하지만 Observation 통합과 Mental Model 갱신은 그 뒤 백그라운드에서 일어나므로 몇 초에서 그 이상 늦게 반영됩니다. 비동기 retain은 작업이 큐에서 처리된 뒤에 보이며, operations API로 진행 상황을 확인할 수 있습니다.

#### Q. 로컬 모델만으로 쓸 수 있나요?

됩니다. LLM은 Ollama, LM Studio, vLLM 같은 OpenAI 호환 서버를, 임베딩과 재순위화는 전체 이미지에 내장된 로컬 모델을 쓰면 외부 API 없이 동작합니다. 다만 사실 추출에는 출력 토큰 한도가 충분한 모델이 필요하고, 작은 모델에서는 추출 품질이 기억 품질을 직접 좌우합니다. Docker 이미지에는 llama.cpp가 없으므로 추론 서버는 별도 컨테이너로 띄웁니다.

#### Q. 벤치마크 점수를 그대로 믿어도 되나요?

논문과 README의 LongMemEval·LoCoMo 수치는 대화형 장기 기억 과제에 대한 결과입니다. README는 자사 결과가 외부에서 재현되었고 다른 시스템 점수는 벤더 자체 보고라고 밝히지만, 그 과제가 내 서비스의 데이터와 질문 유형을 대표한다는 보장은 없습니다. 실제 대화 로그 일부로 "기억이 필요한 질문"을 만들어 직접 비교해 보는 것이 가장 확실합니다.

## 원본 저장소

[vectorize-io/hindsight](https://github.com/vectorize-io/hindsight)
