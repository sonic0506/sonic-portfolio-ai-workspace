package dev.portfolio.portfolio_api.chat;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import dev.portfolio.portfolio_api.rag.EmbeddingClient;
import dev.portfolio.portfolio_api.rag.FakeEmbeddingClient;
import dev.portfolio.portfolio_api.support.ApiTestSupport;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

@Import({FakeEmbeddingClient.Config.class, FakeChatGenerator.Config.class})
class UnansweredQuestionTest extends ApiTestSupport {

    @Autowired FakeEmbeddingClient embeddings;
    @Autowired FakeChatGenerator generator;
    @Autowired ChatRateLimiter limiter;
    @Autowired ChatService chatService;
    @Autowired UnansweredQuestionService unanswered;

    @BeforeEach
    void seed() {
        embeddings.reset();
        generator.reset();
        limiter.reset();
        jdbc.update("delete from chat_unanswered_question");
        jdbc.update("delete from chat_session");
        jdbc.update("delete from document");
        long doc = insertReturningId("""
                insert into document (document_type, source_id, title, content, metadata, visible, index_status)
                values ('PROJECT', 777, '프로젝트 "A"', 'x', '{"slug":"a-project"}', true, 'READY')""");
        float[] v = new float[EmbeddingClient.DIMENSIONS];
        v[0] = 1f;
        StringBuilder literal = new StringBuilder("[");
        for (int i = 0; i < v.length; i++) {
            literal.append(i == 0 ? "" : ",").append(v[i]);
        }
        jdbc.update("""
                insert into document_chunk (document_id, chunk_index, content, section_titles, embedding)
                values (?, 0, 'A 내용', '{개요}', cast(? as vector))""", doc, literal.append(']').toString());
        embeddings.vectors = text -> v;
    }

    @Test
    void systemPromptCarriesMarkerRuleAndDefaultGuide() {
        String prompt = chatService.systemPrompt(false);
        assertTrue(prompt.contains("[[NO_ANSWER]]"));
        assertTrue(prompt.contains(ChatService.DEFAULT_GUIDE));
        assertTrue(prompt.contains("짧은 명사구로 쓴다"));
        assertTrue(ChatService.DEFAULT_GUIDE.startsWith("{주제}에 대해서는 지금 정보로는 답변드리기 어려워요."));
    }

    @Test
    void markedAnswerIsCleanedAndRecordedWithRetrievedDocuments() throws Exception {
        generator.deltas = List.of("[[NO_", "ANSWER]] OAuth 인증 관련 트러블슈팅 경험에 대해서는 지금 정보로는 답변드리기 어려워요.");
        String body = chat("OAuth 트러블슈팅 경험은?");

        assertFalse(body.contains("NO_ANSWER"), body);
        assertTrue(body.contains("\"text\":\"OAuth 인증 관련"), body);
        assertTrue(body.contains("\"unanswered\":true"), body);

        Map<String, Object> row = jdbc.queryForMap("select * from chat_unanswered_question");
        assertEquals("OAuth 트러블슈팅 경험은?", row.get("question"));
        assertEquals("NO_EVIDENCE", row.get("reason"));
        assertEquals("OPEN", row.get("status"));
        assertTrue(((String) row.get("answer")).startsWith("OAuth 인증 관련"));
        assertNull(row.get("session_id"));

        mockMvc.perform(get("/api/admin/chat/unanswered").with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].reason").value("NO_EVIDENCE"))
                .andExpect(jsonPath("$.items[0].retrieved[0].slug").value("a-project"))
                .andExpect(jsonPath("$.items[0].retrieved[0].title").value("프로젝트 \"A\""))
                .andExpect(jsonPath("$.items[0].retrieved[0].distance").isNumber())
                .andExpect(jsonPath("$.items[0].inActiveSession").value(false));
    }

    @Test
    void answerWithoutCitationIsRecordedEvenWithoutMarker() throws Exception {
        generator.deltas = List.of("잘 모르겠어요.");
        chat("아무 질문");
        assertEquals("NO_CITATION", jdbc.queryForObject("select reason from chat_unanswered_question", String.class));
    }

    @Test
    void citedAnswerIsNotRecorded() throws Exception {
        generator.deltas = List.of("A입니다 [1].");
        String body = chat("A?");
        assertTrue(body.contains("\"unanswered\":false"));
        assertEquals(0, count());
    }

