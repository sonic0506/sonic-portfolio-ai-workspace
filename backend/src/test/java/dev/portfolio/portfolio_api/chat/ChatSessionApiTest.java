package dev.portfolio.portfolio_api.chat;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import dev.portfolio.portfolio_api.rag.DocumentProjector;
import dev.portfolio.portfolio_api.rag.EmbeddingClient;
import dev.portfolio.portfolio_api.rag.FakeEmbeddingClient;
import dev.portfolio.portfolio_api.support.ApiTestSupport;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

@Import({FakeEmbeddingClient.Config.class, FakeChatGenerator.Config.class})
class ChatSessionApiTest extends ApiTestSupport {

    static final String KEY = ChatSessionController.KEY_HEADER;

    @Autowired FakeEmbeddingClient embeddings;
    @Autowired FakeChatGenerator generator;
    @Autowired ChatRateLimiter limiter;
    @Autowired ChatSessionService sessions;
    @Autowired DocumentProjector projector;
    @Autowired ChatService chatService;

    long docA;
    String id;
    String key;

    @BeforeEach
    void seed() throws Exception {
        embeddings.reset();
        generator.reset();
        limiter.reset();
        jdbc.update("delete from chat_session");
        jdbc.update("delete from document");
        docA = insertReturningId("""
                insert into document (document_type, source_id, title, content, metadata, visible, index_status)
                values ('PROJECT', 424242, '프로젝트 A', 'x', '{"slug":"a-project"}', true, 'READY')""");
        float[] v = new float[EmbeddingClient.DIMENSIONS];
        v[0] = 1f;
        StringBuilder literal = new StringBuilder("[");
        for (int i = 0; i < v.length; i++) {
            literal.append(i == 0 ? "" : ",").append(v[i]);
        }
        jdbc.update("""
                insert into document_chunk (document_id, chunk_index, content, section_titles, embedding)
                values (?, 0, 'A 내용', '{역할}', cast(? as vector))""", docA, literal.append(']').toString());
        embeddings.vectors = text -> v;
        generator.deltas = List.of("A에서 개발을 맡았습니다 [1].");

        String body = mockMvc.perform(post("/api/chat/sessions"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sessionId").isString())
                .andExpect(jsonPath("$.sessionKey").isString())
                .andReturn().getResponse().getContentAsString();
        id = JsonPath.read(body, "$.sessionId");
        key = JsonPath.read(body, "$.sessionKey");
    }

    @Test
    void createdSessionStoresOnlyAKeyHashAndExpiresInADay() throws Exception {
        String stored = jdbc.queryForObject("select visitor_key from chat_session where public_id = cast(? as uuid)",
                String.class, id);
        assertNotEquals(key, stored);
        assertEquals(ChatSessionService.hash(key), stored);
        Instant expires = jdbc.queryForObject("select expires_at from chat_session where public_id = cast(? as uuid)",
                java.sql.Timestamp.class, id).toInstant();
        assertTrue(Duration.between(Instant.now(), expires).toHours() >= 23);

        mockMvc.perform(get("/api/chat/sessions/{id}", id).header(KEY, key))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").value(id))
                .andExpect(jsonPath("$.messages.length()").value(0));
    }

    @Test
    void wrongMissingOrUnknownKeyLooksLikeNoSession() throws Exception {
        mockMvc.perform(get("/api/chat/sessions/{id}", id).header(KEY, "wrong")).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/chat/sessions/{id}", id)).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/chat/sessions/{id}", java.util.UUID.randomUUID()).header(KEY, key))
                .andExpect(status().isNotFound());
        ask("질문", "wrong").andExpect(status().isNotFound());

        // another visitor's session cannot be read with your own key
        String other = JsonPath.read(mockMvc.perform(post("/api/chat/sessions"))
                .andReturn().getResponse().getContentAsString(), "$.sessionId");
        mockMvc.perform(get("/api/chat/sessions/{id}", other).header(KEY, key)).andExpect(status().isNotFound());
    }

