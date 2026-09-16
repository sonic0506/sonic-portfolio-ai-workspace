package dev.portfolio.portfolio_api.admin;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Decides whether a GitHub user may act as admin (ADR-0010).
 * A configured numeric id takes precedence over the login; nothing configured means nobody is admin.
 */
@Component
public class AdminAccessPolicy {

    private final String allowedLogin;
    private final String allowedId;

    public AdminAccessPolicy(
            @Value("${app.admin.github-login:}") String allowedLogin,
            @Value("${app.admin.github-id:}") String allowedId) {
        this.allowedLogin = allowedLogin == null ? "" : allowedLogin.trim();
        this.allowedId = allowedId == null ? "" : allowedId.trim();
    }

    public boolean isAllowed(Map<String, Object> githubAttributes) {
        if (!allowedId.isEmpty()) {
            Object id = githubAttributes.get("id");
            return id != null && allowedId.equals(String.valueOf(id));
        }
        if (!allowedLogin.isEmpty()) {
            Object login = githubAttributes.get("login");
            return login instanceof String s && allowedLogin.equalsIgnoreCase(s);
        }
        return false;
    }
}
