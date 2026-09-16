# Portfolio API

Java 21 / Spring Boot 4.1.1 / Gradle Groovy Wrapper 9.7.1 / Spring AI 2.0.1. 버전 기준은 [ADR-0009](../docs/03-decisions/ADR-0009-backend-build-baseline.md)이다.

## 로컬 실행

```sh
cp .env.example .env          # DB_PASSWORD를 로컬 전용 값으로 변경
docker compose up -d --wait   # pgvector 0.8.2 / PostgreSQL 17, 127.0.0.1:5433 (v2가 없으면 docker-compose up -d)
./gradlew clean test bootJar
./gradlew bootRun --args='--spring.profiles.active=local'
```

### 샘플 콘텐츠 넣기 (local 전용)

```sh
./gradlew bootRun --args='--spring.profiles.active=local --app.seed.samples-dir=../samples'
```

`samples/`의 기술 목록·카테고리/태그(`taxonomy.md`)·프로젝트·블로그·프로필(`profile.md`)을 관리 서비스로 등록한 뒤 서버가 계속 실행된다. 같은 code/slug는 교체하므로 여러 번 실행해도 중복되지 않는다. 관련 글(Relation)은 넣지 않는다.

### 코드 변경 자동 반영 (DevTools)

`spring-boot-devtools`(`developmentOnly`, 실행 JAR에는 포함되지 않음)가 **컴파일된 클래스 변경**을 감지해 앱을 자동 재시작한다. 소스 저장만으로는 반영되지 않으니 컴파일을 함께 돌린다.

```sh
./gradlew compileJava --continuous                          # 터미널 1: 변경 시 자동 컴파일
./gradlew bootRun --args='--spring.profiles.active=local'   # 터미널 2: 서버
```

IntelliJ는 "Build project automatically"와 "Allow auto-make to start even if developed application is currently running"을 켜면 저장 시 반영된다.
재시작하면 메모리 세션이 사라져 GitHub 로그인을 다시 거친다(ADR-0010).

- 관리자 로그인: GitHub OAuth App(콜백 `http://localhost:8080/login/oauth2/code/github`)의 값을 `.env`의 `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`에 넣고 `http://localhost:8080/oauth2/authorization/github`로 접속한다. 값이 없어도 서버와 테스트는 동작한다([ADR-0010](../docs/03-decisions/ADR-0010-admin-authentication.md)).
- `local` 프로필은 `backend/.env`를 읽는다. `.env`는 커밋하지 않는다. `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `DB_PORT`로 바꿀 수 있다.
- 테스트는 `local`+`test` 프로필로 같은 DB 서버의 **별도 데이터베이스 `portfolio_test`**를 쓴다. 개발용 `portfolio` DB의 데이터(시드 포함)와 서로 영향을 주지 않는다.

### 테스트 DB (최초 1회)

새로 만든 DB 볼륨이면 `docker/init-test-db.sql`이 자동으로 만든다. 기존 볼륨이면 한 번만 직접 만든다.

```sh
docker ps                                   # pgvector 컨테이너 이름 확인
docker exec -it <컨테이너 이름> psql -U portfolio -d portfolio -c 'create database portfolio_test'
```

테스트가 처음 실행될 때 Flyway가 `portfolio_test`에 스키마(V1)를 만든다.
- 서버는 `127.0.0.1`에만 바인딩한다.
- OpenAI 모델 자동 구성은 모두 `none`이다. API 키 없이 기동하며, 이 단계에서는 생성·임베딩 API를 호출하지 않는다.
- 스키마는 Flyway(`src/main/resources/db/migration`)로만 바꾼다. Hibernate는 `validate`이며 Flyway clean은 막혀 있다. V1은 [DATA_MODEL](../docs/02-design/DATA_MODEL.md)의 SQL 10블록과 같다. 적용 후 수정하지 말고 새 버전을 추가한다.

## 검증 결과 — 2026-09-16

로컬 테스트 DB에서 전체 테스트 54건이 성공했다(공개 조회·관리자 인증·전체 콘텐츠 관리·샘플 시드 포함, 계약은 [API_DESIGN](../docs/02-design/API_DESIGN.md)).

- `QuerydslSetupTest`: Jakarta Q 타입 생성과 조건식 구성
- `PortfolioApiApplicationTests`: 컨텍스트 기동, V1 적용(PostgreSQL 17.10), pgvector 0.8.2, 테이블 20개, HNSW 1개, `vector(1536)`, 재실행 시 migrate 0건
- `ProjectApiTest`·`BlogApiTest`·`ProfileApiTest`: 공개 조회, 비공개·관리자 필드 제외, 정렬·페이지·필터
- `AdminAccessPolicyTest`·`AdminSecurityTest`·`CsrfCookieTest`: 허용 계정 판정, 401/403, 로그인 실패 403, CSRF 쿠키, 로그아웃
- `SkillAdminApiTest`: 관리자 Skill 생성·수정·삭제, 검증·중복·참조 충돌
- `ProjectAdminApiTest`·`BlogPostAdminApiTest`·`ProfileAdminApiTest`·`TaxonomyAdminApiTest`: 콘텐츠 관리, 발행일 규칙, 하위 목록 교체, 충돌·검증
- `SwaggerAccessTest`: local 프로필에서 `/v3/api-docs` 익명 접근
- `SkillApiTest`(4건): `GET /api/skills` 정렬·응답 필드, 빈 목록, 중복 code 거부, 다른 경로 익명 차단

실행 JAR도 생성됐다. 생성 코드는 `build/generated/` 아래에 두며 커밋하지 않는다.

## 아직 검증하지 않은 것

- `bootRun`으로 띄운 서버 프로세스(테스트 컨텍스트 기동만 확인)
- Swagger UI 화면(`bootRun` 후 `/swagger-ui.html`). local 프로필에서만 켜지고 익명 허용된다
- Spring AI 호출과 기존 `document_chunk` 연동, S3·PGvector 모듈, RDS 배포
