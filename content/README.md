# Real Content

실제 포트폴리오 데이터다. `samples/`는 테스트·RAG 측정 기준용 샘플로 그대로 두고, 이 폴더를 개발·운영 DB에 넣는다.

```bash
./gradlew bootRun --args='--spring.profiles.active=local --app.seed.samples-dir=../content'
```

형식은 `samples/`와 같다(front matter + `## ` 섹션, `skills.md`, `taxonomy.md`). `profile.md`가 없으므로 프로필은 건드리지 않는다. 운영 DB에 넣는 방법은 `deploy/README.md` 3절.

## 다시 만들기 (2026-10-04)

원본은 사용자 제공 Notion 위키다. 손으로 고치지 말고 위키를 고친 뒤 변환기를 다시 돌린다.

```bash
python3 content/convert_wiki.py "/Users/hyeongkyupark/Downloads/원티드 프로젝트/notion-wikis" "/Users/hyeongkyupark/Downloads/sonic-study-notes/notes" \
  "/Users/hyeongkyupark/Downloads/ai-projects/ai-github-study-automation/learning-notes"
```

`projects/`·`blog/`를 지우고 새로 만들며 `skills.md`·`taxonomy.md`도 다시 쓴다. 기존 스킬 code는 유지한다. 위키에 새 프로젝트나 결정 문서가 생기면 `convert_wiki.py` 위쪽 표(`PROJECTS`, `BLOGS`)에 slug·카테고리·태그를 먼저 추가한다(없으면 변환이 실패한다).

## 변환 규칙

- `<프로젝트>/README.md`는 프로젝트, 그 README의 `결정사항 / 트러블슈팅` 섹션에 링크된 `decisions/*.md`는 블로그다. 링크되지 않은 파일(`references/fsd-notes.md`)과 가상 프로젝트 `template/`은 제외한다.
- `결정사항 / 트러블슈팅` 섹션은 지우고, 링크는 프로젝트의 `related_blogs`(참고 문서)로, 링크 아래 들여쓴 설명 문단은 블로그 `summary`로 옮긴다. 목록 뒤의 안내 문단에 걸린 다른 프로젝트 글 링크(EVAR→브링앤티)도 프로젝트의 참고 문서로 잇는다.
- 프로젝트: 제목은 H1, `summary`는 `프로젝트 개요` 첫 문단, `highlights`는 `주요 성과`(없으면 `학습 내용`)의 굵은 제목. 개요 표의 `기간`·`주요 기술`은 front matter(`period_*`, `skills`)로 옮기고 표에서 뺀다(`(본인 참여 기간)` 같은 괄호 설명은 사라진다). `나의 역할`은 `position`에도 넣고 표에 남긴다. `진행 중`이면 `ongoing`.
- 스킬: 괄호·`백엔드:` 같은 묶음 이름을 떼고 `,`/`/`로 나눈다. `FSD`는 기술이 아니라 태그로 둔다. 표기 통일은 `SKILL_ALIASES`(예: `Java Spring 환경`→`Spring`, `Material-UI`→`MUI`, 모델명→`OpenAI`). 블로그 `skills`는 해당 프로젝트 기술 중 본문에 나오는 것.
- 블로그: 제목은 H1, 첫 `##` 앞 요약 표는 `## 개요`로 감싼다(시드는 첫 `##` 앞을 버린다). `프로젝트 본문으로 돌아가기` 링크는 뺀다. 같은 프로젝트의 다른 결정 문서로의 링크는 텍스트로 바꾸고 `related_blogs`로 잇는다. 제외된 파일로의 링크는 관리자 메모(`open_questions`)로 옮긴다.
- 이미지(`![..](..)`)는 이미지 업로드 기능이 없어 빼고 개수를 관리자 메모에 남긴다(AI 개발자 포트폴리오 8개, 블로그 2개).
- 블로그 작성일은 모두 변환일 2026-10-04. featured는 시작 시기 최근 3건(ai-portfolio, viora, bring-and-t). 프로젝트 순서는 시작 시기 최근 순(파일명 번호).
- `organization`은 VIORA(슬로그업)만 넣는다(회사명 공개 여부 미정, 2026-09-28 규칙 유지). `contribution`·`links`는 원본에 없어 비운다.
- 카테고리(2026-10-05 사용자 결정): 경험 글은 결정 문서의 "유형"에 따라 `트러블슈팅`·`기술선택`·`협업`으로 나눈다(5·13·6). 학습 글은 `프론트엔드`·`백엔드`·`AI`·`아키텍처`·`배포·인프라`·`AI 도구`. 이전의 `UX·화면 흐름`·`하드웨어`는 비어서 지웠다. `taxonomy.md`의 `rag` 열로 경험 카테고리만 채팅 근거로 쓴다(ADR-0018).

