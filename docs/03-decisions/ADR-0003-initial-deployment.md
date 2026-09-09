# ADR-0003: Initial Deployment

- Status: Accepted
- Date: 2026-09-09

## Context

전체 MVP와 월 총예산 10만 원을 유지하며 RAG 구현에 집중한다. 사용자가 Lightsail/EC2 비교 후 추천 구성을 채택했다.

## Decision

- Public Next.js와 Admin React는 Vercel Hobby의 별도 프로젝트로 배포한다. 개인 비상업적 이용과 무료 한도 내 운영을 전제로 한다.
- Spring Boot는 서울 리전 Lightsail Linux IPv4 2GB 번들 1대에 직접 배포한다.
- RDS PostgreSQL db.t4g.micro, Single-AZ, gp3 20GB와 pgvector를 사용한다. RDS는 공개하지 않고 같은 리전 기본 VPC와 Lightsail 피어링으로 연결한다.
- S3와 OpenAI 제공자 선택은 유지한다. 생성/임베딩 모델, PostgreSQL/확장 버전은 별도 결정한다.

## Alternatives Considered

- EC2 t4g.small: IAM/VPC 학습에 유리하지만 같은 비용 가정에서 월 약 14,300원 증가하므로 초기에는 선택하지 않는다.
- DB 직접 운영: 사용자가 RDS 유지를 선택했다.
- Lightsail 4GB 통합: 프론트엔드를 Vercel로 분리하고 초기 서버 비용을 줄인다.

## Consequences

- 기존 비용 가정 기준 전체 월 약 70,736원이다. 가격 보장이나 실부하 검증 결과는 아니다.
- 앱 서버 2GB와 RDS 1GiB는 실제 부하/재색인 검증 후 필요 시 증설한다. 단일 앱 서버와 Single-AZ DB의 중단 가능성을 수용하는 초기 구성이다.
- 도메인, GitHub 로그인 콜백, 세션/CORS/CSRF 정책 및 Vercel 저장소 연결 조건을 구현 전에 확인한다.
- 배포 방식 선택만 확정했으며 리소스 생성/계약/결제는 수행하지 않았다.

## Related Documents

- [Cost Proposal](../02-design/AWS_COST_PROPOSAL.md)
- [Operating Conditions](ADR-0002-operating-budget-auth-and-limits.md)
