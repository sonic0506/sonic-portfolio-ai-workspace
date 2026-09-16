package dev.portfolio.portfolio_api.chat;

import java.util.function.Consumer;

/** Answer generation (gpt-4.1-mini, temperature 0, ADR-0007). */
public interface ChatGenerator {

    boolean enabled();

    /** Streams answer text pieces to onDelta; returns when the answer is complete. */
    void stream(String systemPrompt, String userPrompt, Consumer<String> onDelta);
}
