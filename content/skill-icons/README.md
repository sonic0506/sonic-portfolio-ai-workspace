# 스킬 아이콘

파일 이름은 `skill.code`이다. 어드민 분류 화면의 기술 로고 칸에 올린다(svg는 기술 로고만 허용, ADR-0020).

출처는 정확히 같은 로고가 있는 쪽을 우선한다.

1. [Devicon](https://devicon.dev) 2.17.0 `original` 변형(원래 여러 색). MIT.
2. Devicon에 없으면 [Simple Icons](https://simpleicons.org) 16.33.0(shields.io `logo=`와 같은 출처). 한 가지 브랜드 색으로 칠했다. CC0.

로고 자체는 각 상표권자의 것이다.

## Devicon (23)

| 파일 | Devicon 아이콘 | 비고 |
|---|---|---|
| `typescript.svg` | typescript | |
| `javascript.svg` | javascript | |
| `react.svg` | react | |
| `nextjs.svg` | nextjs | 검은 원 + 흰 N(다크 배경에서도 N은 보임) |
| `vuejs.svg` | vuejs | |
| `zustand.svg` | zustand | 곰 그림, 124KB로 큼. 다크 배경에서 대비가 낮다 |
| `redux-toolkit.svg` | redux | Redux 로고 |
| `tailwind-css.svg` | tailwindcss | |
| `styled-components.svg` | styledcomponents | |
| `nestjs.svg` | nestjs | |
| `docker.svg` | docker | |
| `github-actions.svg` | githubactions | |
| `aws.svg` | amazonwebservices `original-wordmark` | 글자 로고만 있다. "aws" 글자는 시스템 다크 모드에서 흰색 |
| `android.svg` | android | |
| `java.svg` | java | 커피잔 로고 |
| `react-native.svg` | reactnative | |
| `mui.svg` | materialui | |
| `webflow.svg` | webflow | |
| `notion.svg` | notion | |
| `jira.svg` | jira | |
| `slack.svg` | slack | |
| `figma.svg` | figma | |
| `ant-design.svg` | antdesign | 예정 스킬(DB에 아직 없음) |

## Simple Icons (9)

| 파일 | Simple Icons slug | 색 |
|---|---|---|
| `recoil.svg` | recoil | #3578E5 |
| `tanstack-query.svg` | tanstack | #FF4154 (TanStack 로고) |
| `react-hook-form.svg` | reacthookform | #EC5990 |
| `zod.svg` | zod | #408AFF |
| `spring-boot.svg` | springboot | #6DB33F (Devicon에는 Spring 잎만 있다) |
| `claude-code.svg` | claude | #D97757 (Claude 로고) |
| `ble.svg` | bluetooth | #0082FC |
| `ffmpeg.svg` | ffmpeg | #007808 |
| `shadcn.svg` | shadcnui | #000000, 시스템 다크 모드에서 흰색 |

## 그 밖의 출처 (21)

Devicon·Simple Icons에 없어서 [Iconify](https://icon-sets.iconify.design)와 공식 저장소·CDN에서 찾았다.

### 브랜드 로고

| 파일 | 출처 | 비고 |
|---|---|---|
| `teams.svg` | Iconify `logos:microsoft-teams` (CC0) | |
| `codex.svg` | Iconify `devicon:codex` (MIT, Devicon 최신판) | |
| `openai.svg` | Iconify `logos:openai-icon` (CC0) | 검정, 시스템 다크 모드에서 흰색 |
| `websocket.svg` | Iconify `logos:websocket` (CC0) | 검정, 시스템 다크 모드에서 흰색 |
| `amazon-s3.svg` | Iconify `logos:aws-s3` (CC0) | AWS 서비스 아이콘 |
| `aws-ecs.svg` | Iconify `logos:aws-ecs` (CC0) | AWS 서비스 아이콘 |
| `cloudfront.svg` | Iconify `logos:aws-cloudfront` (CC0) | AWS 서비스 아이콘 |
| `ag-grid.svg` | 공식 저장소 `ag-grid/ag-grid` `AG-BrandMark_Light-Theme.svg` | 글자 없는 브랜드 마크 |
| `mentraos.svg`, `mentra-bluetooth-sdk.svg` | 공식 저장소 `Mentra-Community/MentraOS` `MentraLogoWhiteSquare.svg` | 같은 파일. 흰 사각 배경 |
| `toss-payments.svg` | 토스 공식 CDN `static.toss.im/icons/svg/icon-toss-logo.svg` | 토스 앱 아이콘. **벡터가 아니라 PNG를 품은 SVG**(51KB). 토스페이먼츠 전용 심볼 SVG는 찾지 못했다 |

### 일반 아이콘 (로고가 없는 개념·제품)

[Material Symbols](https://fonts.google.com/icons)(Apache 2.0)를 Iconify에서 받아 중간 회색 #8B8B93으로 칠했다(라이트·다크 모두 보임).

| 파일 | 아이콘 | 이유 |
|---|---|---|
| `web-serial.svg` | usb | 표준 API, 로고 없음 |
| `service-worker.svg` | cloud-sync | 표준 API, 로고 없음 |
| `llm.svg` | neurology | 개념 |
| `stt.svg` | speech-to-text | 개념 |
| `tts.svg` | text-to-speech | 개념 |
| `rtos.svg` | memory | 개념 |
| `rtsp.svg` | videocam | 프로토콜 |
| `yup.svg` | fact-check | 공식 로고 없음 |
| `egohos.svg` | back-hand | 연구 모델(손·물체 분할), 로고 없음 |
| `nice-checkplus.svg` | verified-user | 공식 사이트에 SVG 로고가 없다(PNG만) |

## 실제 콘텐츠 스킬 보충 (32)

`content/skills.md`(운영 시드 기준 70개) 중 위에 없던 것. 같은 순서(Devicon → Simple Icons → Iconify·공식 저장소 → 일반 아이콘)로 찾았다.

| 파일 | 출처 | 비고 |
|---|---|---|
| `postgresql.svg` | Devicon postgresql | |
| `vite.svg` | Devicon vitejs | |
| `socket-io.svg` | Devicon socketio | 검정, 시스템 다크 모드에서 흰색 |
| `nginx.svg` | Devicon nginx | |
| `axios.svg` | Devicon axios `plain` | original이 없다 |
| `storybook.svg` | Devicon storybook | |
| `microsoft-azure.svg` | Devicon azure | |
| `html5.svg` | Devicon html5 | |
| `css3.svg` | Devicon css3 | |
| `thymeleaf.svg` | Devicon thymeleaf | |
| `spring.svg` | Devicon spring | |
| `flyway.svg` | Simple Icons flyway | |
| `typeorm.svg` | Simple Icons typeorm | |
| `konva.svg` | Simple Icons konva | |
| `radix-ui.svg` | Simple Icons radixui | 검정, 시스템 다크 모드에서 흰색 |
| `formik.svg` | Simple Icons formik | |
| `swr.svg` | Simple Icons swr | 검정, 시스템 다크 모드에서 흰색 |
| `redux-saga.svg` | Simple Icons reduxsaga | 회색 |
| `redux-persist.svg` | 공식 README가 쓰는 `endograph/redux-persist/favicon.svg` | 자체 다크 모드 처리 포함 |
| `jsp.svg` | Iconify `vscode-icons:file-type-jsp` (MIT) | JSP 파일 아이콘 |
| `ckeditor5.svg` | Iconify `file-icons:ckeditor` (ISC) | 브랜드 색 #0287D0으로 칠함 |

대신한 것:

| 파일 | 쓴 로고 | 이유 |
|---|---|---|
| `spring-ai.svg` | Devicon spring | Spring AI 전용 로고가 아이콘 모음에 없다 |
| `jpa.svg` | Devicon hibernate | JPA는 명세라 로고가 없다. 대표 구현체 Hibernate |
| `rtk-query.svg` | Devicon redux | RTK Query 전용 로고 없음 |
| `bitbucket-pipelines.svg` | Devicon bitbucket | Pipelines 전용 로고 없음 |
| `naver-maps.svg` | Simple Icons naver | 네이버 지도 전용 아이콘이 아이콘 모음에 없다 |
| `ws.svg` | `websocket.svg`와 같은 파일 | ws는 WebSocket 라이브러리 |
| `web-serial-api.svg` | `web-serial.svg`와 같은 파일 | content 코드가 `web-serial-api` |
| `querydsl.svg` | Material Symbols manage-search | 공식 로고를 찾지 못함 |
| `pgvector.svg` | Material Symbols scatter-plot | 로고 없음 |
| `react-force-graph.svg` | Material Symbols hub | 로고 없음 |
| `indexeddb.svg` | Material Symbols database | 브라우저 표준 API |

이제 `content/skills.md` 70개, 개발 DB 47개, 예정 스킬(notion·jira·slack·teams·figma·ant-design) 모두 파일이 있다.

