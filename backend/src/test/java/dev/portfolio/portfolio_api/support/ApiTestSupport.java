package dev.portfolio.portfolio_api.support;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

/** Real local PostgreSQL; every test's rows are rolled back. */
@SpringBootTest
@ActiveProfiles("local")
@Transactional
public abstract class ApiTestSupport {

    @Autowired protected WebApplicationContext context;
    @Autowired protected JdbcTemplate jdbc;

    protected MockMvc mockMvc;

    @BeforeEach
    void setUpMockMvc() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    protected long insertReturningId(String sql, Object... args) {
        return jdbc.queryForObject(sql + " returning id", Long.class, args);
    }

    protected long skill(String code, String name) {
        return insertReturningId("insert into skill (code, name) values (?, ?)", code, name);
    }
}
