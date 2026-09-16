package dev.portfolio.portfolio_api.rag;

/** Published inside the admin transaction when a document needs (re)indexing. */
public record DocumentChangedEvent(long documentId) {
}
