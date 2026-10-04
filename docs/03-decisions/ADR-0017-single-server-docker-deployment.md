# ADR-0017: Single Lightsail Server with Docker (App + DB + Caddy)

- Status: Accepted
- Date: 2026-10-04

## Context

ADR-0003은 Spring Boot를 Lightsail 2GB에, DB를 RDS PostgreSQL micro에 두는 구성(월 약 70,736원)을 정했다. 배포 준비를 시작하며 사용자가 비용 절감을 위해 DB를 서버에 함께 올리는 안을 검토했다.

비교 결과(계산 방식은 [AWS_COST_PROPOSAL](../02-design/AWS_COST_PROPOSAL.md)과 같다):

| 안 | 월 비용 |
|---|---:|
| Lightsail 2GB + RDS (ADR-0003) | 약 70,736원 |
| Lightsail 2GB, Docker로 앱+DB | 약 36,300원 |
| **Lightsail 4GB, Docker로 앱+DB** | **약 56,100원** |
| EC2 t4g.small(2GB), Docker로 앱+DB | 약 50,600원 |

- 절감은 대부분 RDS 제거에서 나온다. 같은 사양이면 EC2가 Lightsail보다 비싸다. Docker 사용 여부는 비용과 무관하다.
- 2GB 통합은 OS·Docker, 프록시, PostgreSQL, JVM 합계가 약 1.3~1.5GB로 추정되어 여유가 작다(실측 아님).
- 데이터 대부분은 `content/` 시드로 다시 만들 수 있다. 직접 운영에서 잃을 수 있는 것은 채팅 기록, 미답변 질문, 어드민 수정분이다.
- HTTPS 프록시는 문서에서 "필요하다"는 전제만 있었고 도구는 정하지 않았었다.

## Decision

- 서울 Lightsail Linux **4GB** 번들 1대에 Docker Compose로 다음 세 컨테이너를 운영한다(2026-10-04 사용자 결정).
  - `api`: Spring Boot 실행 이미지. 이미지는 서버가 아닌 로컬·CI에서 빌드한다.
  - `db`: 로컬과 같은 `pgvector/pgvector:0.8.2-pg17` 이미지. 데이터는 볼륨에 두고 외부 포트를 열지 않는다.
  - `caddy`: HTTPS 종료와 리버스 프록시. 인증서는 Caddy 자동 발급을 쓴다.
- RDS와 Lightsail–VPC 피어링은 사용하지 않는다.
- 프론트엔드(portfolio, admin)를 Vercel Hobby에 두는 ADR-0003 결정은 유지한다.
- 백업: 우선 Lightsail 자동 스냅샷만 쓴다(2026-10-04 사용자 결정). `pg_dump` 외부 보관은 필요해지면 추가한다.
- 도메인: `sonic-portfolio.com`(2026-10-04 사용자 결정). `www`(포트폴리오), `admin`(어드민), `api`(백엔드).
- 브라우저 요청 경로(2026-10-04 사용자 결정):
  - admin: Vercel rewrite로 `/api`, `/oauth2`, `/login/oauth2`를 `api.sonic-portfolio.com`에 전달한다. 세션·CSRF 쿠키가 admin 호스트에 붙어 ADR-0010의 `SameSite=Lax`와 CORS 미사용을 유지한다. GitHub 콜백은 `redirect-uri`로 admin 주소에 고정하고, 로그인 성공 URL은 전체 주소로 둔다.
  - 포트폴리오 채팅: 브라우저가 `api.sonic-portfolio.com`을 직접 호출한다. Vercel을 거치면 방문자 IP를 구분하지 못해 IP당 질문 제한이 전체 공용이 되기 때문이다. CORS는 포트폴리오 출처에 한해 공개 API에만 자격 증명 없이 허용한다. 관리 API는 CORS 대상이 아니다.

## Alternatives Considered

### ADR-0003 유지 (Lightsail 2GB + RDS)
- 장점: 관리형 백업·패치, 앱과 DB 장애 분리.
- 단점: 월 약 1.5만 원 더 비싸다. VPC 피어링 구성과 RDS pgvector 버전 확인이 필요하다.

### Lightsail 2GB 통합
- 장점: 월 약 3.6만 원으로 가장 싸다.
- 단점: 메모리 여유가 작다. 재색인이나 순간 부하에서 OOM 위험이 있다. 실측 후 내릴 수 있다.

### EC2 t4g.small 통합
- 장점: VPC·IAM 학습.
- 단점: 2GB인데 Lightsail 4GB와 비용이 비슷하다. ARM이라 이미지 호환을 확인해야 한다.

### HTTPS 프록시: Nginx + certbot / Lightsail 로드밸런서
- Nginx: 자료가 많지만 인증서 발급·갱신 설정이 따로 필요하다.
- 로드밸런서: 월 약 $18이 추가된다.

## Consequences

- 운영자가 DB 백업과 복원 확인, 이미지 업데이트, 디스크·메모리 감시를 맡는다. 하루 1회 백업이면 최대 하루치 변경을 잃을 수 있다.
- 서버 1대 장애는 앱과 DB를 함께 멈춘다. 개인 포트폴리오 규모에서 수용한다.
- 컨테이너별 메모리 상한, JVM 힙의 컨테이너 기준 설정, Postgres 메모리 설정, Docker 로그 크기 제한이 필요하다.
- Spring은 Caddy(같은 서버) 뒤에 있으므로 질문 제한의 방문자 IP는 Caddy가 붙인 헤더만 신뢰하도록 설정한다.
- 비용은 계산값이며 실제 청구, 성능, 메모리는 미검증이다. 부족하면 스냅샷으로 더 큰 번들로 옮긴다.
- ADR-0002의 "RDS 유지" 후속 결정과 ADR-0003의 서버 사양·DB 부분을 이 ADR이 대체한다.

## Related Documents

- [ADR-0002](ADR-0002-operating-budget-auth-and-limits.md)
- [ADR-0003](ADR-0003-initial-deployment.md)
- [AWS Cost Proposal](../02-design/AWS_COST_PROPOSAL.md)
- [Deployment Plan](../04-plans/DEPLOYMENT_PLAN.md)
