package dev.portfolio.portfolio_api.chat;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
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
        ChatRateLimiter limiter = new ChatRateLimiter(true, 2, 3, clock);
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
        ChatRateLimiter limiter = new ChatRateLimiter(false, 0, 0, new MutableClock());
        assertTrue(limiter.tryAcquire("a"));
    }
}
