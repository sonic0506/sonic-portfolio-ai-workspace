package dev.portfolio.portfolio_api.blog;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import dev.portfolio.portfolio_api.support.ApiTestSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

class BlogPostAdminApiTest extends ApiTestSupport {

    long arch;
    long ws;
    long react;

    @BeforeEach
    void seed() {
        jdbc.update("delete from blog_post");
        jdbc.update("delete from category");
        jdbc.update("delete from tag");
        arch = insertReturningId("insert into category (code, name) values ('ba-arch', '아키텍처')");
        ws = insertReturningId("insert into tag (code, name) values ('ba-ws', 'websocket')");
        react = skill("ba-react", "React");
    }

    @Test
    void createsPostVisibleToAdminAndPublic() throws Exception {
        long id = create(body("ws-video", true, "[" + arch + "]", "[" + ws + "]", "[" + react + "]",
                "[{\"title\":\"본문\",\"bodyMarkdown\":\"text\"}]"));

        mockMvc.perform(get("/api/admin/blog/posts/{id}", id).with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.adminNote").value("memo"))
                .andExpect(jsonPath("$.publishedAt").isNotEmpty())
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.categoryIds[0]").value(arch))
                .andExpect(jsonPath("$.tagIds[0]").value(ws))
                .andExpect(jsonPath("$.skillIds[0]").value(react))
                .andExpect(jsonPath("$.sections[0].title").value("본문"));

        mockMvc.perform(get("/api/blog/posts").param("tag", "ba-ws"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].categories[0].code").value("ba-arch"));
        mockMvc.perform(get("/api/blog/posts/ws-video"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.adminNote").doesNotExist());
    }

    @Test
    void draftStaysHiddenAndPublishDateIsKept() throws Exception {
        long id = create(body("draft", false, "[]", "[]", "[]", "[]"));
        assertNull(publishedAt(id));
        mockMvc.perform(get("/api/blog/posts/draft")).andExpect(status().isNotFound());

        send(put("/api/admin/blog/posts/{id}", id), body("draft", true, "[]", "[]", "[]", "[]"))
                .andExpect(status().isOk());
        String first = publishedAt(id);
        assertNotNull(first);

        send(put("/api/admin/blog/posts/{id}", id), body("draft", false, "[]", "[]", "[]", "[]"))
                .andExpect(status().isOk());
        assertEquals(first, publishedAt(id));
        mockMvc.perform(get("/api/blog/posts/draft")).andExpect(status().isNotFound());

        mockMvc.perform(get("/api/admin/blog/posts").with(admin()))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].published").value(false));
    }

    @Test
    void updateReplacesLinksAndDeleteRemovesThem() throws Exception {
        long id = create(body("post", true, "[" + arch + "]", "[" + ws + "]", "[" + react + "]",
                "[{\"title\":\"t\",\"bodyMarkdown\":\"b\"}]"));
        send(put("/api/admin/blog/posts/{id}", id), body("post", true, "[]", "[]", "[]", "[]"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categoryIds.length()").value(0))
                .andExpect(jsonPath("$.tagIds.length()").value(0))
                .andExpect(jsonPath("$.sections.length()").value(0));

        send(put("/api/admin/blog/posts/{id}", id), body("post", true, "[" + arch + "]", "[" + ws + "]", "[]", "[]"))
                .andExpect(status().isOk());
        mockMvc.perform(delete("/api/admin/blog/posts/{id}", id).with(admin()).with(csrf()))
                .andExpect(status().isNoContent());
        assertEquals(0, jdbc.queryForObject(
                "select (select count(*) from blog_category where blog_post_id = ?)"
                        + " + (select count(*) from blog_tag where blog_post_id = ?)",
                Integer.class, id, id));
        // the category is no longer used, so it can be deleted now
        mockMvc.perform(delete("/api/admin/categories/{id}", arch).with(admin()).with(csrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    void rejectsConflictsAndInvalidReferences() throws Exception {
        create(body("taken", true, "[]", "[]", "[]", "[]"));
        send(post("/api/admin/blog/posts"), body("taken", true, "[]", "[]", "[]", "[]"))
                .andExpect(status().isConflict());
        send(post("/api/admin/blog/posts"), body("bad-cat", true, "[999999999]", "[]", "[]", "[]"))
                .andExpect(status().isBadRequest());
        send(post("/api/admin/blog/posts"), body("bad-tag", true, "[]", "[" + ws + "," + ws + "]", "[]", "[]"))
                .andExpect(status().isBadRequest());
        send(post("/api/admin/blog/posts"), body("bad-skill", true, "[]", "[]", "[999999999]", "[]"))
                .andExpect(status().isBadRequest());
        send(put("/api/admin/blog/posts/{id}", 999_999_999L), body("ghost", true, "[]", "[]", "[]", "[]"))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/admin/blog/posts")).andExpect(status().isUnauthorized());
    }

    private static String body(String slug, boolean published, String categoryIds, String tagIds,
                               String skillIds, String sections) {
        return ("{\"slug\":\"%s\",\"title\":\"%s title\",\"summary\":\"summary\",\"thumbnailUrl\":null,"
                + "\"published\":%s,\"adminNote\":\"memo\",\"categoryIds\":%s,\"tagIds\":%s,"
                + "\"skillIds\":%s,\"sections\":%s}")
                .formatted(slug, slug, published, categoryIds, tagIds, skillIds, sections);
    }

    private long create(String json) throws Exception {
        String response = send(post("/api/admin/blog/posts"), json)
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(response, "$.id")).longValue();
    }

    private ResultActions send(MockHttpServletRequestBuilder request, String json) throws Exception {
        return mockMvc.perform(request.with(admin()).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private String publishedAt(long id) throws Exception {
        String response = mockMvc.perform(get("/api/admin/blog/posts/{id}", id).with(admin()))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(response, "$.publishedAt");
    }
}