    @Test
    void storesTurnsAndRestoresThemWithSources() throws Exception {
        askOk("A 프로젝트 경험이 있나요?");
        askOk("거기서 맡은 역할은?");

        mockMvc.perform(get("/api/chat/sessions/{id}", id).header(KEY, key))
                .andExpect(jsonPath("$.messages.length()").value(4))
                .andExpect(jsonPath("$.messages[0].role").value("USER"))
                .andExpect(jsonPath("$.messages[0].content").value("A 프로젝트 경험이 있나요?"))
                .andExpect(jsonPath("$.messages[0].sources.length()").value(0))
                .andExpect(jsonPath("$.messages[1].role").value("ASSISTANT"))
                .andExpect(jsonPath("$.messages[1].content").value("A에서 개발을 맡았습니다 [1]."))
                .andExpect(jsonPath("$.messages[1].sources[0].slug").value("a-project"))
                .andExpect(jsonPath("$.messages[1].sources[0].url").value("/projects/a-project"))
                .andExpect(jsonPath("$.messages[3].role").value("ASSISTANT"));

        // becoming private hides the source on restore (view-time filter)
        jdbc.update("update document set visible = false where id = ?", docA);
        mockMvc.perform(get("/api/chat/sessions/{id}", id).header(KEY, key))
                .andExpect(jsonPath("$.messages[1].sources.length()").value(0));
    }

    @Test
    void followUpUsesPreviousQuestionForSearchAndHistoryInPrompt() throws Exception {
        askOk("A 프로젝트 경험이 있나요?");
        askOk("거기서 맡은 역할은?");

        assertEquals("A 프로젝트 경험이 있나요?\n거기서 맡은 역할은?", embeddings.texts.get(1));
        assertEquals(chatService.systemPrompt(false), generator.systemPrompts.get(0));
        assertEquals(chatService.systemPrompt(true), generator.systemPrompts.get(1));
        assertTrue(generator.systemPrompts.get(1).endsWith(AnswerPrompt.HISTORY_RULE));
        String prompt = generator.userPrompts.get(1);
        assertTrue(prompt.startsWith("<이전 대화>\n사용자: A 프로젝트 경험이 있나요?\n"
                + "답변: A에서 개발을 맡았습니다 [1].\n</이전 대화>\n\n<근거>\n"), prompt);
        assertTrue(prompt.endsWith("질문: 거기서 맡은 역할은?"));
    }

    @Test
    void onlyTheLastThreeTurnsAreSent() throws Exception {
        for (int i = 1; i <= 4; i++) {
            askOk("질문 " + i);
        }
        askOk("질문 5");
        String prompt = generator.userPrompts.get(4);
        assertFalse(prompt.contains("사용자: 질문 1\n"));
        assertTrue(prompt.contains("사용자: 질문 2\n"));
        assertTrue(prompt.contains("사용자: 질문 4\n"));
    }

    @Test
    void sessionsAreIsolated() throws Exception {
        askOk("A 프로젝트 경험이 있나요?");
        String body = mockMvc.perform(post("/api/chat/sessions")).andReturn().getResponse().getContentAsString();
        id = JsonPath.read(body, "$.sessionId");
        key = JsonPath.read(body, "$.sessionKey");
        askOk("그 프로젝트는?");
        assertFalse(generator.userPrompts.get(1).contains("<이전 대화>"));
        assertEquals("그 프로젝트는?", embeddings.texts.get(1));
    }

    @Test
    void thirtyQuestionsFillTheSession() throws Exception {
        long sessionId = internalId();
        for (int i = 0; i < ChatSessionService.MAX_QUESTIONS; i++) {
            jdbc.update("insert into chat_message (session_id, role, content) values (?, 'USER', 'q')", sessionId);
        }
        ask("하나 더", key).andExpect(status().isConflict());
        assertEquals(0, generator.userPrompts.size());
    }

