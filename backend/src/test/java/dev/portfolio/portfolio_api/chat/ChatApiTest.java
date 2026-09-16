package dev.portfolio.portfolio_api.chat;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.portfolio.portfolio_api.rag.EmbeddingClient;
import dev.portfolio.portfolio_api.rag.FakeEmbeddingClient;
import dev.portfolio.portfolio_api.support.ApiTestSupport;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Chunks carry one-hot embeddings so that the query vector decides the ranking exactly.
 * Documents: A (public, dim 0), four public fillers close to dim 0 (so the top 5 is A + fillers),
 * B (public, dim 1, related to A — only reachable through expansion),
 * C (private, dim 0 — the closest of all, related to A — must never leak).
 */
@Import({FakeEmbeddingClient.Config.class, FakeChatGenerator.Config.class})
class ChatApiTest extends ApiTestSupport {

    @Autowired FakeEmbeddingClient embeddings;
    @Autowired FakeChatGenerator generator;
    @Autowired ChatRateLimiter limiter;

    long a;
    long b;
    long c;

    @BeforeEach
    void seed() {
        embeddings.reset();
        generator.reset();
        limiter.reset();
        jdbc.update("delete from document");
        a = document("PROJECT", 1, "a-project", "프로젝트 A", true);
        b = document("BLOG", 2, "b-post", "블로그 B", true);
        c = document("BLOG", 3, "c-draft", "비공개 C", false);
        chunk(a, 0, "A 내용", oneHot(0, 0.9f));
        chunk(b, 0, "B 내용", oneHot(1, 1f));
        chunk(c, 0, "C 비밀 내용", oneHot(0, 1f));
        for (int i = 0; i < 4; i++) {
            long filler = document("PROJECT", 10 + i, "filler-" + i, "보조 " + i, true);
            float[] v = oneHot(0, 0.8f);
            v[2 + i] = 0.6f;
            chunk(filler, 0, "보조 내용 " + i, v);
        }
        jdbc.update("insert into document_relation (source_document_id, target_document_id) values (?, ?)", b, a);
        jdbc.update("insert into document_relation (source_document_id, target_document_id) values (?, ?)", a, c);
        embeddings.vectors = text -> oneHot(0, 1f);
    }

    @Test
    void streamsProgressAnswerAndCitedSourcesInOrder() throws Exception {
        generator.deltas = List.of("A는 이렇습니다", " [1].");
        String body = chat("A 경험이 있나요?");

        List<String> events = events(body);
        assertEquals(List.of("status", "documents", "status", "documents", "status",
                "answer_delta", "answer_delta", "done"), events);
        assertTrue(body.contains("\"stage\":\"SEARCHING\""));
        assertTrue(body.contains("\"stage\":\"EXPANDING\""));
        assertTrue(body.contains("\"stage\":\"ANSWERING\""));
        assertTrue(body.contains("\"url\":\"/projects/a-project\""));
        assertTrue(body.contains("\"url\":\"/blog/b-post\""), "related public document is added");
        assertTrue(body.contains("\"text\":\" [1].\""));
        // only [1] (document A) was cited; B was looked at but not cited
        String done = body.substring(body.indexOf("event:done"));
        assertTrue(done.contains("a-project"));
        assertFalse(done.contains("b-post"));

        String prompt = generator.userPrompts.get(0);
        assertTrue(prompt.startsWith("<근거>\n[1] 프로젝트 A — 개요\nA 내용\n\n[2] 보조 "), prompt);
        assertTrue(prompt.contains("\n\n[6] 블로그 B — 개요\nB 내용\n</근거>"), prompt);
        assertTrue(prompt.endsWith("질문: A 경험이 있나요?"));
        // no history: the PoC prompt unchanged (ADR-0007)
        assertEquals(AnswerPrompt.SYSTEM, generator.systemPrompts.get(0));
        assertEquals(List.of("A 경험이 있나요?"), embeddings.texts);
    }

    @Test
    void privateDocumentsNeverAppearInSearchExpansionOrPrompt() throws Exception {
        String body = chat("비밀");
        assertFalse(body.contains("c-draft"));
        assertFalse(body.contains("비공개 C"));
        assertFalse(generator.userPrompts.get(0).contains("C 비밀 내용"));
        assertFalse(body.contains("\"id\""), "internal ids are not sent");
    }

