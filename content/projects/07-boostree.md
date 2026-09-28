---
type: project
id: boostree
title: "부스트리: 병원 운영·마케팅 SaaS"
summary: "비급여 병원의 운영과 마케팅을 돕는 SaaS입니다. 관리자 웹을 혼자 만들고 병원별 웹의 공통 기반과 배포 자동화를 맡았습니다."
highlights: ["관리자 웹 7개 기능 단독 개발", "병원별 웹의 공통 기반 공동 구축", "파트너 명칭 기반 배포 자동화", "상품 정보 표시를 위한 ISR 적용"]
period_start: 2023-03
period_end: 2023-11
ongoing: false
organization: null
position: "초기 개발 멤버·관리자 웹 단독 개발"
contribution: null
featured: false
published: true
thumbnail: null
skills: ["JavaScript", "TypeScript", "Next.js", "React", "Zustand", "shadcn", "GitHub Actions", "Docker", "AWS ECS", "Amazon S3"]
links:
  github: null
  service: null
related_blogs: ["boostree-seed-and-deploy"]
open_questions: ["작성 근거: 프로젝트 정리 원본 · 기존 풀버전 · 기존 간단버전"]
---

## 프로젝트 개요

비급여 병원의 운영과 마케팅을 돕는 SaaS입니다. 병원마다 따로 배포하는 웹, 파트너 ID로 로그인해 병원별로 관리하는 관리자 웹 하나, 여러 곳에 붙이는 예약 위젯으로 이뤄져 있습니다.

저는 초기 개발 멤버로 들어가 관리자 웹을 혼자 만들었고, 병원별 웹의 공통 기반은 동료 프론트엔드 개발자와 같이 만들었습니다. 병원별 웹 배포 자동화와 프론트엔드 쪽 AWS 설정도 맡았습니다. 제가 빠질 때쯤 서비스를 쓰는 병원은 지점을 포함해 20곳 정도였습니다.

| 항목 | 내용 |
|---|---|
| 팀 구성 | 프론트엔드 2명(본인 포함), 백엔드 1명, 디자이너 1명, PM 1명 |
| 나의 역할 | 초기 개발 멤버, 관리자 웹 단독 개발, 병원별 웹·seed 저장소 공동 구축, ISR 적용, 배포 자동화와 프론트엔드 AWS 설정 |

## 주요 성과

- **관리자 웹 7개 기능 단독 개발:** 병원 정보, 홈페이지 메뉴 구성, 상품 카테고리, 상품, 이벤트, 관리자 권한, 예약 관리를 모두 만들었습니다. 관리자 웹은 하나이고, 파트너 ID로 로그인하면 해당 병원을 관리하는 구조였습니다.
- **병원별 웹의 공통 기반 공동 구축:** 동료와 공통 컴포넌트 목록을 정하고, shadcn으로 쓸 것과 직접 만들 것을 나눴습니다. 컴포넌트를 나눠 구현해 seed 저장소에 담고, 병원별 사이트는 이 저장소를 클론해 만들었습니다. 메뉴 설정과 서버 API 연동은 모든 사이트가 같이 썼습니다.
- **파트너 명칭 기반 배포 자동화:** GitHub Actions에 파트너 명칭을 넣으면 AWS 리소스를 조회해 그 병원의 ECS를 찾고 Docker 이미지를 배포하게 했습니다. 프론트엔드 쪽 AWS 설정을 맡았고, ECS 롤백으로 이전 버전으로 되돌릴 수 있게 했습니다.
- **상품 정보 표시를 위한 ISR 적용:** 검색엔진이 상품 정보를 읽어 갈 수 있도록 Next.js App Router 웹에 ISR을 적용했습니다. 페이지 소스 보기에 상품 데이터가 들어 있는지는 직접 확인했습니다.
