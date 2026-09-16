package dev.portfolio.portfolio_api.rag;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/** After an admin change commits, indexes the changed document in the background (only if embeddings are on). */
@Component
public class DocumentIndexListener {

    private static final Logger log = LoggerFactory.getLogger(DocumentIndexListener.class);

    private final DocumentIndexer indexer;

    public DocumentIndexListener(DocumentIndexer indexer) {
        this.indexer = indexer;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onDocumentChanged(DocumentChangedEvent event) {
        if (!indexer.enabled()) {
            return;
        }
        try {
            indexer.indexOne(event.documentId());
        } catch (RuntimeException e) {
            log.warn("Background indexing of document {} failed", event.documentId(), e);
        }
    }
}
