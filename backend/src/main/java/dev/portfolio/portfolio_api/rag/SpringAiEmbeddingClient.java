package dev.portfolio.portfolio_api.rag;

import java.util.ArrayList;
import java.util.List;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;

/** Uses the Spring AI EmbeddingModel when one is configured; otherwise reports itself disabled. */
@Component
public class SpringAiEmbeddingClient implements EmbeddingClient {

    private static final int BATCH = 64;

    private final ObjectProvider<EmbeddingModel> models;

    public SpringAiEmbeddingClient(ObjectProvider<EmbeddingModel> models) {
        this.models = models;
    }

    @Override
    public boolean enabled() {
        return models.getIfAvailable() != null;
    }

    @Override
    public List<float[]> embed(List<String> texts) {
        EmbeddingModel model = models.getIfAvailable();
        if (model == null) {
            throw new IllegalStateException("embedding model is not configured");
        }
        List<float[]> vectors = new ArrayList<>(texts.size());
        for (int i = 0; i < texts.size(); i += BATCH) {
            vectors.addAll(model.embed(texts.subList(i, Math.min(i + BATCH, texts.size()))));
        }
        return vectors;
    }
}
