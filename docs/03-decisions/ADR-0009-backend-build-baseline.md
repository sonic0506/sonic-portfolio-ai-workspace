# ADR-0009: Backend Build Baseline

- Status: Accepted
- Date: 2026-09-16

## Context

사용자가 Java 21에 맞는 버전 선정과 Spring AI 사용 및 호환성 검증 진행을 요청했다. 현재 첫 작업은 백엔드이며 프론트 도구는 프론트 착수 시 고정한다.

## Decision

| 구성 | 기준 |
|---|---|
| Java | 21 LTS, 검증 JDK Temurin 21.0.12.1 |
| 빌드 | Gradle Groovy, Initializr Wrapper 9.7.1 |
| Spring Boot | 4.1.1 |
| Spring AI BOM | 2.0.1 |
| JPA / Hibernate / JDBC | Spring Boot BOM 관리 버전 사용 |
| QueryDSL | com.querydsl 5.1.0, jpa 및 apt의 jakarta classifier |
| Swagger UI | springdoc-openapi-starter-webmvc-ui 3.1.1 |
| DB | PostgreSQL 17 계열, pgvector 0.8.2 |

사용자가 Boot 4.1.1과 Gradle Groovy로 변경하고 Initializr 프로젝트를 backend/에 추가했다. 기존 poc/java-compat는 사용자가 제거했다. 현재 패키지는 생성된 dev.portfolio.portfolio_api를 유지한다. Swagger와 QueryDSL processor를 추가하며 Boot 관리 의존성은 개별 버전을 고정하지 않는다.

DB는 Java 버전보다 RDS 지원 및 드라이버 호환성을 기준으로 선정한다. 로컬 검증 버전은 PostgreSQL 17.10이다. RDS 서울에서 제공되는 정확한 17.x 패치는 배포 시 조회해 고정하고 로컬/CI도 맞춘다. RDS 17.10 제공 여부를 확인한 것은 아니다.

## 이전 Maven / Boot 3.5 검증 이력 (현재 버전의 검증 아님)

2026-09-16 Java 21 + Maven 3.9.11로 `poc/java-compat`와 동일한 임시 프로젝트를 컴파일해 BUILD SUCCESS를 확인했다. QueryDSL QArticle 생성 및 참조, Spring AI ChatClient.stream().content(), PgVectorStore, SseEmitter를 확인했다.

`pgvector/pgvector:0.8.2-pg17` 임시 컨테이너(PostgreSQL 17.10, pgvector 0.8.2)에서 DATA_MODEL의 SQL 블록 10개를 ON_ERROR_STOP=1로 실행했다. 20개 테이블과 HNSW 인덱스 생성에 성공했다. 컨테이너는 종료·삭제했다. 이미지 digest: `sha256:feb68f4f15446397d8cac7f4fe48fe4586de83160d1fc48b46283312d1a33966`.

이는 SQL 생성·컴파일 검증이다. 제품 컨텍스트 기동, JPA 실행, Spring AI의 DB 연동, 검색 품질/성능, RDS 배포는 아직 검증하지 않았다. Spring AI의 기본 vector_store 테이블과 기존 document_chunk 모델은 동일하지 않으므로 자동 스키마 생성을 켜지 않는다.

## Sources

- [Spring Boot Java/build support](https://docs.spring.io/spring-boot/3.5/system-requirements.html)
- [Spring AI supported Boot versions](https://github.com/spring-projects/spring-ai)
- [Spring AI released BOM versions](https://repo.maven.apache.org/maven2/org/springframework/ai/spring-ai-bom/maven-metadata.xml)
- [QueryDSL releases](https://github.com/querydsl/querydsl/releases)
- [RDS PostgreSQL extension updates](https://docs.aws.amazon.com/AmazonRDS/latest/PostgreSQLReleaseNotes/postgresql-versions.html)

## Next

[첫 백엔드 구현 계획](../04-plans/FIRST_BACKEND_IMPLEMENTATION.md)을 따른다. 전체 MVP 범위는 유지하며 첫 구현만 작은 단위로 시작한다.

## 현재 Gradle 검증 — 2026-09-16

backend/에서 `./gradlew --no-daemon clean test --tests '*QuerydslSetupTest' bootJar` 성공. Java 21 컴파일, Jakarta Q 타입 생성 및 조건식 테스트 1건, 실행 JAR 생성 확인. Swagger 3.1.1 의존성 해석 성공. 전체 contextLoads/Swagger HTTP/JPA 쿼리/AI 호출은 DB와 환경 설정 후 별도 검증한다.

## 로컬 DB 기동·마이그레이션 검증 — 2026-09-16

사용자 로컬에서 `backend/compose.yaml`(pgvector/pgvector:0.8.2-pg17, 위 digest 고정)로 DB를 띄우고 `local` 프로필로 전체 테스트를 실행했다(11:38 KST). 결과는 `build/test-results` 보고서 기준이다.

- 테스트 2건 성공: QuerydslSetupTest, PortfolioApiApplicationTests(`migratesSchemaAndDoesNotReapplyIt`)
- Spring 컨텍스트 기동 성공(OpenAI 모델 자동 구성 `none`, API 키 없음). Hibernate `ddl-auto=validate`
- Flyway가 PostgreSQL 17.10에 V1 적용. pgvector 0.8.2, 테이블 20개, HNSW 인덱스 1개, `document_chunk.embedding = vector(1536)` 확인
- 같은 DB에 `flyway.migrate()` 재호출 시 실행 0건, 성공 이력 V1 1건
- 실행 JAR(`portfolio-api-0.0.1-SNAPSHOT.jar`) 생성

미검증: 엔티티 매핑 기반 JPA/QueryDSL 실제 조회(첫 구현 계획 Task 2), Swagger HTTP 접근, Spring AI 호출·document_chunk 연동, RDS 배포.
