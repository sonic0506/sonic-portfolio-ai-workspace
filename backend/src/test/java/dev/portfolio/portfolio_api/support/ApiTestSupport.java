package dev.portfolio.portfolio_api.support;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.OAuth2LoginRequestPostProcessor;
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

    /** A logged-in GitHub admin session (ROLE_ADMIN), as granted by AdminOAuth2UserService. */
    protected static OAuth2LoginRequestPostProcessor admin() {
        return oauth2Login()
                .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))
                .attributes(a -> {
                    a.put("id", 159202139);
                    a.put("login", "sonic0506");
                    a.put("name", "Sonic");
                    a.put("avatar_url", "https://avatars/x");
                });
    }

    protected long insertReturningId(String sql, Object... args) {
        return jdbc.queryForObject(sql + " returning id", Long.class, args);
    }

    protected long skill(String code, String name) {
        return insertReturningId("insert into skill (code, name) values (?, ?)", code, name);
    }
}
