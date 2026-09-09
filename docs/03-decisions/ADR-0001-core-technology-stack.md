# ADR-0001: Core Technology Stack

- Status: Accepted
- Date: 2026-09-09

## Context

전체 기능을 포함하는 MVP를 개발한다. 구현에서 보여줄 핵심 역량은 AI를 활용한 RAG이며, 포트폴리오 콘텐츠는 프론트엔드·백엔드·AI 경험을 모두 전달한다. 프론트엔드는 익숙한 기술을 사용하고 백엔드는 학습하면서 개발한다. 월 운영비 예산은 후속 사용자 결정으로 모든 비용을 포함한 100,000원으로 변경되었다. 운영 조건은 ADR-0002를 따른다.

## Decision

사용자가 다음 기술을 직접 선택했다.

| 영역 | 선택 |
|---|---|
| 공개 사이트 | Next.js |
| 관리 사이트 | React |
| 서버 | Spring Boot, Java 21 |
| 데이터 접근 | JPA, QueryDSL |
| DB / Vector Search | PostgreSQL, pgvector |
| LLM 제공자 | OpenAI |
| 스토리지 | S3 |

## Alternatives Considered

이번 결정은 사용자 지정 스택을 채택한 것으로, 대안 비교나 가격/버전 호환성 검증을 수행한 결과가 아니다.

## Consequences

- 위 스택을 이후 설계의 기준으로 사용한다. 전체 MVP 범위는 유지한다.
- AWS 및 AWS 관리형 DB를 선호하며 관리자 인증은 GitHub 본인 계정만 허용한다(ADR-0002). 구체 배포 구성과 API 방식은 미정이다.
- OpenAI의 생성 모델, Embedding 제공자/모델, RAG 통합 라이브러리는 미정이다. LLM 제공자 선택을 Embedding 선택으로 간주하지 않는다.
- S3 리전/접근 정책, Markdown 본문 저장 위치, Graph 라이브러리, Java 이외의 구체 버전과 빌드 도구는 후속 설계에서 결정한다.
- 월 예산에 맞는 배포 구성과 사용량 제한은 확정된 총예산과 명시적인 사용량 가정을 기준으로 검증한다. 현재 예산 충족 여부는 미검증이다.

## Related Documents

- [Project Overview](../00-project/PROJECT_OVERVIEW.md)
- [Architecture](../02-design/ARCHITECTURE.md)
- [Next Actions](../05-session/NEXT_ACTIONS.md)
