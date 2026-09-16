package dev.portfolio.portfolio_api.rag;

import java.time.Instant;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class RagAdminService {

    public record DocumentStatus(
            long id, String type, long sourceId, String title, boolean visible,
            String indexStatus, String indexError, Instant indexedAt, int chunkCount) {
    }

    public record ReindexResult(boolean embeddingEnabled, int indexed, int failed, int skipped,
                                List<DocumentStatus> documents) {
    }

    private final JdbcTemplate jdbc;
    private final TransactionTemplate tx;
    private final DocumentProjector projector;
    private final DocumentIndexer indexer;

    public RagAdminService(JdbcTemplate jdbc, TransactionTemplate tx, DocumentProjector projector,
                           DocumentIndexer indexer) {
        this.jdbc = jdbc;
        this.tx = tx;
        this.projector = projector;
        this.indexer = indexer;
    }

    public List<DocumentStatus> documents() {
        return jdbc.query("""
                select d.id, d.document_type, d.source_id, d.title, d.visible, d.index_status, d.index_error,
                       d.indexed_at, (select count(*) from document_chunk c where c.document_id = d.id) as chunks
                from document d order by d.document_type, d.source_id""",
                (rs, n) -> new DocumentStatus(rs.getLong("id"), rs.getString("document_type"),
                        rs.getLong("source_id"), rs.getString("title"), rs.getBoolean("visible"),
                        rs.getString("index_status"), rs.getString("index_error"),
                        rs.getTimestamp("indexed_at") == null ? null : rs.getTimestamp("indexed_at").toInstant(),
                        rs.getInt("chunks")));
    }

    /**
     * Indexes PENDING/FAILED documents. With rebuild, first re-projects all sources and queues every document.
     * Without an embedding model only the projection happens.
     */
    public ReindexResult reindex(boolean rebuild) {
        if (rebuild) {
            tx.executeWithoutResult(status -> {
                projector.rebuildAll();
                jdbc.update("""
                        update document set index_status = 'PENDING', index_error = null, updated_at = now()
                        where index_status <> 'INDEXING'""");
            });
        }
        DocumentIndexer.Result result = indexer.indexPending();
        return new ReindexResult(result.embeddingEnabled(), result.indexed(), result.failed(), result.skipped(),
                documents());
    }
}
