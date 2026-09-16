package dev.portfolio.portfolio_api.rag;

import java.util.List;

/** Text embeddings (text-embedding-3-small, 1536 dimensions, ADR-0006). */
public interface EmbeddingClient {

    int DIMENSIONS = 1536;

    /** False when no embedding model is configured (EMBEDDING_PROVIDER=none). */
    boolean enabled();

    /** One vector per input, in order. */
    List<float[]> embed(List<String> texts);
}
