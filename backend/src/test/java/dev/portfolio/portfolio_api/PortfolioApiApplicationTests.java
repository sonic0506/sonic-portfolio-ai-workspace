package dev.portfolio.portfolio_api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.jdbc.core.JdbcTemplate;
import org.flywaydb.core.Flyway;
import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@ActiveProfiles({"local", "test"})
class PortfolioApiApplicationTests {
    @Autowired JdbcTemplate jdbc;
    @Autowired Flyway flyway;

    @Test
    void migratesSchemaAndDoesNotReapplyIt() {
        assertEquals("0.8.2", jdbc.queryForObject("select extversion from pg_extension where extname='vector'", String.class));
        assertEquals(22, jdbc.queryForObject("select count(*) from information_schema.tables where table_schema='public' and table_type='BASE TABLE' and table_name <> 'flyway_schema_history'", Integer.class));
        assertEquals(1, jdbc.queryForObject("select count(*) from pg_indexes where schemaname='public' and indexdef ilike '%using hnsw%'", Integer.class));
        assertEquals("vector(1536)", jdbc.queryForObject("select format_type(atttypid, atttypmod) from pg_attribute where attrelid='document_chunk'::regclass and attname='embedding'", String.class));
        assertEquals(0, flyway.migrate().migrationsExecuted);
        assertEquals(1, jdbc.queryForObject("select count(*) from flyway_schema_history where success and version='1'", Integer.class));
        assertEquals(1, jdbc.queryForObject("select count(*) from flyway_schema_history where success and version='2'", Integer.class));
        assertEquals(1, jdbc.queryForObject("select count(*) from flyway_schema_history where success and version='3'", Integer.class));
        assertEquals(1, jdbc.queryForObject("select count(*) from flyway_schema_history where success and version='4'", Integer.class));
        assertEquals(1, jdbc.queryForObject("select count(*) from flyway_schema_history where success and version='5'", Integer.class));
    }
}
