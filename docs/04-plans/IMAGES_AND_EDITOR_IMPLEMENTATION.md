# Images (S3) and Markdown Editor Implementation

Status: In progress (2026-10-08, 사용자 승인: "추천대로 진행")

## 결정 (계획 단계에서 사용자 확인)

| # | 결정 |
|---|---|
| I1 | 이미지 전달은 **CloudFront + 비공개 S3 버킷**, 주소 `https://images.sonic-portfolio.com`. 인증서는 ACM(us-east-1) |
| I2 | **`media` 테이블**로 올린 이미지를 기록하고 어드민에서 다시 고를 수 있게 한다 |
| I3 | 업로드 제한: jpg·png·webp·gif, **10MB**. svg는 기술 로고에만 |
| I4 | 이미지 칸은 **업로드와 주소 입력 둘 다** 유지 |
| E1 | 에디터는 **일반 입력창 + 직접 만든 툴바**(새 의존성 없음). 부족하면 CodeMirror로 교체 |
| E2 | 제목 버튼은 **H3·H4만**(섹션 제목이 `##`라서) |
| E3 | 미리보기 렌더러는 포트폴리오 마크다운을 **공유 워크스페이스 패키지**로 분리해 함께 쓴다 |
| E4 | 프로젝트 전용 버튼: **추천 질문 블록**(`:::questions`)과 **문서 링크**(프로젝트·블로그 검색 → `[제목](/blog/slug)`) |

## 구조

```
어드민 → POST /api/admin/media/uploads {fileName, contentType, size, purpose}
       ← {uploadUrl(presigned PUT), headers, publicUrl}    ← 관리자·형식·크기(≤10MB) 검사, Content-Type·Content-Length를 서명에 고정
어드민 → S3 PUT(파일)  → 성공하면 publicUrl을 이미지 칸/본문에 넣는다
방문자 → images.sonic-portfolio.com(CloudFront, OAC) → S3
```

- 키: 운영 `images/{yyyy}/{MM}/{uuid}.{ext}`, 로컬 `dev/images/...`(설정 `app.media.key-prefix`).
- 인증: Lightsail은 IAM 역할을 못 붙이므로 업로드 전용 IAM 사용자 키(`S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, PutObject만). 키가 없으면 업로드 API만 503, 나머지는 그대로.
- `media`(V8): `id, object_key, url, content_type, size_bytes, purpose, created_at`. 업로드 허가서를 만들 때 기록한다(실제 업로드 실패분은 목록에서 깨진 이미지로 보인다 — 한계, 정리는 후속).
- 새 칸(V8): `career.logo_url`, `skill.icon_url`. 기술은 `icon_url`이 있으면 그것, 없으면 지금처럼 `simple-icons`.

## 작업 순서

1. [x] 사용자: AWS 준비(2026-10-08 완료, 실제 업로드·CORS·CloudFront 확인) — `deploy/S3_SETUP.md` (버킷, CORS, IAM 업로드 키, ACM, CloudFront+OAC, Route 53, 확인)
2. [x] 백엔드(2026-10-08, 136건 통과): AWS SDK v2 `S3Presigner`(presigned PUT — SDK v2에는 presigned POST가 없다), `MediaAdminController`(업로드 허가서·목록), V8, `career.logo_url`·`skill.icon_url` API, 테스트(서명기는 가짜로)
3. [x] 어드민 이미지 입력(2026-10-08, `components/image-field.tsx`·`lib/upload.ts`, 어드민 19건): `ImageField`(업로드·미리보기·목록에서 고르기·주소 입력) → 프로필 사진, 프로젝트·블로그 썸네일, 경력 로고, 기술 로고
4. [x] 포트폴리오(2026-10-08): 경력 카드 로고 자리에 이미지, 프로필 기술 칩에 로고. 스택 태그(프로젝트 카드·블로그)는 sonic UI 규칙(아이콘 없이 보더만, `stack-tag.tsx`)대로 그대로 둔다
5. [x] 공유 렌더러 패키지(2026-10-08) `frontend/markdown`(`@portfolio/markdown`; 워크스페이스 glob `frontend/*`에 맞춰 위치 변경): `Markdown`·`CodeBlock`·`remark-questions`·`headingId`. 사이트 전용 링크·추천 질문은 `slots`로 주입. 어드민 미리보기용 토큰은 `theme.css`(globals.css 일부 복사 — 값을 바꾸면 함께 바꾼다). 포트폴리오 기존 29건 통과
6. [x] 에디터(2026-10-08, 어드민 26건) `MarkdownEditor`: 툴바(H3 H4 | B I S | 인용 링크 이미지 코드 | 표 목록 | 질문블록 문서링크), 단축키(⌘B ⌘I ⌘K), 이미지 붙여넣기·끌어놓기 업로드, 우측 미리보기(스크롤 따라감), 좁은 화면은 탭. 적용: 섹션 본문, 경력 성과 상세, FAQ 답변
7. [ ] 문서·검증: ADR-0020, ADR-0001 S3 항목 해소, ARCHITECTURE Pending 갱신, 화면 확인, 운영 반영(S3 키 `.env` + 재배포)

## 백엔드 구현 메모 (2026-10-08)

- `POST /api/admin/media/uploads` `{fileName, contentType, sizeBytes, purpose}` → `201 {id, uploadUrl, headers{Content-Type}, publicUrl}`. 업로드 주소 10분 유효. 형식·크기 위반 400, 미설정 503.
- `GET /api/admin/media?purpose=` 최근 200건.
- `S3UploadSigner`: SDK v2 `S3Presigner`. 서명 헤더에 `content-length;content-type;host`가 들어감을 테스트로 확인(크기 제한의 근거). 키·버킷·공개 주소 중 하나라도 없으면 꺼짐.
- 설정: `app.media.bucket/region/access-key-id/secret-access-key/public-base-url/key-prefix/max-bytes`. 로컬 기본 접두사 `dev/images`, 운영 `images`(prod 프로필에서 버킷·공개 주소 기본값 지정).
- `skill.icon_url`(요청·응답 `iconUrl`), `career.logo_url`(`logoUrl`). 시드는 skills.md에 아이콘이 없으므로 재시드해도 어드민에서 정한 `icon_key`·`icon_url`을 유지하도록 고쳤다(이전에는 null로 덮어씀).
- 로컬에서 업로드를 쓰려면 `backend/.env`에 `S3_BUCKET`, `MEDIA_PUBLIC_BASE_URL`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`를 넣는다.

## 위험

S3 키 유출(최소 권한·`.env` 600·교체 절차), 악성 파일(관리자만·형식 제한·svg는 로고만), 안 쓰는 파일 누적(`media` 목록, 정리는 후속), 렌더러 분리 중 화면 변화(기존 테스트·화면 비교), 에디터 작업량(일반 입력창부터).
