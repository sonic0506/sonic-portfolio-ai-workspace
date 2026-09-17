package dev.portfolio.portfolio_api.faq;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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
import dev.portfolio.portfolio_api.chat.ChatRateLimiter;
import dev.portfolio.portfolio_api.chat.ChatService;
import dev.portfolio.portfolio_api.chat.FakeChatGenerator;
import dev.portfolio.portfolio_api.rag.DocumentIndexer;
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
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

@Import({FakeEmbeddingClient.Config.class, FakeChatGenerator.Config.class})
class FaqAdminApiTest extends ApiTestSupport {

    @Autowired FakeEmbeddingClient embeddings;
    @Autowired FakeChatGenerator generator;
    @Autowired ChatRateLimiter limiter;
    @Autowired ChatService chatService;
    @Autowired DocumentIndexer indexer;

    @BeforeEach
    void clear() {
        embeddings.reset();
        generator.reset();
        limiter.reset();
        jdbc.update("delete from chat_unanswered_question");
        jdbc.update("delete from faq");
        jdbc.update("delete from document");
    }

    @Test
    void createProjectsFaqIntoRagDocument() throws Exception {
        long id = create(faq("어디에 사시나요?", "지금은 관악구에 살고 있습니다.", true, null));

        Map<String, Object> doc = jdbc.queryForMap(
                "select title, content, visible, index_status, metadata->>'slug' as slug from document"
                        + " where document_type = 'FAQ' and source_id = ?", id);
        assertEquals("자주 묻는 질문: 어디에 사시나요?", doc.get("title"));
        assertEquals("## 질문\n\n어디에 사시나요?\n\n## 답변\n\n지금은 관악구에 살고 있습니다.", doc.get("content"));
        assertEquals(true, doc.get("visible"));
        assertEquals("PENDING", doc.get("index_status"));
        assertEquals("faq-" + id, doc.get("slug"));

        mockMvc.perform(get("/api/admin/faqs").with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].question").value("어디에 사시나요?"))
                .andExpect(jsonPath("$[0].indexStatus").value("PENDING"));
    }

    @Test
    void aliasesAreIncludedInTheDocument() throws Exception {
        long id = create(faq("어디에 사시나요?", "관악구", true, null));
        jdbc.update("insert into faq_alias (faq_id, question) values (?, '집이 어디세요?')", id);
        send(put("/api/admin/faqs/{id}", id), faq("어디에 사시나요?", "관악구", true, null), 200);
        assertEquals("## 질문\n\n어디에 사시나요?\n집이 어디세요?\n\n## 답변\n\n관악구", jdbc.queryForObject(
                "select content from document where document_type = 'FAQ'", String.class));
    }

    @Test
    void updateUnpublishAndDelete() throws Exception {
        long id = create(faq("연락은?", "메일 주세요", true, null));
        send(put("/api/admin/faqs/{id}", id), faq("연락은 어떻게 하나요?", "메일로 주세요", false, null), 200);
        Map<String, Object> doc = jdbc.queryForMap("select title, visible from document where document_type = 'FAQ'");
        assertEquals("자주 묻는 질문: 연락은 어떻게 하나요?", doc.get("title"));
        assertEquals(false, doc.get("visible"));

        mockMvc.perform(delete("/api/admin/faqs/{id}", id).with(admin()).with(csrf()))
                .andExpect(status().isNoContent());
        assertEquals(0, jdbc.queryForObject("select count(*) from document", Integer.class));
        mockMvc.perform(delete("/api/admin/faqs/{id}", id).with(admin()).with(csrf()))
                .andExpect(status().isNotFound());
        send(put("/api/admin/faqs/{id}", id), faq("x", "y", true, null), 404);
    }

    @Test
    void creatingFromUnansweredResolvesIt() throws Exception {
        long q = insertReturningId("""
                insert into chat_unanswered_question (question, answer, reason)
                values ('어디 거주중이신가요?', '어려워요', 'NO_EVIDENCE')""");
        long id = create(faq("어디에 사시나요?", "관악구", true, q));
        Map<String, Object> row = jdbc.queryForMap(
                "select status, admin_note, handled_at from chat_unanswered_question where id = ?", q);
        assertEquals("RESOLVED", row.get("status"));
        assertEquals("FAQ #" + id + " 등록", row.get("admin_note"));
        assertTrue(row.get("handled_at") != null);

        send(post("/api/admin/faqs"), faq("a", "b", true, 999_999_999L), 400);
    }

