# AWS Cost Proposal

Status: Comparison history — ADR-0003(Vercel + Lightsail 2GB + RDS)을 거쳐 2026-10-04 ADR-0017(Vercel + Lightsail 4GB에 앱·DB·Caddy를 Docker로 통합, 약 56,100원)로 변경했다. 아래는 검토 당시 기록이다. 실제 배포하지 않음.

Checked: 2026-09-09

## 최신 결정 및 Lightsail / EC2 비교

사용자는 RDS 유지를 확정했다. DB 직접 운영 후보는 채택하지 않는다. 아래 서버 비교는 Vercel Hobby에 Next.js/React를 두는 가정이며, 앱 서버 선택과 Vercel 채택은 아직 미확정이다.

서울 Linux On-Demand, 월 730시간, 환율 1,500원, 세금 여유 10%, 무료 체험/약정 제외. EC2는 gp3 20GB와 공인 IPv4 1개 포함. Lightsail 2GB는 디스크 60GB/전송 3TB/IPv4 포함 번들이므로 동일한 디스크 용량 비교는 아니다. API 용도에서 EC2 20GB를 가정했다.

| 항목 | Lightsail 2GB | EC2 t4g.small | EC2 t3a.small | EC2 t3.small |
|---|---:|---:|---:|---:|
| 서버 실행 USD | 12.00 | 15.184 | 17.082 | 18.980 |
| gp3 20GB USD | 포함 | 1.824 | 1.824 | 1.824 |
| 공인 IPv4 USD | 포함 | 3.650 | 3.650 | 3.650 |
| 서버 소계 원 | 19,800 | 34,086 | 37,217 | 40,349 |
| RDS·AI·기타 포함 전체 원 | 70,736 | 85,021 | 88,153 | 91,285 |

- 공통 RDS·AI·S3·백업/로그/네트워크·도메인 예산은 $30.87이다. 소규모 트래픽, CPU 초과 크레딧 0을 가정한다. EC2 인터넷 전송은 AWS 공통 월 100GB 무료 범위 내인 가정이며, 다른 AWS 사용량과 합산한다. ALB/NAT Gateway/유료 CI를 추가하지 않았다.
- Lightsail은 저렴하고 번들 비용이 예측하기 쉽다. RDS 사설 연결에는 같은 리전 기본 VPC 피어링 구성이 필요하다.
- EC2는 VPC/서브넷/보안 그룹/인스턴스 역할을 직접 구성한다. RDS와 같은 VPC에서 연결하고, S3는 EC2 IAM 역할의 임시 자격증명으로 접근할 수 있다. 네트워크/IAM 학습에 유리하다.
- 둘 다 VM 직접 운영으로 Java 실행/컨테이너 배포, HTTPS 프록시, 앱 재시작, 로그, OS 패치는 직접 관리한다. Lightsail이 Spring Boot를 자동 관리해 주는 것은 아니다.
- t4g는 ARM64이므로 JDK/컨테이너와 네이티브 의존성 호환성을 확인한다. t3a/t3는 x86 계열 대안이다. 명목 2vCPU/2GB가 같아도 실제 성능이 같다고 가정하지 않는다.
- Lightsail과 EC2 T 계열 모두 버스트 특성을 고려한다. EC2 T4g/T3a/T3 기본 Unlimited는 지속 고부하 시 추가 크레딧 비용이 발생할 수 있다. CPU 모드/모니터링을 설계한다.
- 제안: 비용과 RAG 구현 집중이 우선이면 Lightsail 2GB, AWS 인프라 학습에 월 약 14,300원을 더 배정할 의향이 있으면 EC2 t4g.small. 두 안 모두 단일 앱 서버이므로 이중화는 없다.

### 비교 근거

