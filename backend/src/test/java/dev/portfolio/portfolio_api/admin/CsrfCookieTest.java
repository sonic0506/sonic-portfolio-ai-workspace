package dev.portfolio.portfolio_api.admin;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.portfolio.portfolio_api.support.ApiTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;

/**
 * Needs a fresh context: spring-security-test's csrf() post-processor permanently swaps the shared
 * CsrfFilter's repository for a session-based one, so the cookie repository is only observable
 * before any test in the same context has used csrf(). Do not use csrf() in this class.
 */
@DirtiesContext(classMode = ClassMode.BEFORE_CLASS)
class CsrfCookieTest extends ApiTestSupport {

    @Test
    void adminMeIssuesScriptReadableCsrfCookie() throws Exception {
        mockMvc.perform(get("/api/admin/me").with(admin()))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("XSRF-TOKEN"))
                .andExpect(cookie().httpOnly("XSRF-TOKEN", false));
    }
}
