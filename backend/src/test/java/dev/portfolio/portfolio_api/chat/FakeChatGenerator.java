package dev.portfolio.portfolio_api.chat;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

public class FakeChatGenerator implements ChatGenerator {

    public volatile boolean enabled = true;
    public volatile List<String> deltas = List.of("답변");
    public volatile RuntimeException failure;
    public final List<String> userPrompts = new ArrayList<>();
    public final List<String> systemPrompts = new ArrayList<>();

    public void reset() {
        enabled = true;
        deltas = List.of("답변");
        failure = null;
        userPrompts.clear();
        systemPrompts.clear();
    }

    @Override
    public boolean enabled() {
        return enabled;
    }

    @Override
    public void stream(String systemPrompt, String userPrompt, Consumer<String> onDelta) {
        userPrompts.add(userPrompt);
        systemPrompts.add(systemPrompt);
        if (failure != null) {
            throw failure;
        }
        deltas.forEach(onDelta);
    }

    @TestConfiguration
    public static class Config {
        @Bean
        @Primary
        FakeChatGenerator fakeChatGenerator() {
            return new FakeChatGenerator();
        }
    }
}
