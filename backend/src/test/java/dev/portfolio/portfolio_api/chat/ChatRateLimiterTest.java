package dev.portfolio.portfolio_api.chat;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Set;
import org.junit.jupiter.api.Test;

class ChatRateLimiterTest {

    static class MutableClock extends Clock {
        Instant now = Instant.parse("2026-09-16T00:00:00Z");

        @Override
        public ZoneId getZone() {
            return ZoneOffset.ofHours(9);
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }

    @Test
    void limitsPerIpAndGloballyAndResetsNextDay() {
        MutableClock clock = new MutableClock();
        ChatRateLimiter limiter = new ChatRateLimiter(true, 2, 3, Set.of(), clock);
        assertTrue(limiter.tryAcquire("a"));
        assertTrue(limiter.tryAcquire("a"));
        assertFalse(limiter.tryAcquire("a"));
        assertTrue(limiter.tryAcquire("b"));
        assertFalse(limiter.tryAcquire("c"), "global limit");

        clock.now = clock.now.plusSeconds(24 * 3600);
        assertTrue(limiter.tryAcquire("a"));
    }

    @Test
    void disabledLimiterAllowsEverything() {
        ChatRateLimiter limiter = new ChatRateLimiter(false, 0, 0, Set.of(), new MutableClock());
        assertTrue(limiter.tryAcquire("a"));
    }

    @Test
    void exemptIpIsNeitherLimitedNorCounted() {
        ChatRateLimiter limiter = new ChatRateLimiter(true, 1, 2, Set.of("1.2.3.4"), new MutableClock());
        for (int i = 0; i < 5; i++) {
            assertTrue(limiter.tryAcquire("1.2.3.4"));
        }
        assertTrue(limiter.tryAcquire("a"));
        assertFalse(limiter.tryAcquire("a"), "per-IP limit still applies to others");
        assertTrue(limiter.tryAcquire("b"), "exempt questions did not use the global budget");
        assertFalse(limiter.tryAcquire("c"), "global limit");
    }

    @Test
    void parsesCommaSeparatedIps() {
        assertEquals(Set.of("127.0.0.1", "0:0:0:0:0:0:0:1"), ChatRateLimiter.parseIps(" 127.0.0.1, ,0:0:0:0:0:0:0:1 "));
        assertEquals(Set.of(), ChatRateLimiter.parseIps(""));
    }
}