    @Test
    void answersEvenWithoutEvidence() throws Exception {
        jdbc.update("update document set visible = false");
        generator.deltas = List.of("등록되어 있지 않습니다.");
        String body = chat("OAuth 경험?");
        assertEquals(List.of("status", "status", "answer_delta", "done"), events(body));
        assertTrue(generator.userPrompts.get(0).startsWith("<근거>\n\n</근거>"));
        assertTrue(body.contains("\"sources\":[]"));
    }

    @Test
    void generationFailureEndsWithErrorEvent() throws Exception {
        generator.failure = new IllegalStateException("upstream 500");
        String body = chat("A?");
        List<String> events = events(body);
        assertEquals("error", events.get(events.size() - 1));
        assertFalse(body.contains("upstream 500"), "internal error details are not exposed");
    }

    @Test
    void rejectsInvalidUnavailableAndOverLimitRequests() throws Exception {
        send("{\"question\":\"  \"}").andExpect(status().isBadRequest());
        send("{\"question\":\"" + "가".repeat(501) + "\"}").andExpect(status().isBadRequest());

        generator.enabled = false;
        send("{\"question\":\"A?\"}").andExpect(status().isServiceUnavailable());
        generator.enabled = true;
        embeddings.enabled = false;
        send("{\"question\":\"A?\"}").andExpect(status().isServiceUnavailable());
        embeddings.enabled = true;

        // test profile: 3 per IP per day
        for (int i = 0; i < 3; i++) {
            chat("A?");
        }
        send("{\"question\":\"A?\"}").andExpect(status().isTooManyRequests());
    }

    @Test
    void chatNeedsNoLoginOrCsrf() throws Exception {
        send("{\"question\":\"A?\"}")
                .andExpect(request().asyncStarted())
                .andExpect(status().isOk());
    }

    @Test
    void citationParsingIgnoresOutOfRangeNumbers() {
        Retriever.DocumentRef ref = new Retriever.DocumentRef(9, "PROJECT", "x", "X");
        var hits = List.of(new Retriever.Hit(ref, List.of("t"), "x", 0.1));
        assertEquals(1, ChatService.citedDocuments("[1] [1] [2] [0] [99999999999]", hits).size());
        assertEquals(0, ChatService.citedDocuments("근거 없음", hits).size());
    }

    private String chat(String question) throws Exception {
        MvcResult result = send("{\"question\":\"" + question + "\"}")
                .andExpect(request().asyncStarted())
                .andReturn();
        result.getAsyncResult(5_000);
        String body = result.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        assertTrue(result.getResponse().getContentType().startsWith(MediaType.TEXT_EVENT_STREAM_VALUE));
        return body;
    }

    private org.springframework.test.web.servlet.ResultActions send(String json) throws Exception {
        return mockMvc.perform(post("/api/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.TEXT_EVENT_STREAM)
                .content(json));
    }

    private static List<String> events(String body) {
        List<String> names = new ArrayList<>();
        for (String line : body.split("\n")) {
            if (line.startsWith("event:")) {
                names.add(line.substring("event:".length()).strip());
            }
        }
        return names;
    }

    private long document(String type, long sourceId, String slug, String title, boolean visible) {
        return insertReturningId("""
                insert into document (document_type, source_id, title, content, metadata, visible, index_status)
                values (?, ?, ?, 'x', jsonb_build_object('slug', cast(? as text)), ?, 'READY')""",
                type, sourceId, title, slug, visible);
    }

    private void chunk(long documentId, int index, String text, float[] vector) {
        StringBuilder literal = new StringBuilder("[");
        for (int i = 0; i < vector.length; i++) {
            literal.append(i == 0 ? "" : ",").append(vector[i]);
        }
        jdbc.update("""
                insert into document_chunk (document_id, chunk_index, content, section_titles, embedding)
                values (?, ?, ?, '{개요}', cast(? as vector))""",
                documentId, index, text, literal.append(']').toString());
    }

    private static float[] oneHot(int dim, float value) {
        float[] v = new float[EmbeddingClient.DIMENSIONS];
        v[dim] = value;
        v[1535] = 0.01f; // keep every vector non-zero in other directions too
        return v;
    }
}
