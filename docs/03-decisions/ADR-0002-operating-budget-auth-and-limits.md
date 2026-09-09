# ADR-0002: Operating Budget, Admin Authentication and Chat Limits

- Status: Accepted
- Date: 2026-09-09

## Context

사용자가 ADR-0001 이후 운영 조건에 답변했다. 전체 MVP 범위와 핵심 스택은 유지한다.

## Decision

- 월 운영비 예산을 50,000원에서 100,000원으로 변경한다. 서버, DB, S3, OpenAI API, 도메인, 세금 등 모든 비용을 포함한다.
- AWS 사용을 선호하며 DB도 가능하면 AWS 관리형 서비스를 사용한다. 특정 서비스, 사양, 리전의 선택은 아직 아니다.
- 후속 사용자 결정(2026-09-09): DB는 Amazon RDS for PostgreSQL을 유지한다. 직접 운영안은 채택하지 않는다. 구체 사양/리전은 비용 제안 단계이며 앱 서버는 Lightsail/EC2를 비교한다.
- 관리자 로그인은 GitHub으로 하며 운영자 본인 계정만 허용한다. 허용할 실제 계정 식별자는 구현 전 확인한다.
- 챗봇 질문 횟수 제한을 적용한다. 제한은 설정으로 쉽게 비활성화하고 수치를 변경할 수 있어야 한다. 이 설정은 인증/권한 검사를 해제하지 않는다.

## Alternatives Considered

사용자 선택을 기록한 결정이다. 다른 클라우드, 직접 DB 운영, 별도 ID/비밀번호 인증은 이번에 선택하지 않았다. AWS 서비스별 비용과 호환성 비교는 후속 작업이다.

## Consequences

- 관리형 PostgreSQL의 pgvector 지원, 운영비와 예상 트래픽을 검증한 뒤 구체 배포 구성을 결정한다. 현재 월 예산 충족 여부는 미검증이다.
- GitHub 인증 성공만으로 관리자 권한을 부여하지 않고 서버에서 허용 계정 여부를 검사해야 한다. 세션 상세 방식은 후속 설계 대상이다.
- 질문 제한의 집계 기준, 기간, 초기 수치, 저장 방식과 초과 응답은 아직 미정이다. 예상 사용량을 가정하여 설계한다.
- 질문 횟수 제한만으로 전체 운영비 상한이 보장된다고 간주하지 않는다. 비용 추정에는 색인/재색인 등 챗봇 외 사용량도 포함한다.

## Related Documents

- [Core Stack](ADR-0001-core-technology-stack.md)
- [Requirements](../00-project/REQUIREMENTS.md)
- [Architecture](../02-design/ARCHITECTURE.md)
