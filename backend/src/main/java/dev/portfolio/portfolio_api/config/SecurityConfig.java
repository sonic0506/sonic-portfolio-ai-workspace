package dev.portfolio.portfolio_api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Temporary baseline until the admin authentication policy is decided.
 * Only public read endpoints are anonymous; everything else is rejected.
 */
@Configuration
public class SecurityConfig {

    private static final String[] PUBLIC_GET = {
            "/api/skills",
            "/api/projects", "/api/projects/*",
            "/api/blog/posts", "/api/blog/posts/*",
            "/api/profile",
    };

    private static final String[] SWAGGER = {
            "/v3/api-docs", "/v3/api-docs/**", "/swagger-ui.html", "/swagger-ui/**",
    };

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            @Value("${app.security.swagger-public:false}") boolean swaggerPublic) throws Exception {
        http.authorizeHttpRequests(auth -> {
            auth.requestMatchers("/error").permitAll();
            auth.requestMatchers(HttpMethod.GET, PUBLIC_GET).permitAll();
            if (swaggerPublic) {
                auth.requestMatchers(HttpMethod.GET, SWAGGER).permitAll();
            }
            auth.anyRequest().authenticated();
        });
        return http.build();
    }
}
