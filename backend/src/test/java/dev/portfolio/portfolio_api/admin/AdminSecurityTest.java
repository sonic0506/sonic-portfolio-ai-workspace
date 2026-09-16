package dev.portfolio.portfolio_api.admin;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.portfolio.portfolio_api.support.ApiTestSupport;
import org.junit.jupiter.api.Test;

class AdminSecurityTest extends ApiTestSupport {

    @Test
    void anonymousApiRequestGets401NotRedirect() throws Exception {
        mockMvc.perform(get("/api/admin/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void anonymousBrowserRequestIsSentToGithubLogin() throws Exception {
        mockMvc.perform(get("/some-page"))
                .andExpect(status().is3xxRedirection())
                .andExpect(header().string("Location", containsString("/oauth2/authorization/github")));
        mockMvc.perform(get("/oauth2/authorization/github"))
                .andExpect(status().is3xxRedirection())
                .andExpect(header().string("Location", containsString("github.com/login/oauth/authorize")));
    }

    @Test
    void failedLoginAnswers403InsteadOfRedirectLoop() throws Exception {
        // Callback without a stored authorization request fails authentication, like a non-admin account does.
        mockMvc.perform(get("/login/oauth2/code/github").param("code", "x").param("state", "y"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Location"));
    }

    @Test
    void adminSeesOwnProfile() throws Exception {
        mockMvc.perform(get("/api/admin/me").with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.login").value("sonic0506"))
                .andExpect(jsonPath("$.name").value("Sonic"))
                .andExpect(jsonPath("$.avatarUrl").value("https://avatars/x"));
    }

    @Test
    void loggedInUserWithoutAdminRoleIsForbidden() throws Exception {
        mockMvc.perform(get("/api/admin/me").with(oauth2Login()))
                .andExpect(status().isForbidden());
    }

    @Test
    void logoutRequiresCsrfAndReturns204() throws Exception {
        mockMvc.perform(post("/api/admin/logout").with(admin()))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/admin/logout").with(admin()).with(csrf()))
                .andExpect(status().isNoContent());
    }
}
