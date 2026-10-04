package dev.portfolio.portfolio_api.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.portfolio.portfolio_api.support.ApiTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;

/** ADR-0017: CORS only for the portfolio's chat (no credentials), anonymous health check. */
@TestPropertySource(properties = "app.cors.allowed-origins=https://www.sonic-portfolio.com")
class DeploymentAccessTest extends ApiTestSupport {

    private static final String PORTFOLIO = "https://www.sonic-portfolio.com";

    @Test
    void chatPreflightFromPortfolioIsAllowedWithoutCredentials() throws Exception {
        mockMvc.perform(options("/api/chat/sessions/abc/messages")
                        .header("Origin", PORTFOLIO)
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "content-type,x-chat-session-key"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", PORTFOLIO))
                .andExpect(header().doesNotExist("Access-Control-Allow-Credentials"));
    }

    @Test
    void adminApiGetsNoCorsEvenFromPortfolio() throws Exception {
        mockMvc.perform(options("/api/admin/faqs")
                        .header("Origin", PORTFOLIO)
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    @Test
    void chatPreflightFromOtherOriginIsRejected() throws Exception {
        mockMvc.perform(options("/api/chat/sessions")
                        .header("Origin", "https://evil.example")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden());
    }

    @Test
    void healthIsAnonymous() throws Exception {
        mockMvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }
}
