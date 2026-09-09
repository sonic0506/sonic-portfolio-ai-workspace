# Document Rules

## 1. 기본 작성 규칙

- Markdown을 사용한다.
- 한 문서는 하나의 명확한 역할을 가진다.
- 결정된 내용과 후보/검토 중 내용을 구분한다.
- `TBD`를 남길 경우 이유와 결정 시점을 함께 적는다.
- 동일 내용을 여러 문서에 복제하기보다 기준 문서를 링크한다.

## 2. 상태 표현

필요한 경우 다음 상태를 사용한다.

- `Draft`
- `Proposed`
- `Accepted`
- `Deprecated`
- `Superseded`

## 3. 변경 기록

중요 변경은 다음 중 하나 이상에 남긴다.

- ADR
- SESSION_LOG
- CURRENT_STATE

## 4. 파일 명명

- 일반 문서: `UPPER_SNAKE_CASE.md`
- ADR: `ADR-0001-short-title.md`
- 기능 명세: `FEATURE-<name>.md` 또는 templates 기반

## 5. 문서 링크

가능한 경우 상대 경로를 사용한다.

예:
`../02-design/RAG_DESIGN.md`
