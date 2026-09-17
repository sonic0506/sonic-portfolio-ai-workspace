package dev.portfolio.portfolio_api.chat;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Daily question limits per client IP and overall (ADR-0002). In memory: counts reset on restart,
 * which is acceptable for a single server whose goal is capping model cost. IPs in the exempt list
 * (e.g. the owner's) are neither limited nor counted.
 */
@Component
public class ChatRateLimiter {

    private final boolean enabled;
    private final int perIp;
    private final int global;
    private final Set<String> exemptIps;
    private final Clock clock;
    private final ConcurrentHashMap<String, AtomicInteger> counts = new ConcurrentHashMap<>();
    private final AtomicInteger total = new AtomicInteger();
    private volatile LocalDate day;

    @Autowired // two constructors: tell Spring which one to use
    public ChatRateLimiter(
            @Value("${app.chat.limit.enabled:true}") boolean enabled,
            @Value("${app.chat.limit.per-ip-per-day:20}") int perIp,
            @Value("${app.chat.limit.global-per-day:300}") int global,
            @Value("${app.chat.limit.exempt-ips:}") String exemptIps) {
        this(enabled, perIp, global, parseIps(exemptIps), Clock.system(ZoneId.of("Asia/Seoul")));
    }

    ChatRateLimiter(boolean enabled, int perIp, int global, Set<String> exemptIps, Clock clock) {
        this.enabled = enabled;
        this.perIp = perIp;
        this.global = global;
        this.exemptIps = Set.copyOf(exemptIps);
        this.clock = clock;
        this.day = LocalDate.now(clock);
    }

    /** Counts the question and returns false when a limit is already reached. */
    public synchronized boolean tryAcquire(String clientIp) {
        if (!enabled || exemptIps.contains(clientIp)) {
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

    /** Comma-separated list, blanks ignored. */
    static Set<String> parseIps(String value) {
        if (value == null || value.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(value.split(",")).map(String::strip).filter(ip -> !ip.isEmpty())
                .collect(Collectors.toUnmodifiableSet());
    }

    public synchronized void reset() {
        counts.clear();
        total.set(0);
    }
}
