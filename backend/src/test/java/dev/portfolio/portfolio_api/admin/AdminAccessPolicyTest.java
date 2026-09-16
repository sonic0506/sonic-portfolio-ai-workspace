package dev.portfolio.portfolio_api.admin;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Map;
import org.junit.jupiter.api.Test;

class AdminAccessPolicyTest {

    @Test
    void allowsConfiguredLoginIgnoringCase() {
        var policy = new AdminAccessPolicy("sonic0506", "");
        assertTrue(policy.isAllowed(Map.of("login", "Sonic0506", "id", 1)));
        assertFalse(policy.isAllowed(Map.of("login", "someone-else", "id", 2)));
        assertFalse(policy.isAllowed(Map.of("id", 1)));
    }

    @Test
    void numericIdTakesPrecedenceOverLogin() {
        var policy = new AdminAccessPolicy("sonic0506", "12345");
        assertTrue(policy.isAllowed(Map.of("login", "renamed", "id", 12345)));
        assertFalse(policy.isAllowed(Map.of("login", "sonic0506", "id", 99)));
    }

    @Test
    void deniesEveryoneWhenNothingConfigured() {
        var policy = new AdminAccessPolicy("", " ");
        assertFalse(policy.isAllowed(Map.of("login", "sonic0506", "id", 1)));
    }
}
