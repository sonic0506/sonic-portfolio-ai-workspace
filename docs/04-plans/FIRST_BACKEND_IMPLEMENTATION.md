# First Backend Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task in this session. Steps use checkbox syntax for tracking.

**Goal:** Java 21 서버를 기동하고 PostgreSQL/pgvector 스키마와 QueryDSL 조회를 실제 DB에서 검증한다.

**Architecture:** `backend/`에 단일 Spring Boot 애플리케이션을 둔다. 기존 DATA_MODEL을 마이그레이션의 기준으로 사용하고 최초 조회는 공통 기술 목록으로 한정한다. 이후 프로젝트·블로그·프로필과 RAG를 순서대로 확장한다.

**Tech Stack:** ADR-0009의 Java 21, Gradle Groovy 9.7.1, Boot 4.1.1, Spring AI 2.0.1, QueryDSL 5.1.0 Jakarta, PostgreSQL 17, pgvector 0.8.2.

**Spec:** `docs/02-design/DATA_MODEL.md`, `docs/02-design/API_DESIGN.md`, ADR-0001/0005/0008/0009.

## Global Constraints

- 전체 MVP와 월 모든 비용 포함 100,000원 예산을 유지한다. 이번 단계에서 클라우드 리소스를 만들지 않는다.
- 생성·임베딩 API를 호출하지 않는다. 실제 RAG 통합은 후속 기능이다.
- Hibernate `ddl-auto=validate`, Spring AI 벡터 스키마 자동 생성 비활성화. DB 변경은 SQL 마이그레이션으로 관리한다.
- 비밀값은 환경변수로 주입한다. 프론트 도구 및 인증 상세는 해당 기능 착수 시 결정한다.
- 아래 API 주소와 패키지는 첫 구현안이며 기존 공개 서비스 계약은 없다.

## Task 1 — 서버 기동 및 DB 마이그레이션

**Files:**
- Create: `backend/build.gradle`, `backend/gradlew`, `backend/gradlew.bat`, `backend/gradle/wrapper/gradle-wrapper.properties`
- Create: `backend/src/main/java/dev/portfolio/portfolio_api/PortfolioApiApplication.java`
- Create: `backend/src/main/resources/application.yml`
- Create: `backend/src/main/resources/db/migration/V1__content_and_rag_schema.sql`
- Create: `backend/src/test/java/dev/portfolio/SchemaTest.java`
- Create: `backend/README.md`, `backend/.gitignore`

**Interfaces:** DB 연결은 `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`로 받는다. Task 2는 V1의 skill 테이블을 사용한다.

- [x] Initializr 프로젝트와 Gradle Wrapper가 backend/에 추가됐다. Swagger 및 QueryDSL Jakarta processor를 build.gradle에 설정했다. 기존 생성 의존성을 유지한다.
- [x] 실제 PG 스키마 검증 테스트를 작성한다. (구현: 별도 SchemaTest 대신 생성된 `PortfolioApiApplicationTests.migratesSchemaAndDoesNotReapplyIt`에 작성. 아래 3개 값에 `vector(1536)` 컬럼 타입 검사를 추가했다. 마이그레이션 추가 전 실패 여부는 기록이 없어 미확인)

  원 계획: 실제 PG 테스트용 SchemaTest를 작성한다. 아래 SQL의 각 값이 기대와 같은지 JDBC로 검증한다. 마이그레이션을 넣기 전 실패를 확인한다.

```sql
select extversion from pg_extension where extname = 'vector'; -- 0.8.2
select count(*) from information_schema.tables
where table_schema = 'public' and table_type = 'BASE TABLE'
  and table_name <> 'flyway_schema_history'; -- 20
select count(*) from pg_indexes
where schemaname = 'public' and indexdef ilike '%using hnsw%'; -- 1
```

- [x] 진입점은 아래 코드로 작성한다. (Initializr 생성 코드와 동일)

```java
package dev.portfolio.portfolio_api;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
@SpringBootApplication
public class PortfolioApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(PortfolioApiApplication.class, args);
    }
}
```

