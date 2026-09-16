package dev.portfolio.portfolio_api.chat;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Daily question limits per client IP and overall (ADR-0002). In memory: counts reset on restart,
 * which is acceptable for a single server whose goal is capping model cost.
 */
@Component
public class ChatRateLimiter {

    private final boolean enabled;
    private final int perIp;
    private final int global;
    private final Clock clock;
    private final ConcurrentHashMap<String, AtomicInteger> counts = new ConcurrentHashMap<>();
    private final AtomicInteger total = new AtomicInteger();
    private volatile LocalDate day;

    @Autowired // two constructors: tell Spring which one to use
    public ChatRateLimiter(
            @Value("${app.chat.limit.enabled:true}") boolean enabled,
            @Value("${app.chat.limit.per-ip-per-day:20}") int perIp,
            @Value("${app.chat.limit.global-per-day:300}") int global) {
        this(enabled, perIp, global, Clock.system(ZoneId.of("Asia/Seoul")));
    }

    ChatRateLimiter(boolean enabled, int perIp, int global, Clock clock) {
        this.enabled = enabled;
        this.perIp = perIp;
        this.global = global;
        this.clock = clock;
        this.day = LocalDate.now(clock);
    }

    /** Counts the question and returns false when a limit is already reached. */
    public synchronized boolean tryAcquire(String clientIp) {
        if (!enabled) {
            return true;
        }
        LocalDate today = LocalDate.now(clock);
        if (!today.equals(day)) {
            reset();
            day = today;
        }
        AtomicInteger mine = counts.computeIfAbsent(clientIp, ip -> new AtomicInteger());
        if (mine.get() >= perIp || total.get() >= global) {
            return false;
        }
        mine.incrementAndGet();
        total.incrementAndGet();
        return true;
    }

    public synchronized void reset() {
        counts.clear();
        total.set(0);
    }
}
