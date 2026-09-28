# Real Content

실제 포트폴리오 데이터다. `samples/`는 테스트·RAG 측정 기준용 샘플로 그대로 두고, 이 폴더를 개발 DB에 넣는다.

```bash
./gradlew bootRun --args='--spring.profiles.active=local --app.seed.samples-dir=../content'
```

형식은 `samples/`와 같다(front matter + `## ` 섹션, `skills.md`, `taxonomy.md`). `profile.md`가 없으므로 프로필은 건드리지 않는다.

## 출처와 변환 규칙 (2026-09-28)

원본: 사용자 제공 Notion 위키(`notion-wikis/<프로젝트>/README.md`는 프로젝트, `decisions/*.md`는 블로그). `template/`(가상 프로젝트)과 `references/fsd-notes.md`(이미지가 빠진 첨부 원문)는 제외했다.

- 프로젝트 README의 `결정사항 / 트러블슈팅` 섹션은 지우고, 거기 걸린 링크는 `related_blogs`(참고 문서)로 옮겼다. 링크 아래 설명 문단은 해당 블로그의 `summary`로 썼다.
- 개요 표의 기간·주요 기술은 front matter(`period_*`, `skills`)로, 서비스 링크는 `links.service`로 옮겼다. 팀 구성·나의 역할은 본문 표에 남겼다.
- 내용 없는 `좋았던 점`/`아쉬운 점`(회고 없음·추후 작성)은 섹션째 뺐다.
- 하단 `작성 근거`와 미확인 사항 문단은 `open_questions`(관리자 메모, 공개·RAG 제외)로 옮겼다.
- 블로그의 첫 `##` 앞 요약 표는 `## 개요` 섹션으로 감쌌다(시드는 첫 `##` 앞을 버린다). 다른 위키 파일로의 상대 링크는 텍스트로 바꾸고 참고 관계로 연결했다.
- 블로그 작성일은 모두 2026-09-28(사용자 결정). featured는 최근 3건(viora, bring-and-t, evar). 목록 순서는 파일명 번호(시작 시기 최근 순).
- `contribution`은 원본에 없어 비웠다. `organization`은 VIORA(슬로그업)만 넣었다(회사명 공개 여부 미정).
