package dev.portfolio.portfolio_api.rag;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import dev.portfolio.portfolio_api.seed.SampleSeeder;
import dev.portfolio.portfolio_api.support.ApiTestSupport;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;

/** Seeds samples/, then compares Java chunking with the PoC measurement (poc/results/2026-09-10-chunks.json). */
@Import(FakeEmbeddingClient.Config.class)
class SampleIndexTest extends ApiTestSupport {

    static final Path SAMPLES = Path.of("..", "samples").toAbsolutePath().normalize();

    @Autowired SampleSeeder seeder;
    @Autowired DocumentIndexer indexer;
    @Autowired FakeEmbeddingClient embeddings;

    @BeforeEach
    void seed() {
        embeddings.reset();
        for (String table : List.of("document", "project", "blog_post", "profile", "category", "tag", "skill")) {
            jdbc.update("delete from " + table);
        }
        seeder.seed(SAMPLES);
    }

    @Test
    void projectsSamplesWithoutAdminDataAndLinksRelations() {
        assertEquals(7, count("select count(*) from document"));
        assertEquals(7, count("select count(*) from document where index_status = 'PENDING'"));
        assertEquals(1, count("""
                select count(*) from document d join blog_post b on b.id = d.source_id
                where d.document_type = 'BLOG' and b.slug = 'offline-first-boundary' and not d.visible"""));
        assertEquals(1, count("select count(*) from document where document_type = 'PROFILE' and visible"));
        assertEquals(0, count("select count(*) from document where content like '%:::questions%'"));
        assertEquals(0, count("select count(*) from document where content like '%측정값 확보%'"
                + " or content like '%AI가 작성한 샘플 초안%'"));
        assertEquals(1, count("""
                select count(*) from document where document_type = 'PROJECT'
                and metadata->>'slug' = 'yujin-robot' and metadata->'skills' @> '["nestjs"]'"""));
        // "source references target": syncmaster→web-serial, syncmaster→offline, yujin→websocket, web-serial→offline
        assertEquals(4, count("select count(*) from document_relation"));
        assertEquals(1, count("""
                select count(*) from document_relation r
                join document s on s.id = r.source_document_id join document t on t.id = r.target_document_id
                where s.metadata->>'slug' = 'web-serial-usb' and t.metadata->>'slug' = 'offline-first-boundary'"""));
    }

    @Test
    void indexingMatchesPocChunkingAndStores1536DimVectors() {
        DocumentIndexer.Result result = indexer.indexPending();
        assertEquals(new DocumentIndexer.Result(true, 7, 0, 0), result);

        Map<String, Integer> expected = Map.of("offline-first-boundary", 5, "web-serial-usb", 6,
                "websocket-binary-video", 5, "syncmaster", 4, "viora", 8, "yujin-robot", 7);
        expected.forEach((slug, chunks) -> assertEquals(chunks, count(
                "select count(*) from document_chunk c join document d on d.id = c.document_id"
                        + " where d.metadata->>'slug' = '" + slug + "'"), slug));

        String samples = "from document_chunk c join document d on d.id = c.document_id where d.document_type <> 'PROFILE'";
        assertEquals(35, count("select count(*) " + samples));
        assertEquals(205, count("select min(char_length(c.content)) " + samples));
        assertEquals(821, count("select max(char_length(c.content)) " + samples));
        assertEquals(367, count("select percentile_disc(0.5) within group (order by char_length(c.content)) " + samples));
        assertEquals(9, count("select count(*) " + samples + " and cardinality(c.section_titles) > 1"));

        assertEquals(0, count("select count(*) from document_chunk where vector_dims(embedding) <> 1536"));
        assertEquals(7, count("select count(*) from document where index_status = 'READY' and indexed_at is not null"));
        assertTrue(count("select count(*) from document_chunk c join document d on d.id = c.document_id"
                + " where d.document_type = 'PROFILE'") > 0);
    }

    @Test
    void reseedingUnchangedContentKeepsReadyStatus() {
        indexer.indexPending();
        int calls = embeddings.calls.get();
        seeder.seed(SAMPLES);
        assertEquals(7, count("select count(*) from document where index_status = 'READY'"));
        assertEquals(new DocumentIndexer.Result(true, 0, 0, 0), indexer.indexPending());
        assertEquals(calls, embeddings.calls.get());
        assertFalse(embeddings.calls.get() == 0);
    }

    private int count(String sql) {
        return jdbc.queryForObject(sql, Integer.class);
    }
}
