# Portfolio API

Java 21 / Spring Boot 4.1.1 / Gradle Groovy Wrapper 9.7.1 / Spring AI 2.0.1. 버전 기준은 [ADR-0009](../docs/03-decisions/ADR-0009-backend-build-baseline.md)이다.

## 로컬 실행

```sh
cp .env.example .env          # DB_PASSWORD를 로컬 전용 값으로 변경
docker compose up -d --wait   # pgvector 0.8.2 / PostgreSQL 17, 127.0.0.1:5433
./gradlew clean test bootJar
./gradlew bootRun --args='--spring.profiles.active=local'
```

- `local` 프로필은 `backend/.env`를 읽는다. `.env`는 커밋하지 않는다. `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `DB_PORT`로 바꿀 수 있다.
- 테스트(`PortfolioApiApplicationTests`)는 코드에서 `local` 프로필을 지정하므로 위 DB가 떠 있어야 한다.
- 서버는 `127.0.0.1`에만 바인딩한다.
- OpenAI 모델 자동 구성은 모두 `none`이다. API 키 없이 기동하며, 이 단계에서는 생성·임베딩 API를 호출하지 않는다.
- 스키마는 Flyway(`src/main/resources/db/migration`)로만 바꾼다. Hibernate는 `validate`이며 Flyway clean은 막혀 있다. V1은 [DATA_MODEL](../docs/02-design/DATA_MODEL.md)의 SQL 10블록과 같다. 적용 후 수정하지 말고 새 버전을 추가한다.

## 검증 결과 — 2026-09-16

로컬 DB에서 전체 테스트 2건이 성공했다.

- `QuerydslSetupTest`: Jakarta Q 타입 생성과 조건식 구성
- `PortfolioApiApplicationTests`: 컨텍스트 기동, V1 적용(PostgreSQL 17.10), pgvector 0.8.2, 테이블 20개, HNSW 1개, `vector(1536)`, 재실행 시 migrate 0건

실행 JAR도 생성됐다. 생성 코드는 `build/generated/` 아래에 두며 커밋하지 않는다.

## 아직 검증하지 않은 것

- `bootRun`으로 띄운 서버 프로세스(테스트 컨텍스트 기동만 확인)
- 엔티티 기반 JPA/QueryDSL 실제 조회: 첫 구현 계획 Task 2(`GET /api/skills`)
- Swagger UI(`/swagger-ui.html`, `/v3/api-docs`) HTTP 접근과 보안 접근 정책
- Spring AI 호출과 기존 `document_chunk` 연동, S3·PGvector 모듈, RDS 배포
