package dev.portfolio.portfolio_api.rag;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.portfolio.portfolio_api.support.ApiTestSupport;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.support.TransactionTemplate;

@Import(FakeEmbeddingClient.Config.class)
class DocumentIndexerTest extends ApiTestSupport {

    @Autowired DocumentIndexer indexer;
    @Autowired DocumentProjector projector;
    @Autowired FakeEmbeddingClient embeddings;
    @Autowired TransactionTemplate tx;

    long projectId;
    long documentId;

    @BeforeEach
    void seed() {
        embeddings.reset();
        jdbc.update("delete from document");
        jdbc.update("delete from project");
        projectId = insertReturningId(
                "insert into project (slug, title, summary, period_start, published) values ('ix', 't', 's', ?, true)",
                LocalDate.of(2024, 1, 1));
        section("개요", "가".repeat(300));
        section("배경", "나".repeat(300));
        projector.projectProject(projectId);
        documentId = projector.documentId(DocumentProjector.Type.PROJECT, projectId);
    }

    @Test
    void indexesPendingDocument() {
        assertEquals(DocumentIndexer.Outcome.INDEXED, indexer.indexOne(documentId));
        assertEquals("READY", indexStatus());
        assertEquals(2, count("select count(*) from document_chunk where document_id = " + documentId));
        assertEquals("{개요}", jdbc.queryForObject(
                "select section_titles::text from document_chunk where document_id = ? and chunk_index = 0",
                String.class, documentId));
        // already READY: nothing to do
        assertEquals(DocumentIndexer.Outcome.SKIPPED, indexer.indexOne(documentId));
    }

    @Test
    void failureIsRecordedAndRetried() {
        embeddings.failure = new IllegalStateException("rate limited");
        assertEquals(DocumentIndexer.Outcome.FAILED, indexer.indexOne(documentId));
        assertEquals("FAILED", indexStatus());
        assertEquals("rate limited", jdbc.queryForObject(
                "select index_error from document where id = ?", String.class, documentId));
        assertEquals(0, count("select count(*) from document_chunk where document_id = " + documentId));

        embeddings.failure = null;
        assertEquals(new DocumentIndexer.Result(true, 1, 0, 0), indexer.indexPending());
        assertEquals("READY", indexStatus());
        assertNull(jdbc.queryForObject("select index_error from document where id = ?", String.class, documentId));
    }

    @Test
    void contentChangedDuringEmbeddingStaysPending() {
        embeddings.beforeReturn = () -> {
            jdbc.update("update content_section set body_markdown = 'changed' where project_id = ?", projectId);
            projector.projectProject(projectId);
        };
        assertEquals(DocumentIndexer.Outcome.SKIPPED, indexer.indexOne(documentId));
        assertEquals("PENDING", indexStatus());
        assertEquals(0, count("select count(*) from document_chunk where document_id = " + documentId));
    }

    @Test
    void disabledEmbeddingsLeaveDocumentsPending() {
        embeddings.enabled = false;
        assertEquals(new DocumentIndexer.Result(false, 0, 0, 0), indexer.indexPending());
        assertEquals(DocumentIndexer.Outcome.SKIPPED, indexer.indexOne(documentId));
        assertEquals("PENDING", indexStatus());
        assertEquals(0, embeddings.calls.get());
    }

    @Test
    void adminApiRebuildsAndReindexes() throws Exception {
        jdbc.update("delete from document"); // e.g. data that existed before projection was introduced
        mockMvc.perform(post("/api/admin/rag/reindex").param("rebuild", "true").with(admin()).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.embeddingEnabled").value(true))
                .andExpect(jsonPath("$.indexed").value(1))
                .andExpect(jsonPath("$.documents.length()").value(1))
                .andExpect(jsonPath("$.documents[0].type").value("PROJECT"))
                .andExpect(jsonPath("$.documents[0].indexStatus").value("READY"))
                .andExpect(jsonPath("$.documents[0].chunkCount").value(2));

        mockMvc.perform(get("/api/admin/rag/documents").with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].visible").value(true));
        mockMvc.perform(get("/api/admin/rag/documents")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/admin/rag/reindex").with(admin())).andExpect(status().isForbidden());
    }

    private void section(String title, String body) {
        jdbc.update("insert into content_section (project_id, title, body_markdown, display_order)"
                + " values (?, ?, ?, (select count(*) from content_section where project_id = ?))",
                projectId, title, body, projectId);
    }

    private String indexStatus() {
        return jdbc.queryForObject("select index_status from document where id = ?", String.class, documentId);
    }

    private int count(String sql) {
        return jdbc.queryForObject(sql, Integer.class);
    }
}
