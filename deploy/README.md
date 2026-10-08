# Deploy

운영 구성과 결정 근거는 [ADR-0017](../docs/03-decisions/ADR-0017-single-server-docker-deployment.md), 전체 순서는 [DEPLOYMENT_PLAN](../docs/04-plans/DEPLOYMENT_PLAN.md)을 따른다.

```
www.sonic-portfolio.com   → Vercel (frontend/portfolio)
admin.sonic-portfolio.com → Vercel (frontend/admin, vercel.json rewrite → api)
api.sonic-portfolio.com   → Lightsail: caddy → api(Spring) → db(pgvector)
```

## 1. 서버 최초 준비 (Lightsail Ubuntu, 한 번만)

```bash
# Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu   # 다시 로그인
# swap 2GB
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
# 보안 업데이트 자동 적용
sudo apt-get install -y unattended-upgrades
mkdir -p ~/portfolio
```

로컬에서 설정 파일을 올리고 비밀값을 채운다.

```bash
scp deploy/compose.prod.yaml deploy/Caddyfile deploy/.env.example ubuntu@<고정IP>:~/portfolio/
# 서버에서
cd ~/portfolio && cp .env.example .env && chmod 600 .env && vi .env
```

DNS의 `api.sonic-portfolio.com` A 레코드가 고정 IP를 가리켜야 Caddy가 인증서를 받는다.

## 2. 백엔드 배포 (매번)

로컬(저장소 루트)에서 실행한다. 서버에서는 빌드하지 않는다.

```bash
(cd backend && ./gradlew bootJar)
docker build --platform linux/amd64 -t portfolio-api backend
docker save portfolio-api | gzip | ssh ubuntu@<고정IP> 'gunzip | docker load'
ssh ubuntu@<고정IP> 'cd ~/portfolio && docker compose -f compose.prod.yaml up -d'
```

확인:

```bash
curl https://api.sonic-portfolio.com/actuator/health
ssh ubuntu@<고정IP> 'cd ~/portfolio && docker compose -f compose.prod.yaml logs --tail 100 api'
```

첫 기동 때 Flyway가 V1부터 적용한다.

## 3. 콘텐츠 시드 (첫 배포 때 한 번만)

시드는 `local` 프로필 전용이다(`SampleSeedRunner`). 그래서 운영 서버에서 돌리지 않고, Mac에서 SSH 터널로 운영 DB에 붙어 기존 시드를 그대로 실행한다. 실행 전에 Lightsail 스냅샷을 찍는다.

```bash
# 터미널 1: 운영 DB(서버 127.0.0.1:5432)를 Mac 5434로 연결
ssh -N -L 5434:127.0.0.1:5432 ubuntu@<고정IP>

# 터미널 2: backend/에서. 환경변수가 backend/.env보다 우선한다.
cd backend
DB_URL=jdbc:postgresql://localhost:5434/portfolio DB_PASSWORD='<운영 DB 비밀번호>' \
EMBEDDING_PROVIDER=openai OPENAI_API_KEY='<키>' \
./gradlew bootRun --args='--spring.profiles.active=local --app.seed.samples-dir=../content'
```

로그에서 시드 완료를 확인하면 `Ctrl+C`로 끈다. 그다음 어드민에서 색인 상태를 확인한다.

## 4. 백업

Lightsail 콘솔에서 인스턴스 자동 스냅샷을 켠다(2026-10-04 결정, pg_dump는 아직 하지 않는다). 스냅샷 하나로 서버와 DB 볼륨을 함께 되살린다. 복원은 한 번 연습해 둔다.

## Vercel 설정

| 프로젝트 | Root Directory | 환경변수 | 도메인 |
|---|---|---|---|
| portfolio | `frontend/portfolio` | `API_BASE_URL=https://api.sonic-portfolio.com`, `NEXT_PUBLIC_API_BASE_URL=https://api.sonic-portfolio.com` | `www.sonic-portfolio.com` (+ apex 리다이렉트) |
| admin | `frontend/admin` | 없음 (`.env.production`, `vercel.json` 사용) | `admin.sonic-portfolio.com` |

portfolio는 빌드할 때 정적 페이지를 만들며 `API_BASE_URL`로 백엔드를 부른다(ADR-0021). 백엔드가 꺼져 있으면 Vercel 빌드가 실패한다. 어드민 수정은 최대 5분 뒤 반영된다.
