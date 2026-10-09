# 스킬 아이콘

파일 이름은 `skill.code`이다. 어드민 분류 화면의 기술 로고 칸에 올린다(svg는 기술 로고만 허용, ADR-0020).

출처는 정확히 같은 로고가 있는 쪽을 우선한다.

1. [Devicon](https://devicon.dev) 2.17.0 `original` 변형(원래 여러 색). MIT.
2. Devicon에 없으면 [Simple Icons](https://simpleicons.org) 16.33.0(shields.io `logo=`와 같은 출처). 한 가지 브랜드 색으로 칠했다. CC0.

로고 자체는 각 상표권자의 것이다.

## Devicon (22)

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

## 두 곳 모두 없는 스킬

- 브랜드: `teams`(Microsoft Teams), `codex`·`openai`(OpenAI), `amazon-s3`·`aws-ecs`·`cloudfront`(AWS 개별 서비스), `ag-grid`, `yup`, `toss-payments`, `mentraos`, `mentra-bluetooth-sdk`, `nice-checkplus`, `egohos`.
- 브랜드가 아닌 기술 개념: `websocket`, `web-serial`, `service-worker`, `llm`, `stt`, `tts`, `rtos`, `rtsp`. Socket.io 로고는 WebSocket과 다른 라이브러리라 쓰지 않았다.
