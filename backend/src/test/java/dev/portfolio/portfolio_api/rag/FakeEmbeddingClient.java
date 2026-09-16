package dev.portfolio.portfolio_api.rag;

import java.util.List;
import java.util.Random;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/** Deterministic 1536-d vectors; can be switched off, made to fail, or run a hook before returning. */
public class FakeEmbeddingClient implements EmbeddingClient {

    public volatile boolean enabled = true;
    public volatile RuntimeException failure;
    public volatile Runnable beforeReturn;
    public final AtomicInteger calls = new AtomicInteger();

    public void reset() {
        enabled = true;
        failure = null;
        beforeReturn = null;
        calls.set(0);
    }

    @Override
    public boolean enabled() {
        return enabled;
    }

    @Override
    public List<float[]> embed(List<String> texts) {
        calls.incrementAndGet();
        if (failure != null) {
            throw failure;
        }
        if (beforeReturn != null) {
            beforeReturn.run();
        }
        return texts.stream().map(text -> {
            Random random = new Random(text.hashCode());
            float[] vector = new float[DIMENSIONS];
            for (int i = 0; i < vector.length; i++) {
                vector[i] = random.nextFloat() - 0.5f;
            }
            return vector;
        }).toList();
    }

    @TestConfiguration
    public static class Config {
        @Bean
        @Primary
        FakeEmbeddingClient fakeEmbeddingClient() {
            return new FakeEmbeddingClient();
        }
    }
}