    @Test
    void validationAndAuth() throws Exception {
        send(post("/api/admin/faqs"), faq(" ", "b", true, null), 400);
        mockMvc.perform(get("/api/admin/faqs")).andExpect(status().isUnauthorized());
    }

    @Test
    void faqReachesTheAnswerPromptAsMarkedEvidence() throws Exception {
        create(faq("어디에 사시나요?", "지금은 관악구에 살고 있습니다.", true, null));
        indexer.indexPending();
        generator.deltas = List.of("지금은 관악구에 살고 있습니다. [1]");

        MvcResult result = mockMvc.perform(post("/api/chat").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"question\":\"어디 거주중이신가요?\"}"))
                .andExpect(request().asyncStarted()).andReturn();
        result.getAsyncResult(5_000);
        String body = result.getResponse().getContentAsString(StandardCharsets.UTF_8);

        String prompt = generator.userPrompts.get(0);
        assertTrue(prompt.contains("[1] 자주 묻는 질문: 어디에 사시나요? — 질문 + 답변\n"), prompt);
        assertTrue(prompt.contains("지금은 관악구에 살고 있습니다."));
        assertTrue(chatService.systemPrompt(false).contains("\"자주 묻는 질문:\"로 시작하는 근거"));
        assertTrue(body.contains("\"type\":\"FAQ\""), body);
        assertTrue(body.contains("\"url\":null"), body);
        assertTrue(body.contains("\"unanswered\":false"), body);
        assertEquals(0, jdbc.queryForObject("select count(*) from chat_unanswered_question", Integer.class));
        assertFalse(body.contains("NO_ANSWER"));
        assertEquals(1, generator.faqJudgePrompts.size(), "judge asked because a FAQ was retrieved");
        assertTrue(generator.faqJudgePrompts.get(0).contains("1. 어디에 사시나요?"), generator.faqJudgePrompts.get(0));
    }

    @Test
    void sameQuestionGetsTheRegisteredAnswerUnchanged() throws Exception {
        long id = create(faq("고향이 어디세요?", "저의 고향은 안산입니다.", true, null));
        jdbc.update("insert into faq_alias (faq_id, question, display_order) values (?, ?, 0)", id, "출신이 어디예요?");
        indexer.indexPending();
        generator.faqJudgeReply = "1";
        generator.deltas = List.of("생성된 답변이 쓰이면 안 된다");

        MvcResult result = mockMvc.perform(post("/api/chat").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"question\":\"어디서 태어나셨나요?\"}"))
                .andExpect(request().asyncStarted()).andReturn();
        result.getAsyncResult(5_000);
        String body = result.getResponse().getContentAsString(StandardCharsets.UTF_8);

        String judge = generator.faqJudgePrompts.get(0);
        assertTrue(judge.contains("1. 고향이 어디세요? (같은 뜻: 출신이 어디예요?)"), judge);
        assertTrue(judge.endsWith("방문자 질문: 어디서 태어나셨나요?"), judge);
        assertTrue(generator.userPrompts.isEmpty(), "no answer generation on a FAQ match");
        assertTrue(body.contains("{\"text\":\"저의 고향은 안산입니다.\"}"), body);
        assertTrue(body.contains("\"slug\":\"faq-" + id + "\""), body);
        assertTrue(body.contains("\"unanswered\":false"), body);
        assertEquals(0, jdbc.queryForObject("select count(*) from chat_unanswered_question", Integer.class));
    }

    private static String faq(String question, String answer, boolean published, Long fromUnansweredId) {
        return "{\"question\":\"%s\",\"answer\":\"%s\",\"published\":%s,\"displayOrder\":0,\"fromUnansweredId\":%s}"
                .formatted(question, answer, published, fromUnansweredId);
    }

    private long create(String json) throws Exception {
        return send(post("/api/admin/faqs"), json, 201);
    }

    private long send(MockHttpServletRequestBuilder request, String json, int expected) throws Exception {
        String body = mockMvc.perform(request.with(admin()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().is(expected))
                .andReturn().getResponse().getContentAsString();
        return expected < 300 ? ((Number) JsonPath.read(body, "$.id")).longValue() : -1;
    }
}