    @Test
    void expiredSessionsAreGoneAndActivityExtendsExpiry() throws Exception {
        jdbc.update("update chat_session set expires_at = now() + interval '1 hour' where public_id = cast(? as uuid)", id);
        askOk("A?");
        Instant extended = jdbc.queryForObject(
                "select expires_at from chat_session where public_id = cast(? as uuid)",
                java.sql.Timestamp.class, id).toInstant();
        assertTrue(Duration.between(Instant.now(), extended).toHours() >= 23);

        jdbc.update("update chat_session set expires_at = now() - interval '1 second' where public_id = cast(? as uuid)", id);
        mockMvc.perform(get("/api/chat/sessions/{id}", id).header(KEY, key)).andExpect(status().isNotFound());
        assertEquals(1, sessions.deleteExpired());
        assertEquals(0, jdbc.queryForObject("select count(*) from chat_message", Integer.class));
    }

    @Test
    void failedAnswerStoresNothing() throws Exception {
        generator.failure = new IllegalStateException("boom");
        String body = askBody("A?");
        assertTrue(body.contains("event:error"));
        assertEquals(0, jdbc.queryForObject("select count(*) from chat_message", Integer.class));
    }

    @Test
    void visitorCanDeleteTheSession() throws Exception {
        askOk("A?");
        mockMvc.perform(delete("/api/chat/sessions/{id}", id).header(KEY, "wrong")).andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/chat/sessions/{id}", id).header(KEY, key)).andExpect(status().isNoContent());
        mockMvc.perform(get("/api/chat/sessions/{id}", id).header(KEY, key)).andExpect(status().isNotFound());
        assertEquals(0, jdbc.queryForObject("select count(*) from chat_message", Integer.class));
    }

    @Test
    void citedDocumentCanStillBeDeleted() throws Exception {
        askOk("A?");
        assertEquals(1, jdbc.queryForObject("select count(*) from chat_message_source", Integer.class));
        projector.remove(DocumentProjector.Type.PROJECT, 424242);
        assertEquals(0, jdbc.queryForObject("select count(*) from document", Integer.class));
        mockMvc.perform(get("/api/chat/sessions/{id}", id).header(KEY, key))
                .andExpect(jsonPath("$.messages.length()").value(2))
                .andExpect(jsonPath("$.messages[1].sources.length()").value(0));
    }

    @Test
    void validationAndAvailabilityComeFirst() throws Exception {
        ask("  ", key).andExpect(status().isBadRequest());
        generator.enabled = false;
        ask("A?", key).andExpect(status().isServiceUnavailable());
    }

