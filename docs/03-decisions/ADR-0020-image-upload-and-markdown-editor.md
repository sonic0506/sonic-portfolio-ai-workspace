# ADR-0020: Image Upload (S3 + CloudFront) and Admin Markdown Editor

- Status: Accepted
- Date: 2026-10-08

## Context

프로필 사진·썸네일은 주소를 직접 적어야 했고, 기술 로고는 `simple-icons` 키, 경력 로고는 회사명 첫 글자 자리만 있었다(ADR-0019). Notion 위키를 옮길 때 본문 이미지 10개도 올릴 곳이 없어 뺐다. ADR-0001은 저장소를 S3로 정했지만 리전·접근 정책은 "이미지 업로드 구현 시" 정하기로 미뤘다(ARCHITECTURE Pending).

어드민의 마크다운 칸은 일반 입력창이라 표·질문 블록(`:::questions`)·문서 링크를 손으로 쳐야 했고, 결과는 포트폴리오에 저장해야 보였다. 사용자는 velog처럼 툴바와 우측 미리보기를 원했다.

## Decision

계획 단계에서 사용자 확인(2026-10-08, "추천대로"): I1~I4, E1~E4. 상세는 [IMAGES_AND_EDITOR_IMPLEMENTATION](../04-plans/IMAGES_AND_EDITOR_IMPLEMENTATION.md).

### 저장·전달 (I1, I4)

- 버킷 `sonic-portfolio-images`(서울 `ap-northeast-2`), **퍼블릭 접근 전부 차단**. 공개는 CloudFront(OAC)만, 주소 `https://images.sonic-portfolio.com`(ACM us-east-1). 콘솔 작업은 `deploy/S3_SETUP.md`.
- 업로드는 브라우저 → S3 직접. 백엔드는 관리자 확인 후 **presigned PUT**(10분, `Content-Type`·`Content-Length` 서명)만 발급한다. Java SDK v2에 presigned POST가 없어 크기 제한은 서명된 `Content-Length`로 건다(다른 크기는 403, 실연 확인).
- 키 `{prefix}/{yyyy}/{MM}/{uuid}.{ext}`. 운영 `images/`, 로컬 `dev/images/`. 원래 파일명은 키에 쓰지 않는다.
- 자격 증명: Lightsail에는 IAM 역할을 붙일 수 없어 **업로드 전용 IAM 사용자**(`s3:PutObject` on `images/*`·`dev/*`만, 읽기·삭제 없음) 키를 서버 `.env`에 둔다. 키가 없으면 업로드 API만 503이고 나머지는 동작한다.
- 이미지 칸은 업로드와 주소 직접 입력을 둘 다 둔다.

### 기록과 제한 (I2, I3)

- `media` 테이블(V8)에 허가서 발급 시점에 기록하고, 어드민 "올린 이미지에서 고르기"에 쓴다(`GET /api/admin/media?purpose=`).
- 형식 jpg·png·webp·gif, 10MB 이하. svg는 스크립트를 담을 수 있어 **기술 로고(`SKILL_ICON`)에만** 허용한다. 서버와 어드민이 같은 규칙으로 검사한다.
- 새 칸: `career.logo_url`, `skill.icon_url`(있으면 `icon_key`보다 우선). 프로젝트 카드·블로그의 스택 태그는 sonic UI 규칙(아이콘 없이 보더만)대로 바꾸지 않는다.

### 에디터 (E1~E4)

- 일반 입력창 + 직접 만든 툴바(새 에디터 의존성 없음): H3·H4(섹션 제목이 `##`), 굵게·기울임·취소선, 인용·링크·이미지·코드, 표·목록, 추천 질문 블록, 문서 링크(프로젝트·블로그 검색 → `[제목](/blog/slug)`). ⌘B ⌘I ⌘K, 이미지 붙여넣기·끌어놓기 업로드.
- 미리보기는 포트폴리오와 **같은 렌더러**를 쓴다: 워크스페이스 패키지 `frontend/markdown`(`@portfolio/markdown`). 사이트 전용 동작(next/link, 대화를 여는 질문 버튼)은 `slots`로 주입한다. 어드민은 렌더러가 쓰는 sonic 토큰 일부를 `theme.css`로 가져온다.
- 적용: 섹션 본문(프로젝트·블로그·프로필), 경력 성과 상세, FAQ 답변.

## Alternatives Considered

### 버킷 공개 읽기(CloudFront 없음)
- 장점: 설정이 적고 CloudFront 비용·인증서가 필요 없다.
- 단점: S3 주소가 그대로 드러나고 버킷 정책을 공개로 열어야 한다. 도메인 주소와 캐시를 쓸 수 없다.

### 서버를 거치는 업로드(멀티파트 → 서버 → S3)
- 장점: 서버에서 형식·크기를 직접 검사한다.
- 단점: 4GB 단일 서버(ADR-0017)가 파일을 메모리·네트워크로 중계한다. presigned PUT도 서명으로 형식·크기를 고정할 수 있다.

### CodeMirror·Toast UI 등 에디터 라이브러리
- 장점: 실행 취소 기록, 문법 강조, 줄 단위 스크롤 동기화.
- 단점: 의존성과 번들이 크고, 질문 블록·문서 링크는 어차피 직접 만든다. 부족하면 입력창만 교체한다.

### 어드민에 별도 미리보기 렌더러
- 장점: 패키지 분리 작업이 없다.
- 단점: 포트폴리오와 결과가 달라진다(CJK 굵게, 질문 블록, 코드 블록). 미리보기의 의미가 약해진다.

## Consequences

- 업로드에 실패한 허가서도 `media`에 남아 목록에서 깨진 이미지로 보인다. 쓰지 않는 파일 정리는 후속(업로드 키에 삭제 권한이 없으므로 콘솔 또는 별도 권한).
- 업로드 키 유출 시 `images/`·`dev/` 아래에 쓰기만 가능하다. 교체는 IAM에서 새 키 발급 → `.env` 교체 → 재시작.
- `theme.css`는 `globals.css` 토큰 일부의 복사본이다. 색을 바꾸면 두 곳을 함께 바꾼다.
- 툴바·단축키로 바꾼 내용은 ⌘Z로 되돌릴 수 없다(입력창 값을 직접 바꾼다). 불편하면 CodeMirror로 바꾼다.
- Vercel 두 프로젝트는 Root Directory 밖의 `frontend/markdown`을 읽는다("Include files outside the root directory" 유지).
- 비용: S3·CloudFront는 사용량 과금이다. Budgets 서비스 필터에 두 서비스를 더한다(`deploy/S3_SETUP.md` 8절).

## Related Documents

- [IMAGES_AND_EDITOR_IMPLEMENTATION](../04-plans/IMAGES_AND_EDITOR_IMPLEMENTATION.md)
- [deploy/S3_SETUP.md](../../deploy/S3_SETUP.md)
- [ADR-0001](ADR-0001-core-technology-stack.md), [ADR-0017](ADR-0017-single-server-docker-deployment.md), [ADR-0019](ADR-0019-career-achievements.md)
- [Data Model](../02-design/DATA_MODEL.md), [API Design](../02-design/API_DESIGN.md)
