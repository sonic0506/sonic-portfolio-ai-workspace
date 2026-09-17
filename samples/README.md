# Sample Content

Roadmap Phase 4(샘플 데이터 + PoC)용 실제 콘텐츠다. 설계 문서가 아니라 **데이터**이므로 SSOT인 `docs/` 밖에 둔다.
데이터 모델 검증과 RAG PoC 색인 입력으로 사용한다.

## 구성

| 파일 | 종류 | 공개 | 출처 |
|---|---|---|---|
| `projects/viora.md` | 대표 프로젝트 | 공개 | 사용자 제공 (진행 중) |
| `projects/yujin-robot.md` | 대표 프로젝트 | 공개 | 사용자 제공 |
| `projects/syncmaster.md` | 대표 프로젝트 | 공개 | 사용자 제공 |
| `blog/websocket-binary-video.md` | 블로그 | 공개 | **AI 작성 샘플 초안** |
| `blog/web-serial-usb.md` | 블로그 | 공개 | **AI 작성 샘플 초안** |
| `blog/offline-first-boundary.md` | 블로그 | **비공개(Draft)** | **AI 작성 샘플 초안** |
| `skills.md` | 공통 Skill 목록 | — | 위 콘텐츠에서 추출 |

블로그 3편은 프로젝트 내용에서 파생해 AI가 작성한 초안이다. 사실관계는 프로젝트 서술 범위를 넘지 않으며 수치를 만들지 않았다.
**실제 발행 전 본인 문체와 사실 확인이 필요하다.** front matter의 `sample: true`로 구분한다.

`blog/offline-first-boundary.md`는 RAG의 공개 범위 필터를 검증하려고 의도적으로 비공개로 뒀다(RAG-007).
공개 글 `web-serial-usb`가 이 비공개 글을 `related_blogs`로 참조하므로, Public 링크와 Relation 확장에서 제외되는지 확인할 수 있다.

## Relation

```text
yujin-robot  ──▶ websocket-binary-video
syncmaster   ──▶ web-serial-usb ──▶ offline-first-boundary (비공개)
syncmaster   ──▶ offline-first-boundary (비공개)
```

화살표는 "참고한다"는 뜻이다(ADR-0005 후속 결정, 2026-09-17). front matter의 `related_projects`/`related_blogs`는 그 문서가 **참고하는** 문서만 적는다. 이전에 양쪽 문서에 중복으로 적었던 연결은 위 방향 하나로 정리했다.

## 추천 질문 블록 — 문법 후보

CONTENT_SPEC에서 저장 문법이 미정이므로 아래를 후보로 사용한다. remark-directive의 컨테이너 문법이라 파서를 직접 만들지 않아도 된다.

```markdown
:::questions
- 질문 1
- 질문 2
:::
```

본문 내 위치가 곧 표시 위치다. 별도 위치 필드를 두지 않는다.

## 샘플로 확인된 데이터 모델 공백

실제 콘텐츠를 넣어보니 CONTENT_SPEC / DATA_MODEL에 다음이 빠져 있다.

1. **소속(organization)** — 3건 모두 값이 있는데(사내 프로덕트 / 프리랜서) 기본 정보 목록에 없다.
2. **기여도의 단서** — 유진로봇은 "담당 3개 컴포넌트 100%"처럼 숫자만으로는 오해를 부른다. 숫자와 별개로 주석 필드가 필요하다.
3. **진행 중 상태** — 비오라는 종료일이 없다. 기간을 단일 문자열로 두면 정렬과 "진행 중" 표시가 어렵다. 시작/종료 분리 + null 허용.
4. **정렬 키** — 유진로봇과 싱크마스터의 기간이 완전히 같다(2024.11–2025.04). 기간만으로 목록 정렬이 결정되지 않는다.
5. **관리자 전용 메모** — 각 파일의 `open_questions`는 확인이 필요한 항목이다. Public에 노출되면 안 되고 RAG 색인에도 들어가면 안 된다. Admin 전용 필드 구분이 필요하다.
6. **공개 글 → 비공개 글 링크** — Relation은 존재하지만 Public과 RAG 양쪽에서 숨겨야 한다. 필터를 조회 시점에 적용할지 색인 시점에 적용할지 결정이 필요하다.
7. **섹션 길이 편차** — "역할·기여도"는 표 몇 줄, "기술 선택 이유"는 여러 문단이다. 섹션 1개 = 청크 1개 고정은 성립하지 않는다(CONTENT_SPEC 5절과 일치).
8. **Skill 참조 키** — front matter가 표시명 문자열(`Web Serial API`)로 연결돼 있다. id와 표시명 분리가 필요하다. `STT`/`LLM`/`TTS`는 Skill인지 파이프라인 단계인지 미정.

이 8개는 ERD 초안에서 해소한다.
