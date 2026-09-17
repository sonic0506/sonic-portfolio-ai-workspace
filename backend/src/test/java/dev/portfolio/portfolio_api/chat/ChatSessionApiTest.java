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
