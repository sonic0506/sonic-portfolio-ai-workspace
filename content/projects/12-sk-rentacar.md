---
type: "project"
id: "sk-rentacar"
title: "SK렌터카 다이렉트: 렌터카 B2C 웹과 BOS 운영"
summary: "SK렌터카 다이렉트는 영업점을 방문하지 않고 차량 탐색부터 견적 확인, 계약까지 온라인에서 진행하는 비대면 렌터카 서비스입니다. 신차·중고 장기렌터카 상품을 중심으로 차량별 조건과 월 렌탈료를 비교하고, 원하는 차량의 견적을 받아 상담이나 계약으로 이어갈 수 있습니다."
highlights: []
period_start: "2022-05"
period_end: "2023-02"
ongoing: false
organization: null
position: null
contribution: null
featured: false
published: true
thumbnail: null
skills: ["JavaScript", "TypeScript", "Next.js", "React", "Redux Toolkit", "Redux-Saga", "SWR", "styled-components", "Ant Design", "MUI", "AG Grid", "Formik", "Yup", "Axios", "Storybook", "Microsoft Azure", "Bitbucket Pipelines"]
links:
  github: null
  service: null
related_blogs: ["sk-rentacar-live-pip", "sk-rentacar-promotion-sections"]
open_questions: []
---

## 프로젝트 개요

SK렌터카 다이렉트는 영업점을 방문하지 않고 차량 탐색부터 견적 확인, 계약까지 온라인에서 진행하는 비대면 렌터카 서비스입니다. 신차·중고 장기렌터카 상품을 중심으로 차량별 조건과 월 렌탈료를 비교하고, 원하는 차량의 견적을 받아 상담이나 계약으로 이어갈 수 있습니다.

차량을 일정 기간 이용한 뒤 선택할 수 있는 타고Pay·타고Buy 같은 상품도 있어, 고객은 이용 목적과 구매 방식에 맞는 상품을 고를 수 있습니다.

저는 이미 운영 중이던 이 서비스에서 약 10개월 동안 Next.js 기반 B2C 웹과 React 기반 BOS를 유지보수하며 매달 기능을 추가했습니다.

| 항목 | 내용 |
|---|---|
| 팀 구성 | PM 1명, 디자이너 1명, 프론트엔드 개발자 2명(본인 포함) |

## 주요 성과

- 약 10개월 동안 Next.js 기반 B2C 웹과 React 기반 BOS를 유지보수하고 기능을 추가했습니다.
- 메인 페이지 프로모션 섹션을 유형별 컴포넌트와 하나의 렌더링 컴포넌트로 구현했습니다. 운영자가 어드민에서 콘텐츠 유형(룰렛·타임어택·기본형·슬라이드형·타임딜형 등)을 고르고 차량과 이미지를 선택하면, 메인 페이지가 설정한 순서대로 섹션을 보여 줍니다.
- 라이브 방송 재생 요소를 레이아웃 최상위에 두어, 페이지를 옮겨도 방송이 끊기지 않고 이어지는 PIP를 만들었습니다.
- 현업에서 마련한 Azure 환경에 Bitbucket Pipelines로 배포를 자동화했습니다.
