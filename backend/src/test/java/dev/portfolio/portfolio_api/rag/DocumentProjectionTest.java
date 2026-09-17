package dev.portfolio.portfolio_api.rag;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import dev.portfolio.portfolio_api.support.ApiTestSupport;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/** Admin writes keep the document layer in step, in the same transaction (ADR-0005). */
class DocumentProjectionTest extends ApiTestSupport {

    long java;

    @BeforeEach
    void clear() {
        jdbc.update("delete from document");
        jdbc.update("delete from project");
        jdbc.update("delete from blog_post");
        jdbc.update("delete from profile");
        java = skill("dp-java", "Java");
    }

    @Test
    void projectDocumentFollowsContentAndPublishState() throws Exception {
        long id = send(post("/api/admin/projects"), project(false, "본문 A"), 201);
        Map<String, Object> doc = document("PROJECT", id);
        assertEquals(false, doc.get("visible"));
        assertEquals("PENDING", doc.get("index_status"));
        // same result as the PoC regex: the block and its line break go, the blank line before stays
        assertEquals("## 개요\n\n본문 A\n\n## 질문\n\n앞\n\n\n뒤", doc.get("content"));
        assertEquals(0, count("select count(*) from document where content like '%secret-memo%'"));
        assertEquals(1, count("select count(*) from document where metadata->>'slug' = 'dp-project'"
                + " and metadata->'skills' @> '[\"dp-java\"]'"));

        // pretend it was indexed
        long docId = ((Number) doc.get("id")).longValue();
        jdbc.update("update document set index_status = 'READY' where id = ?", docId);
        jdbc.update("insert into document_chunk (document_id, chunk_index, content) values (?, 0, 'x')", docId);

        // publishing only flips visibility: no re-index, chunks kept
        send(put("/api/admin/projects/{id}", id), project(true, "본문 A"), 200);
        doc = document("PROJECT", id);
        assertEquals(true, doc.get("visible"));
        assertEquals("READY", doc.get("index_status"));
        assertEquals(1, count("select count(*) from document_chunk where document_id = " + docId));

        // changing content queues a re-index; old chunks stay until it succeeds
        send(put("/api/admin/projects/{id}", id), project(true, "본문 B"), 200);
        doc = document("PROJECT", id);
        assertEquals("PENDING", doc.get("index_status"));
        assertEquals(docId, ((Number) doc.get("id")).longValue());
        assertEquals(1, count("select count(*) from document_chunk where document_id = " + docId));

        mockMvc.perform(delete("/api/admin/projects/{id}", id).with(admin()).with(csrf()))
                .andExpect(status().isNoContent());
        assertEquals(0, count("select count(*) from document"));
        assertEquals(0, count("select count(*) from document_chunk where document_id = " + docId));
    }

    @Test
    void blogAndProfileAreProjected() throws Exception {
        long post = send(post("/api/admin/blog/posts"), """
                {"slug":"dp-post","title":"글","summary":null,"thumbnailUrl":null,"published":true,
                 "adminNote":"secret-memo","categoryIds":[],"tagIds":[],"skillIds":[],
                 "sections":[{"title":"본문","bodyMarkdown":"내용"}],"references":[]}""", 201);
        assertEquals(true, document("BLOG", post).get("visible"));

        send(put("/api/admin/profile"), """
                {"headline":"h","shortBio":"b","imageUrl":null,"githubUrl":null,"email":null,
                 "careers":[],"skills":[{"skillId":%d,"group":"PRIMARY"}],
                 "sections":[{"title":"소개","bodyMarkdown":"안녕하세요"}]}""".formatted(java), 200);
        long profileId = jdbc.queryForObject("select id from profile", Long.class);
        Map<String, Object> profile = document("PROFILE", profileId);
        assertEquals(true, profile.get("visible"));
        assertEquals("## 소개\n\n안녕하세요", profile.get("content"));
        assertEquals(1, count("select count(*) from document where document_type = 'PROFILE'"
                + " and metadata->>'slug' = 'profile'"));

        mockMvc.perform(delete("/api/admin/blog/posts/{id}", post).with(admin()).with(csrf()))
                .andExpect(status().isNoContent());
        assertEquals(0, count("select count(*) from document where document_type = 'BLOG'"));
    }

    private String project(boolean published, String body) {
        return """
                {"slug":"dp-project","title":"프로젝트","summary":"요약","organization":null,"position":null,
                 "contribution":null,"contributionNote":null,"periodStart":"2024-01-01","periodEnd":null,
                 "thumbnailUrl":null,"githubUrl":null,"serviceUrl":null,"featured":false,"published":%s,
                 "displayOrder":0,"adminNote":"secret-memo","highlights":["h"],"skillIds":[%d],
                 "sections":[{"title":"개요","bodyMarkdown":"%s"},
                             {"title":"질문","bodyMarkdown":"앞\\n\\n:::questions\\n- 물어보기\\n:::\\n\\n뒤"}],
                 "references":[]}"""
                .formatted(published, java, body);
    }

    private long send(MockHttpServletRequestBuilder request, String json, int expectedStatus) throws Exception {
        String response = mockMvc.perform(request.with(admin()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().is(expectedStatus))
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(response, "$.id")).longValue();
    }

    private Map<String, Object> document(String type, long sourceId) {
        return jdbc.queryForMap("select id, visible, index_status, content from document"
                + " where document_type = ? and source_id = ?", type, sourceId);
    }

    private int count(String sql) {
        return jdbc.queryForObject(sql, Integer.class);
    }
}
