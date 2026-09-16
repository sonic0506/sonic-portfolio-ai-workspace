package dev.portfolio.portfolio_api.config;

import dev.portfolio.portfolio_api.admin.AdminOAuth2UserService;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Public GET endpoints are anonymous; /api/admin/** needs the GitHub admin (ADR-0010).
 * Session cookie + CSRF cookie token; /api/** answers 401 instead of redirecting to login.
 */
@Configuration
public class SecurityConfig {

    static final String LOGIN_URL = "/oauth2/authorization/github";

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
            AdminOAuth2UserService adminUserService,
            @Value("${app.security.swagger-public:false}") boolean swaggerPublic,
            @Value("${app.admin.login-success-url:/api/admin/me}") String loginSuccessUrl) throws Exception {

        http.authorizeHttpRequests(auth -> {
            auth.requestMatchers("/error").permitAll();
            auth.requestMatchers(HttpMethod.GET, PUBLIC_GET).permitAll();
            auth.requestMatchers(HttpMethod.POST, "/api/chat", "/api/chat/sessions", "/api/chat/sessions/*/messages")
                    .permitAll();
            auth.requestMatchers(HttpMethod.GET, "/api/chat/sessions/*").permitAll();
            auth.requestMatchers(HttpMethod.DELETE, "/api/chat/sessions/*").permitAll();
            if (swaggerPublic) {
                auth.requestMatchers(HttpMethod.GET, SWAGGER).permitAll();
            }
            auth.requestMatchers("/api/admin/**").hasRole("ADMIN");
            auth.anyRequest().authenticated();
        });

        http.oauth2Login(login -> login
                .userInfoEndpoint(userInfo -> userInfo.userService(adminUserService))
                .defaultSuccessUrl(loginSuccessUrl, true)
                // No redirect on failure: a redirect needs login again and GitHub re-approves instantly,
                // so a non-admin account would loop forever. Answer 403 via the permitted /error page.
                .failureHandler((request, response, exception) ->
                        response.sendError(HttpServletResponse.SC_FORBIDDEN, "GitHub account is not allowed")));

        http.exceptionHandling(e -> e.authenticationEntryPoint(entryPoint()));

        CsrfTokenRequestAttributeHandler csrfHandler = new CsrfTokenRequestAttributeHandler();
        csrfHandler.setCsrfRequestAttributeName(null);
        http.csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(csrfHandler)
                // Chat uses no cookies (session key travels in a header), so there is nothing for CSRF to protect.
                .ignoringRequestMatchers("/api/chat", "/api/chat/**"));

        http.logout(logout -> logout
                .logoutUrl("/api/admin/logout")
                .logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler(HttpStatus.NO_CONTENT)));

        http.cors(Customizer.withDefaults());
        return http.build();
    }

    private static AuthenticationEntryPoint entryPoint() {
        AuthenticationEntryPoint api = new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED);
        AuthenticationEntryPoint browser = new LoginUrlAuthenticationEntryPoint(LOGIN_URL);
        return (request, response, ex) -> {
            String path = request.getRequestURI().substring(request.getContextPath().length());
            if (path.startsWith("/api/")) {
                api.commence(request, response, ex);
            } else {
                browser.commence(request, response, ex);
            }
        };
    }

    /** Empty by default: no cross-origin access until the admin domain is decided (ADR-0010 section 4). */
    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origins:}") String allowedOrigins) {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).toList();
        if (!origins.isEmpty()) {
            CorsConfiguration config = new CorsConfiguration();
            config.setAllowedOrigins(origins);
            config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
            config.setAllowedHeaders(List.of("Content-Type", "X-XSRF-TOKEN", "X-Chat-Session-Key"));
            config.setAllowCredentials(true);
            source.registerCorsConfiguration("/api/**", config);
        }
        return source;
    }
}