- [x] V1에는 `CREATE EXTENSION IF NOT EXISTS vector;` 다음으로 DATA_MODEL의 SQL 블록 10개를 원래 순서대로 옮긴다. 세션 정책이 미정인 필드에 추가 제약을 임의로 넣지 않는다. (2026-09-16 확인: 주석 제외 공백 정규화 비교 시 V1 = extension 1줄 + DATA_MODEL SQL 10블록과 동일, create table 20개)
- [x] application.yml에 datasource 환경변수, ddl-auto=validate, open-in-view=false를 설정한다. 이 단계는 AI 모델 자동 구성을 끄고 API 키 없이 기동한다. pgvector 자동 스키마 생성을 켜지 않는다. 기존 document_chunk 연결 방식을 정한 뒤 필요한 모듈을 추가한다. (구현: Initializr 형식에 맞춰 `application.properties`(공통: validate, open-in-view=false, flyway clean 금지)와 `application-local.properties`(.env 로드, 127.0.0.1 바인딩, DB 환경변수, `spring.ai.model.*=none`)로 나눴다. 로컬 DB는 `backend/compose.yaml`의 digest 고정 pgvector 0.8.2-pg17 이미지를 사용한다)
- [x] 임시 PostgreSQL 17/pgvector 0.8.2 DB에서 `./gradlew clean test bootJar` 실행. 같은 DB에 다시 실행해 V1이 중복 적용되지 않는지 확인한다. 테스트 DB를 종료한다. (2026-09-16 11:38 KST 사용자 로컬 실행 결과: 테스트 2건 성공, PostgreSQL 17.10에 V1 적용 후 재실행 migrate 0건, bootJar 생성. 같은 테스트 안의 `flyway.migrate()` 재호출로 중복 미적용을 확인했다. DB 컨테이너 종료 여부는 미확인)
- [x] 성공 결과와 실행 방법을 README에 기록하고 `feat: bootstrap backend with database migrations` 단위로 커밋한다.

## Task 2 — 기술 목록 조회로 JPA/QueryDSL 연결 검증

**Files:**
- Create: `backend/src/main/java/dev/portfolio/skill/Skill.java`
- Create: `backend/src/main/java/dev/portfolio/skill/SkillController.java`
- Create: `backend/src/test/java/dev/portfolio/skill/SkillApiTest.java`
- Modify: `docs/02-design/API_DESIGN.md`

**Interfaces:** `GET /api/skills` → `[{"id":1,"code":"java","name":"Java","iconKey":null}]`. 빈 목록은 `200 []`. Entity를 응답으로 직접 노출하지 않고 record DTO를 사용한다.

- [x] 테스트 DB에 `java`와 `react` 두 기술을 삽입하고 GET 요청 결과의 필드와 code 오름차순을 검증한다. 요청 전 각 테스트의 데이터를 트랜잭션으로 격리한다. 구현 전 404로 실패하는지 확인한다. (구현: `SkillApiTest`. 테스트와 구현을 함께 작성해 404 실패 단계는 관찰하지 못했다)

```java
mockMvc.perform(get("/api/skills"))
    .andExpect(status().isOk())
    .andExpect(jsonPath("$[0].code").value("java"))
    .andExpect(jsonPath("$[1].code").value("react"))
    .andExpect(jsonPath("$[0].createdAt").doesNotExist());
```

- [x] Skill은 DATA_MODEL의 id/code/name/icon_key/created_at에 맞춘 Jakarta entity로 작성한다. 생성된 QSkill로 조회한다. 단순 조회를 위해 별도 인터페이스와 구현체 쌍을 만들지 않는다. (구현: 패키지는 컴포넌트 스캔 범위에 맞춰 `dev.portfolio.portfolio_api.skill`. `created_at`은 `Instant`, 읽기 전용 매핑. `JPAQueryFactory`는 `config/QuerydslConfig` 빈으로 주입)

```java
var skill = QSkill.skill;
var rows = new JPAQueryFactory(entityManager)
    .selectFrom(skill).orderBy(skill.code.asc()).fetch();
```

- [x] Controller의 read-only 트랜잭션 안에서 조회 결과를 `SkillResponse(Long id, String code, String name, String iconKey)`로 매핑한다. 익명 조회만 만들고 관리 변경 API는 인증 기능 단계로 둔다. (구현: Spring Security 기본 차단을 피하려고 임시 `config/SecurityConfig`를 두었다. `GET /api/skills`만 익명 허용하고 나머지는 인증을 요구한다. 관리자 인증 정책 결정은 아니다)
- [x] `./gradlew clean test bootJar`로 Q 타입 생성, 스키마 검사, API 테스트를 함께 통과시킨다. 빈 테이블 응답과 중복 code 삽입 거부도 검증한다. (2026-09-16 13:21 KST 사용자 로컬 실행: BUILD SUCCESSFUL, 전체 6건 성공. SkillApiTest 4건 = 정렬·필드, 빈 목록, 중복 거부, 다른 경로 익명 차단)
- [x] API_DESIGN에 응답 계약을 기록하고 `feat: expose skill catalog with QueryDSL` 단위로 커밋한다.

## 완료 기준과 후속 순서

- API 키 없이 서버 기동, 기존 20개 테이블 마이그레이션 성공, QueryDSL 기반 실제 PostgreSQL 조회가 통과한다.
- 위 결과를 세션 문서에 기록한다. 이번 계획은 전체 MVP 완료를 뜻하지 않는다.
- 이후 프로젝트/블로그/프로필 조회 → 관리자 인증·CRUD → Document 색인·공개 필터 → RAG와 SSE 진행 UI → Graph/Playground 순으로 별도 구현 계획을 구체화한다. 각 기능 착수 전에 해당 데이터 계약과 수용 기준을 읽는다.