- [서울 EC2 공식 가격표](https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonEC2/current/ap-northeast-2/index.json), publicationDate 2026-09-09: Linux Shared Used / NA 기준 t4g.small SKU AW8AKUMZKQEQXMSZ $0.0208/h, t3a.small C2X6J7RSNDMJVBF6 $0.0234/h, t3.small PZHVQ3KFPA3RHA5V $0.026/h, gp3 MTK7D9SGKGYR3JD6 $0.0912/GB-month.
- [공인 IPv4 요금](https://aws.amazon.com/vpc/pricing/): $0.005/시간.
- [EC2 요금/전송](https://aws.amazon.com/ec2/pricing/on-demand/).
- [EC2 IAM 역할](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html).
- [T 계열 Unlimited](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/burstable-performance-instances-unlimited-mode.html).
- [EC2 아키텍처 사양](https://docs.aws.amazon.com/ec2/latest/instancetypes/gp.html).

공식 단가와 산술만 검증했으며 실제 배포/성능/ARM 의존성은 미검증이다.

## 추천 구성

- 서울(ap-northeast-2), Lightsail Linux IPv4 4GB / 2vCPU / 80GB 번들 1대.
- 같은 서버에서 Next.js, Spring Boot, React 정적 빌드 및 HTTPS 리버스 프록시를 운영한다. 빌드는 로컬/CI에서 수행하며 추가 유료 CI 비용은 가정하지 않는다.
- RDS PostgreSQL db.t4g.micro(1GiB), Single-AZ, gp3 20GB, pgvector. 표준 지원 중인 엔진/확장 버전을 배포 전에 확정한다.
- 같은 리전의 기본 VPC와 Lightsail VPC를 피어링한다. RDS는 공개 접근을 끄고 앱 서버의 사설 접근만 허용한다. NAT Gateway/로드밸런서는 이 안에 포함하지 않는다.
- S3에는 이미지/첨부파일을 저장한다. Graph와 Playground는 기존 앱에 포함한다.
- 생성 모델 비용 산정 후보는 gpt-4.1-mini, 임베딩은 text-embedding-3-small. 모델 선택은 실제 한국어 RAG 평가 후 확정한다.

## 추가 절약 후보: Vercel Hobby + AWS — Proposed

- Next.js와 React를 Vercel Hobby의 별도 프로젝트로 배포하고, Lightsail에는 Spring Boot와 HTTPS 프록시만 운영한다. RDS/S3/OpenAI는 유지한다.
- Lightsail 2GB($12) 기준 합계 $42.87, 약 70,736원. 기존 4GB 통합안 대비 19,800원 절감이다. 이미 2GB로 낮춘 AWS 통합안과는 같은 금액이지만 Next.js가 빠져 백엔드 메모리 여유가 늘어난다.
- 1GB($7)까지 낮추면 약 62,486원이지만 JVM/RAG 색인 시 메모리 부족 가능성이 있어 성능 검증 전 추천하지 않는다. 무료 프론트엔드로 옮겨도 AWS 서버 사양을 유지하면 고정비는 줄지 않는다.
- Vercel은 개인 비상업적 이용 및 무료 사용량 범위가 조건이다. 프로젝트 2개 구성은 허용 개수 내지만 각 프로젝트에 무료 사용량이 독립적으로 배정된다고 가정하지 않는다. Git 조직 소유 저장소의 Hobby Git 연결은 제한된다.
- 한도 초과 시 기능 이용이 중단될 수 있다. Next.js SSR/이미지 처리 사용량을 관찰하고 콘텐츠 캐싱을 적용한다.
- RAG 생성/색인과 GitHub 관리자 인증은 Spring Boot에서 처리한다. 브라우저/API 연결의 CORS·쿠키·CSRF 및 도메인 정책은 후속 설계한다. Vercel 배포 자체가 관리자 접근 통제를 대신하지 않는다.
- 별도 클라우드로 나뉜 API 통신 지연과 AWS 전송량은 실제 사용량으로 검증한다. 위 계산은 기존 소규모 전송 예산을 유지한 추정이다.
- 근거: [Vercel Hobby](https://vercel.com/docs/plans/hobby), [이용 조건](https://vercel.com/docs/limits/fair-use-guidelines), [한도](https://vercel.com/docs/limits), [Lightsail 요금](https://aws.amazon.com/lightsail/pricing/). 2026-09-09 조회. 아직 배포 방식 변경을 확정하지 않았다.

## DB 추가 절약 비교 — Proposed

- 조회한 서울 RDS PostgreSQL Single-AZ On-Demand 가격표에서 db.t4g.micro($0.025/시간)가 가장 저렴하다. 현재 gp3 20GiB도 일반 SSD 최소 구성이다. RDS 사양 축소만으로 추가 절약하기 어렵다.
- Vercel 무료 조건 충족을 전제로, Lightsail 4GB에 Spring Boot와 PostgreSQL/pgvector를 함께 설치하면 전체 월 약 56,100원이다. 2GB 통합은 약 36,300원이나 JVM/DB/색인이 메모리를 경쟁하므로 PoC 수준 후보이다. 기존 S3/백업/로그/OpenAI/도메인 예산과 환율/세금 가정을 유지한 추정이며 백업 사용량에 따라 달라진다.
- 4GB 직접 운영안도 DB 성능 보장은 없으며 메모리/쿼리/연결 수를 검증한다. 낮은 사양이 자동으로 검색 정확도를 낮추는 것은 아니지만 검색 지연, 색인 지연, 메모리 부족과 타임아웃이 발생할 수 있다.
- 직접 운영 시 영속 저장, 외부 DB 포트 차단, S3 자동 백업과 복원 검증, 디스크/메모리 감시, DB/OS 보안 업데이트를 운영자가 담당한다. 일 1회 백업만 있으면 장애 시 마지막 백업 이후 최대 약 하루의 변경을 잃을 수 있다. 더 짧은 복구 시점 목표는 별도 설계한다.
- 앱과 DB를 같은 서버에서 운영하면 서버 장애가 둘 모두에 영향을 준다. 이는 비용과 운영 책임의 교환이다. 관리형 DB 선호를 변경하는 결정은 아직 하지 않았다.
- Lightsail 관리형 DB는 pgvector 지원을 이번 공식 자료 조회로 확인하지 못했으므로 대체안으로 확정하지 않는다.

## 계산 가정

- 무료 체험, 크레딧, 예약 약정 없이 730시간/월 운영.
- 환율은 실제 환율 조회값이 아닌 예산 계산용 1 USD = 1,500원. 전체 달러 합계에 세금 여유 10%를 적용한다. 실제 과세/결제 환율은 청구 시 달라질 수 있다.
- 월 1,000회 생성 호출(공개 질문과 Playground/평가 합산), 호출당 전체 입력 4,000토큰/출력 800토큰, 캐시 할인 제외.
- 이미지 중심 S3 저장 1GB, 외부 전송 5GB/월 수준. 영상 제외. 전체 웹 전송은 Lightsail 번들 범위 이내, 피어링/로그/백업은 소규모 사용 가정.
- 도메인은 일반 도메인의 연간 요금 월할 예산이며 프리미엄 도메인을 포함하지 않는다. 구매월 현금 지출은 월할액보다 크다.

## 월 비용

| 항목 | 세전 USD | 세금 여유 포함 원화 |
|---|---:|---:|
| Lightsail 4GB | 24.00 | 39,600 |
| RDS micro: 0.025 × 730시간 | 18.25 | 30,113 |
| RDS gp3: 0.131 × 20GB | 2.62 | 4,323 |
| OpenAI 생성/임베딩/재시도 예산 | 4.00 | 6,600 |
| S3 저장·요청·전송 예산 | 1.00 | 1,650 |
| 스냅샷·로그·피어링 전송 등 예산 | 3.00 | 4,950 |
| 도메인 월할·DNS 예산 | 2.00 | 3,300 |
| 합계 | 54.87 | 약 90,536 |

첫 세 항목은 확인한 공식 단가로 계산했고, 나머지는 사용량 예산 배정이다. 반올림으로 행 합계와 총액에 차이가 날 수 있다.

- 환율 1,600원 가정: 약 96,571원. 31일(744시간), 환율 1,500원: 약 91,113원.
- 생성 1,000회 = (4,000 × $0.40 + 800 × $1.60) / 1,000,000 × 1,000 = $2.88. 임베딩 100만 토큰은 $0.02. $4 배정의 나머지는 재시도/추가 평가용이다.
- 월 10만 원 대비 약 9,464원 여유. 사용량·환율·추가 서비스에 따라 초과할 수 있는 추정치이며 청구 상한 보장은 아니다.

## 비교와 제약

- Lightsail 2GB($12)로 낮추면 동일 계산 약 70,736원이나, Next.js와 JVM 동시 운영의 메모리 여유가 작다. 우선 추천하지 않는다.
- RDS를 db.t4g.small($0.051/시간, 2GiB)로 올리면 동일 계산 약 121,853원으로 예산을 넘는다.
- micro의 1GiB에서 작은 문서 집합부터 검색/색인을 검증한다. 초기 문서 수나 동시 사용량에 대한 성능 보장은 없다. 지속 CPU 버스트 비용도 관찰한다.
- 앱 서버 1대와 Single-AZ DB라 장애/점검 중 중단될 수 있다. RDS 자동 백업과 복원 절차를 확인한다. 백업은 이중화를 대신하지 않는다.
- 서버 OS/앱 업데이트는 직접 관리한다. 관리형 DB 선호는 충족하지만 전체 인프라가 완전 관리형인 것은 아니다.

## 사용 제한 제안 — 미확정

- IP 기준 분당 5회/일 20회, 전체 생성 월 1,000회부터 시작한다. 공용 IP 사용자는 한도를 공유할 수 있다.
- 총 입력 컨텍스트와 출력 토큰 상한, 동시 호출 수, 재시도 횟수를 함께 제한한다.
- 활성화 플래그와 각 제한값은 설정으로 변경한다. 인증/권한 검사는 별개로 유지한다.
- 공개 챗봇뿐 아니라 Playground/재색인도 AI 비용 집계에 포함한다. 앱에서 호출 전 남은 예산을 검사하도록 설계한다.
- 비용 알림과 실제 호출 차단을 구분한다. 상세 집계 방식은 후속 설계한다.

## 공식 근거

- [Lightsail 가격](https://aws.amazon.com/lightsail/pricing/): 4GB $24, 2GB $12, 스냅샷 $0.05/GB-month.
- [서울 RDS 공식 가격표 JSON](https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonRDS/current/ap-northeast-2/index.json): 조회 시 publicationDate 2026-09-04, micro SKU ZBMXF2F4CYQ2FT96 $0.025/시간, small SKU UMH398UHTY46K8BK $0.051/시간, gp3 SKU 8TFTRRBWJSP95DQP $0.131/GB-month. 모두 PostgreSQL Single-AZ On-Demand.
- [RDS 가격/스토리지](https://aws.amazon.com/rds/postgresql/pricing/).
- [RDS 확장 지원](https://docs.aws.amazon.com/AmazonRDS/latest/PostgreSQLReleaseNotes/postgresql-extensions.html).
- [Lightsail VPC 피어링](https://docs.aws.amazon.com/lightsail/latest/userguide/lightsail-how-to-set-up-vpc-peering-with-aws-resources.html).
- [GPT-4.1 mini 단가](https://developers.openai.com/api/docs/models/gpt-4.1-mini), [임베딩 단가](https://developers.openai.com/api/docs/models/text-embedding-3-small).
- [S3 과금 항목](https://aws.amazon.com/s3/pricing/), [Route 53 가격](https://aws.amazon.com/route53/pricing/).

## 검증 범위

공식 문서/가격표 조회 및 산술 검증만 수행했다. AWS 리소스를 생성하지 않았고 실부하 성능, 결제 계정의 세금/환율, 최종 사용량 견적은 미검증이다.