    @Test
    void partialAnswerWithMarkerIsRecorded() throws Exception {
        generator.deltas = List.of("[[NO_ANSWER]]A는 이렇습니다 [1]. B에 대해서는 어려워요.");
        String body = chat("A와 B는?");
        assertTrue(body.contains("a-project"), "cited source still shown");
        assertEquals("NO_EVIDENCE", jdbc.queryForObject("select reason from chat_unanswered_question", String.class));
    }

    @Test
    void sessionQuestionKeepsRecordAfterSessionIsDeleted() throws Exception {
        String created = mockMvc.perform(post("/api/chat/sessions")).andReturn().getResponse().getContentAsString();
        String id = JsonPath.read(created, "$.sessionId");
        String key = JsonPath.read(created, "$.sessionKey");
        generator.deltas = List.of("[[NO_ANSWER]]어려워요.");
        MvcResult result = mockMvc.perform(post("/api/chat/sessions/{id}/messages", id)
                        .header(ChatSessionController.KEY_HEADER, key)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"question\":\"모르는 것\"}"))
                .andExpect(request().asyncStarted()).andReturn();
        result.getAsyncResult(5_000);
        assertEquals("어려워요.", jdbc.queryForObject(
                "select content from chat_message where role = 'ASSISTANT'", String.class));
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from chat_unanswered_question where session_id is not null", Integer.class));

        mockMvc.perform(delete("/api/chat/sessions/{id}", id).header(ChatSessionController.KEY_HEADER, key))
                .andExpect(status().isNoContent());
        assertEquals(1, jdbc.queryForObject(
                "select count(*) from chat_unanswered_question where session_id is null", Integer.class));
    }

    @Test
    void adminCanFilterHandleAndDelete() throws Exception {
        generator.deltas = List.of("[[NO_ANSWER]]어려워요.");
        chat("질문 1");
        chat("질문 2");
        long first = jdbc.queryForObject(
                "select id from chat_unanswered_question where question = '질문 1'", Long.class);

        mockMvc.perform(put("/api/admin/chat/unanswered/{id}", first).with(admin()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"RESOLVED\",\"adminNote\":\"프로필에 추가함\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"))
                .andExpect(jsonPath("$.adminNote").value("프로필에 추가함"))
                .andExpect(jsonPath("$.handledAt").isNotEmpty());

        mockMvc.perform(get("/api/admin/chat/unanswered").param("status", "OPEN").with(admin()))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].question").value("질문 2"));

        mockMvc.perform(put("/api/admin/chat/unanswered/{id}", first).with(admin()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"OPEN\"}"))
                .andExpect(jsonPath("$.handledAt").value(org.hamcrest.Matchers.nullValue()));

        mockMvc.perform(delete("/api/admin/chat/unanswered/{id}", first).with(admin()).with(csrf()))
                .andExpect(status().isNoContent());
        mockMvc.perform(delete("/api/admin/chat/unanswered/{id}", first).with(admin()).with(csrf()))
                .andExpect(status().isNotFound());
        assertEquals(1, count());

        mockMvc.perform(put("/api/admin/chat/unanswered/{id}", first).with(admin()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"DONE\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/admin/chat/unanswered")).andExpect(status().isUnauthorized());
    }

    @Test
    void recordsOlderThanRetentionAreDeleted() {
        jdbc.update("""
                insert into chat_unanswered_question (question, answer, reason, created_at) values
                ('old', 'a', 'NO_CITATION', now() - interval '91 days'),
                ('recent', 'a', 'NO_CITATION', now() - interval '89 days')""");
        assertEquals(1, unanswered.deleteOlderThanRetention());
        assertEquals("recent", jdbc.queryForObject("select question from chat_unanswered_question", String.class));
    }

    private int count() {
        return jdbc.queryForObject("select count(*) from chat_unanswered_question", Integer.class);
    }

    private String chat(String question) throws Exception {
        limiter.reset();
        MvcResult result = mockMvc.perform(post("/api/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"question\":\"" + question + "\"}"))
                .andExpect(request().asyncStarted()).andReturn();
        result.getAsyncResult(5_000);
        return result.getResponse().getContentAsString(StandardCharsets.UTF_8);
    }
}