## 학습 노트 (2026-10-05)

원본은 `sonic-study-notes/notes/*.md`(Obsidian llm-wiki, 59개). 두 원본은 태그 표를 함께 쓰므로 위 명령으로 같이 만든다.

- 노트 하나가 블로그 하나다. slug는 파일 이름, 제목은 H1, `created_at`은 `created`. **본문은 그대로** 두고 상위 메타데이터와 H1만 뺀다(변환 후 링크 문법을 걷어 내면 원문과 글자까지 같음을 확인했다).
- 공개(`status: draft`여도 공개, 사용자 결정 D1). 채팅 근거 포함(D4)은 ADR-0018로 바뀌어, 학습 카테고리는 채팅 근거에서 빠진다.
- 카테고리는 노트 태그로 기존 카테고리에 나눈다(D2): `ai`→AI, `architecture`→아키텍처, `devops`→배포·인프라, `frontend`→프론트엔드, `api`·`network`→백엔드. 태그는 노트 태그 그대로(기존 태그와 code가 같으면 그 태그로 합침: `embedding`→`임베딩`). `skills`는 비운다(실제 경험만 기술에 잇는다).
- 위키링크 `[[x|글자]]`(표 안의 `[[x\|글자]]` 포함)는 `[글자](/blog/x)`, 글자 없는 `[[x]]`는 연결된 노트의 제목으로 바꾼다(D3). 코드 블록 안의 `[[ ]]`는 그대로 둔다. 없는 노트를 가리키면 변환이 멈춘다.
- 참고 관계(`related_blogs`)는 `prerequisites` + `related` + 본문 링크를 합친 것(중복·자기 자신 제외, 220개).
- `summary`는 첫 섹션 첫 문단에서 링크·굵게 표시를 뺀 글이다. `aliases`·`status`는 쓰지 않는다.
- 노트에 많은 `**용어(영문)**은` 같은 굵게 표시는 CommonMark만으로는 깨져서, 포트폴리오 마크다운에 `remark-cjk-friendly`를 더했다.

## AI 도구 학습 노트 (2026-10-05)

원본은 `ai-github-study-automation/learning-notes/<도구>/`(README + 01~08장, 도구 15종, 메타데이터 없음). 사용자 결정(추천안): 도구 하나를 블로그 하나로 합친다.

- slug는 폴더 이름, 제목은 README H1, `summary`는 README의 한 줄 소개 인용문. 카테고리는 새 `AI 도구`, 태그·기술·참고 관계는 없다(도구끼리 링크하지 않음).
- 본문 순서: README의 첫 `##` 앞 글을 `## 개요`로, README 섹션들, 각 장(장 H1→`##`, 장 안 제목은 한 단계씩 내림: `##`→`###`), 끝에 `## 원본 저장소`(GitHub 링크) 섹션을 더한다.
- 지우는 것: README의 `문서 목차` 섹션, README·각 장 끝의 `---` + `← 이전 · 목차 · 다음 →` 줄(합친 글은 블로그 목차가 대신한다).
- 다른 장으로의 링크(`07-x.md`, `07-x.md#제목`)는 같은 글 안 이동 링크(`#h-…`, `lib/headings.ts`와 같은 규칙)로 바꾼다. `#제목`이 원래 `###`(합친 뒤 `####`, id 없음)이면 장 제목으로 보낸다(6곳, 변환 때 출력).
- 작성일은 원본 저장소 `studies/<owner>__<도구>.md`의 `studiedAt`, 없으면 `data/registry.json`의 저장소 이름 + README가 git에 추가된 날. GitHub 주소도 여기서 가져온다.
- 바뀌는 것은 제목 단계·지운 길 안내·링크 주소뿐이고, 그 셋을 걷어 내면 원문과 글자까지 같음을 확인했다.
- 코드 블록은 ```` 처럼 더 긴 펜스로 ``` 를 감싸기도 해서, 변환기는 같은 문자·같거나 긴 펜스로만 블록을 닫는다. 시드(`SampleMarkdown`)도 코드 블록 안의 `## ` 줄로는 섹션을 나누지 않게 고쳤다(`rag-chunking` 예시 코드가 섹션으로 쪼개지던 문제).

## 이전 변환 (2026-09-28)

같은 위키의 이전 판에서 프로젝트 7·블로그 12를 손으로 옮겼다. 2026-10-04 사용자 결정으로 모두 지우고 위 규칙으로 다시 만들었다(프로젝트 13·블로그 24·참고 관계 25). 2026-10-05 학습 노트를 더해 블로그 83·참고 관계 245·문서 96, 같은 날 AI 도구 15개와 EVAR→브링앤티 참고 2개를 더해 블로그 98·참고 관계 247·문서 111.