    @Test
    void firstQuestionStoredAtCreationRunsOnceFromPending() throws Exception {
        // ADR-0024: survives a full-page navigation because the server keeps it, not the page.
        String created = mockMvc.perform(post("/api/chat/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"question\":\" A 요약 \",\"focus\":{\"type\":\"PROJECT\",\"slug\":\"a-project\"}}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        id = JsonPath.read(created, "$.sessionId");
        key = JsonPath.read(created, "$.sessionKey");

        mockMvc.perform(get("/api/chat/sessions/{id}", id).header(KEY, key))
                .andExpect(jsonPath("$.messages.length()").value(0))
                .andExpect(jsonPath("$.pending.question").value("A 요약"))
                .andExpect(jsonPath("$.pending.focus.slug").value("a-project"));
        mockMvc.perform(post("/api/chat/sessions/{id}/pending", id)).andExpect(status().isNotFound());

        MvcResult result = mockMvc.perform(post("/api/chat/sessions/{id}/pending", id).header(KEY, key)
                        .accept(MediaType.TEXT_EVENT_STREAM))
                .andExpect(request().asyncStarted()).andReturn();
        result.getAsyncResult(5_000);
        assertTrue(result.getResponse().getContentAsString(StandardCharsets.UTF_8).contains("event:done"));
        assertTrue(embeddings.texts.isEmpty(), "focus: the document's own chunks, no search");
        assertTrue(generator.userPrompts.get(0).endsWith("질문: A 요약"));

        mockMvc.perform(get("/api/chat/sessions/{id}", id).header(KEY, key))
                .andExpect(jsonPath("$.messages.length()").value(2))
                .andExpect(jsonPath("$.messages[0].content").value("A 요약"))
                .andExpect(jsonPath("$.pending").isEmpty());
        limiter.reset();
        mockMvc.perform(post("/api/chat/sessions/{id}/pending", id).header(KEY, key))
                .andExpect(status().isGone());
    }

    @Test
    void followUpsInAFocusedSessionKeepTheDocumentAndStillSearch() throws Exception {
        // 2026-10-13: "해당 글을 3줄 요약" after the summary button answered from another document, because
        // the post's category is kept out of chat search (ADR-0018) and only the first question had focus.
        long study = insertReturningId("insert into category (code, name, rag_enabled) values ('study', '학습', false)");
        long post = insertReturningId("insert into blog_post (slug, title, published, category_id) values ('s-note', '학습 S', true, ?)", study);
        long s = insertReturningId("""
                insert into document (document_type, source_id, title, content, metadata, visible, index_status)
                values ('BLOG', ?, '학습 S', 'x', '{"slug":"s-note"}', true, 'READY')""", post);
        jdbc.update("""
                insert into document_chunk (document_id, chunk_index, content, section_titles)
                values (?, 0, 'S 내용', '{개요}')""", s);
        String created = mockMvc.perform(post("/api/chat/sessions").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"question\":\"S 요약\",\"focus\":{\"type\":\"BLOG\",\"slug\":\"s-note\"}}"))
                .andReturn().getResponse().getContentAsString();
        id = JsonPath.read(created, "$.sessionId");
        key = JsonPath.read(created, "$.sessionKey");
        MvcResult first = mockMvc.perform(post("/api/chat/sessions/{id}/pending", id).header(KEY, key))
                .andExpect(request().asyncStarted()).andReturn();
        first.getAsyncResult(5_000);

        askOk("해당 글을 3줄 요약");
        String prompt = generator.userPrompts.get(1);
        assertTrue(prompt.contains("<근거>\n[2] 프로젝트 A"), prompt);
        assertTrue(prompt.contains(AnswerPrompt.STUDY_OPEN + "[1] 학습 S — 개요\nS 내용\n</학습 노트>"), prompt);
        assertEquals(1, embeddings.texts.size(), "the follow-up still searches");
    }

    @Test
    void sessionWithoutFirstQuestionHasNothingPending() throws Exception {
        mockMvc.perform(get("/api/chat/sessions/{id}", id).header(KEY, key))
                .andExpect(jsonPath("$.pending").isEmpty());
        mockMvc.perform(post("/api/chat/sessions/{id}/pending", id).header(KEY, key))
                .andExpect(status().isGone());
        mockMvc.perform(post("/api/chat/sessions").contentType(MediaType.APPLICATION_JSON).content("{\"question\":\" \"}"))
                .andExpect(status().isBadRequest());
    }

    private long internalId() {
        return jdbc.queryForObject("select id from chat_session where public_id = cast(? as uuid)", Long.class, id);
    }

    private ResultActions ask(String question, String sessionKey) throws Exception {
        return mockMvc.perform(post("/api/chat/sessions/{id}/messages", id)
                .header(KEY, sessionKey)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.TEXT_EVENT_STREAM)
                .content("{\"question\":\"" + question + "\"}"));
    }

    private String askBody(String question) throws Exception {
        MvcResult result = ask(question, key).andExpect(request().asyncStarted()).andReturn();
        result.getAsyncResult(5_000);
        return result.getResponse().getContentAsString(StandardCharsets.UTF_8);
    }

    /** The test profile allows 3 questions per IP per day; reset so multi-turn tests are not limited. */
    private void askOk(String question) throws Exception {
        limiter.reset();
        String body = askBody(question);
        assertTrue(body.contains("event:done"), body);
    }
}
