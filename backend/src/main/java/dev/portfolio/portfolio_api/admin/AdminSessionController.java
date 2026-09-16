package dev.portfolio.portfolio_api.admin;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AdminSessionController {

    public record AdminMe(String login, String name, String avatarUrl) {
    }

    /** Current admin. Reading the CSRF token here makes the XSRF-TOKEN cookie available to the admin UI. */
    @GetMapping("/api/admin/me")
    public AdminMe me(@AuthenticationPrincipal OAuth2User user, CsrfToken csrfToken) {
        csrfToken.getToken();
        return new AdminMe(
                (String) user.getAttribute("login"),
                (String) user.getAttribute("name"),
                (String) user.getAttribute("avatar_url"));
    }
}
