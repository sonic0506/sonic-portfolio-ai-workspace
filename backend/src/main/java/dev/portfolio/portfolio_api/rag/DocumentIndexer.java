package dev.portfolio.portfolio_api.rag;

import dev.portfolio.portfolio_api.rag.Chunker.Chunk;
import java.util.List;
import java.util.StringJoiner;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Chunks and embeds documents. The embedding call runs outside any transaction:
 * claim (PENDING/FAILED → INDEXING) → embed → replace chunks and mark READY only if the content hash is
 * unchanged; a document edited meanwhile stays PENDING for the next run. Failures are kept as FAILED.
 */
@Component
public class DocumentIndexer {

    public enum Outcome {
        INDEXED,
        FAILED,
        SKIPPED
    }

    public record Result(boolean embeddingEnabled, int indexed, int failed, int skipped) {
    }

    private static final Logger log = LoggerFactory.getLogger(DocumentIndexer.class);

    private record Claim(String content, String hash) {
    }

    private final JdbcTemplate jdbc;
    private final TransactionTemplate tx;
    private final EmbeddingClient embeddings;

    public DocumentIndexer(JdbcTemplate jdbc, TransactionTemplate tx, EmbeddingClient embeddings) {
        this.jdbc = jdbc;
        this.tx = tx;
        this.embeddings = embeddings;
    }

    public boolean enabled() {
        return embeddings.enabled();
    }

    public Result indexPending() {
        if (!embeddings.enabled()) {
            return new Result(false, 0, 0, 0);
        }
        int indexed = 0;
        int failed = 0;
        int skipped = 0;
        for (Long id : jdbc.queryForList(
                "select id from document where index_status in ('PENDING', 'FAILED') order by id", Long.class)) {
            switch (indexOne(id)) {
                case INDEXED -> indexed++;
                case FAILED -> failed++;
                case SKIPPED -> skipped++;
            }
        }
        return new Result(true, indexed, failed, skipped);
    }

    public Outcome indexOne(long documentId) {
        if (!embeddings.enabled()) {
            return Outcome.SKIPPED;
        }
        Claim claim = tx.execute(status -> {
            int claimed = jdbc.update("""
                    update document set index_status = 'INDEXING', index_error = null, updated_at = now()
                    where id = ? and index_status in ('PENDING', 'FAILED')""", documentId);
            if (claimed == 0) {
                return null;
            }
            return jdbc.queryForObject("select content, metadata->>'contentHash' as hash from document where id = ?",
                    (rs, n) -> new Claim(rs.getString("content"), rs.getString("hash")), documentId);
        });
        if (claim == null) {
            return Outcome.SKIPPED;
        }

        List<Chunk> chunks = Chunker.chunk(claim.content());
        List<float[]> vectors;
        try {
            vectors = chunks.isEmpty() ? List.of() : embeddings.embed(chunks.stream().map(Chunk::text).toList());
            if (vectors.size() != chunks.size()) {
                throw new IllegalStateException("expected " + chunks.size() + " embeddings, got " + vectors.size());
            }
            for (float[] vector : vectors) {
                if (vector.length != EmbeddingClient.DIMENSIONS) {
                    throw new IllegalStateException("expected " + EmbeddingClient.DIMENSIONS
                            + " dimensions, got " + vector.length);
                }
            }
        } catch (RuntimeException e) {
            log.warn("Indexing document {} failed", documentId, e);
            String message = String.valueOf(e.getMessage());
            tx.executeWithoutResult(status -> jdbc.update("""
                    update document set index_status = 'FAILED', index_error = ?, updated_at = now()
                    where id = ? and index_status = 'INDEXING'""",
                    message.length() > 1000 ? message.substring(0, 1000) : message, documentId));
            return Outcome.FAILED;
        }

        return tx.execute(status -> {
            var current = jdbc.query(
                    "select index_status, metadata->>'contentHash' as hash from document where id = ? for update",
                    rs -> rs.next() ? new String[] {rs.getString(1), rs.getString(2)} : null, documentId);
            if (current == null || !"INDEXING".equals(current[0]) || !claim.hash().equals(current[1])) {
                return Outcome.SKIPPED; // deleted or edited meanwhile; the newer state wins
            }
            jdbc.update("delete from document_chunk where document_id = ?", documentId);
            for (int i = 0; i < chunks.size(); i++) {
                Chunk chunk = chunks.get(i);
                jdbc.update("""
                        insert into document_chunk (document_id, chunk_index, content, section_titles, embedding)
                        values (?, ?, ?, cast(? as text[]), cast(? as vector))""",
                        documentId, i, chunk.text(), chunk.sectionTitles().toArray(String[]::new),
                        vectorLiteral(vectors.get(i)));
            }
            jdbc.update("""
                    update document set index_status = 'READY', index_error = null, indexed_at = now(),
                    updated_at = now() where id = ?""", documentId);
            return Outcome.INDEXED;
        });
    }

    static String vectorLiteral(float[] vector) {
        StringJoiner joiner = new StringJoiner(",", "[", "]");
        for (float v : vector) {
            joiner.add(Float.toString(v));
        }
        return joiner.toString();
    }
}
