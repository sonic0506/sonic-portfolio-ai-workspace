# ADR-0019: Wanted-style Career with Achievements

- Status: Accepted
- Date: 2026-10-08

## Context

프로필의 경력은 `회사 / 직무 / 기간 / 설명(5천 자, 일반 문단)` 한 줄이었다. 사용자가 이력서(원티드) 경력란의 슬로그업 부분(프로젝트 9개, 약 1만 자)을 옮기려 하자 5천 자 제한에 걸렸다. 설명 칸은 마크다운이 아니고 채팅 근거에도 들어가지 않았다.

사용자는 원티드처럼 "경력 아래 프로젝트별 주요 성과(기간·직무·직책·상세)"를 묶어 추가·관리하는 구조를 원했고, 화면도 원티드와 비슷하게(회사 로고 자리, 메타 줄, 성과 목록) 보이기를 원했다.

## Decision

- `career`에 `employment_type`(고용형태)과 `position`(직책)을 더한다(V7). `role`은 직무로 쓰고 `description`은 경력 요약으로 남긴다.
- 새 테이블 `career_achievement`: `title`(성과명), `period_start`/`period_end`(null = 진행 중), `job`(직무), `position`(직책), `body_markdown`(최대 2만 자), `project_id`(포트폴리오 프로젝트 연결, 선택), `display_order`. 경력을 지우면 함께 지워지고(cascade), 프로젝트를 지우면 연결만 null이 된다.
- 관리 API는 지금처럼 프로필 전체 교체: `careers[].achievements[]`(생략 가능, 생략은 없음과 같다). 성과 기간과 프로젝트 id를 검사한다(400).
- 공개 API `GET /api/profile`의 `careers[]`에 `employmentType`, `position`, `achievements[]`를 더한다. 성과의 `project{slug,title,url}`는 **공개된 프로젝트일 때만** 준다.
- 채팅: 프로필 문서에 경력과 성과를 `## 경력 · 회사`, `## 회사 · 성과명` 섹션으로 넣는다(사용자 결정 G4). 성과마다 별도 조각·제목이 된다.
- 화면: 원티드식. 회사 로고 자리(이미지 업로드 전까지 회사명 첫 글자), 회사명, `시작 - 끝/재직 중 (n년 m개월) | 고용형태 | 직무 | 직책`(값이 있는 것만), 경력 요약, 성과 목록(제목·연결 프로젝트 링크, `기간 | 직무 | 직책`, 마크다운 상세). 첨부 화면을 따라 상세는 펼쳐 보인다.
- 데이터는 `content/profile.md`(시드)로 관리한다(G5). 운영 프로필 값을 먼저 옮기고 이력서 PDF의 슬로그업 9개·프리랜서 2개 프로젝트를 성과로 넣었다.

## Alternatives Considered

### 설명 칸 길이만 늘리기
- 장점: 코드 두 줄.
- 단점: 1만 자가 마크다운 없는 문단 하나로 보이고, 채팅 근거가 아니며, 프로젝트별로 고치기 어렵다.

### 프로필 본문 섹션에 넣기
- 장점: 코드 변경 없음, 마크다운·채팅 근거.
- 단점: 경력과 성과가 따로 놀아 원티드처럼 묶어 관리할 수 없다(사용자가 원한 구조가 아님).

## Consequences

- 성과와 포트폴리오 프로젝트 페이지가 같은 이야기를 담아, 채팅 검색에서 비슷한 조각이 함께 나올 수 있다. 겹침이 문제가 되면 성과를 채팅에서 빼는 선택지를 다시 본다.
- `content/profile.md`를 운영에 시드하면 운영 프로필을 덮어쓴다. 어드민에서 직접 고친 내용은 시드 전에 파일로 옮겨야 한다.
- 회사 로고는 이미지 업로드 기능(후속)에서 `career`에 이미지 필드를 더해 바꾼다.
- 성과의 직무·직책은 이력서에 없어 비어 있다. 어드민에서 채운다.

## Related Documents

- [Data Model](../02-design/DATA_MODEL.md)
- [API Design](../02-design/API_DESIGN.md)
- [content/README.md](../../content/README.md)
