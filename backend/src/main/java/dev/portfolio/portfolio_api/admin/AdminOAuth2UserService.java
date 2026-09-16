package dev.portfolio.portfolio_api.admin;

import java.util.List;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;

/** Loads the GitHub user and grants ROLE_ADMIN only to the allowed account; others fail to log in. */
@Component
public class AdminOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final OAuth2UserService<OAuth2UserRequest, OAuth2User> delegate = new DefaultOAuth2UserService();
    private final AdminAccessPolicy policy;

    public AdminOAuth2UserService(AdminAccessPolicy policy) {
        this.policy = policy;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User user = delegate.loadUser(request);
        if (!policy.isAllowed(user.getAttributes())) {
            throw new OAuth2AuthenticationException(new OAuth2Error("access_denied", "not an allowed admin", null));
        }
        return new DefaultOAuth2User(
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")), user.getAttributes(), "login");
    }
}
