package dev.portfolio.portfolio_api.blog;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.portfolio.portfolio_api.support.ApiTestSupport;
import java.sql.Timestamp;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class BlogApiTest extends ApiTestSupport {

    @BeforeEach
    void seed() {
        jdbc.update("delete from blog_post");
        long arch = insertReturningId("insert into category (code, name, display_order) values ('test-arch', '아키텍처', 1)");
        long fe = insertReturningId("insert into category (code, name, display_order) values ('test-fe', '프론트엔드', 0)");
        long ws = insertReturningId("insert into tag (code, name) values ('test-websocket', 'websocket')");
        long react = skill("test-react", "React");

        long older = post("web-serial-usb", true, "2025-03-01T00:00:00Z");
        setCategory(older, arch);
        long newer = post("websocket-binary-video", true, "2025-05-01T00:00:00Z");
        setCategory(newer, fe);
        link("blog_tag", "tag_id", newer, ws);
        link("blog_skill", "skill_id", newer, react);
        jdbc.update("insert into content_section (blog_post_id, title, body_markdown, display_order) values (?, '본문', 'text', 0)", newer);

        // Draft sample: must never appear (samples/blog/offline-first-boundary.md)
        long draft = post("offline-first-boundary", false, null);
        setCategory(draft, arch);
        link("blog_tag", "tag_id", draft, ws);
    }

    @Test
    void listsPublishedPostsNewestFirst() throws Exception {
        mockMvc.perform(get("/api/blog/posts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(20))
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.items[0].slug").value("websocket-binary-video"))
                .andExpect(jsonPath("$.items[0].category.code").value("test-fe"))
                .andExpect(jsonPath("$.items[0].category.name").value("프론트엔드"))
                .andExpect(jsonPath("$.items[0].category.color").value("#8B8B94"))
                .andExpect(jsonPath("$.items[1].category.code").value("test-arch"))
                .andExpect(jsonPath("$.items[0].tags[0].name").value("websocket"))
                .andExpect(jsonPath("$.items[0].skills[0].code").value("test-react"))
                .andExpect(jsonPath("$.items[0].publishedAt").exists())
                .andExpect(jsonPath("$.items[0].sections").doesNotExist())
                .andExpect(jsonPath("$.items[0].adminNote").doesNotExist())
                .andExpect(jsonPath("$.items[0].createdAt").doesNotExist())
                .andExpect(jsonPath("$.items[1].slug").value("web-serial-usb"));
    }

    @Test
    void pagesAndClampsSize() throws Exception {
        mockMvc.perform(get("/api/blog/posts").param("page", "1").param("size", "1"))
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].slug").value("web-serial-usb"))
                .andExpect(jsonPath("$.totalElements").value(2));
        mockMvc.perform(get("/api/blog/posts").param("size", "500"))
                .andExpect(jsonPath("$.size").value(50));
    }

    @Test
    void filtersByCategoryAndTagWithoutLeakingDrafts() throws Exception {
        mockMvc.perform(get("/api/blog/posts").param("category", "test-arch"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].slug").value("web-serial-usb"));
        mockMvc.perform(get("/api/blog/posts").param("tag", "test-websocket"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].slug").value("websocket-binary-video"));
        mockMvc.perform(get("/api/blog/posts").param("category", "test-arch").param("tag", "none"))
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.items.length()").value(0));
    }

    @Test
    void detailReturnsSectionsAndHidesDrafts() throws Exception {
        mockMvc.perform(get("/api/blog/posts/websocket-binary-video"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sections[0].title").value("본문"))
                .andExpect(jsonPath("$.tags.length()").value(1));
        mockMvc.perform(get("/api/blog/posts/offline-first-boundary")).andExpect(status().isNotFound());
    }

    @Test
    void listsCategoriesWithPublishedPostCounts() throws Exception {
        insertReturningId("insert into category (code, name, display_order) values ('test-empty', '빈 분류', 2)");
        // test-arch: one published post + one draft; the draft is not counted
        mockMvc.perform(get("/api/blog/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.code == 'test-arch')].postCount").value(org.hamcrest.Matchers.contains(1)))
                .andExpect(jsonPath("$[?(@.code == 'test-fe')].name").value(org.hamcrest.Matchers.contains("프론트엔드")))
                .andExpect(jsonPath("$[?(@.code == 'test-fe')].color").value(org.hamcrest.Matchers.contains("#8B8B94")))
                .andExpect(jsonPath("$[?(@.code == 'test-empty')].postCount").value(org.hamcrest.Matchers.contains(0)));
    }

    private long post(String slug, boolean published, String publishedAt) {
        Timestamp at = publishedAt == null ? null : Timestamp.from(Instant.parse(publishedAt));
        return insertReturningId(
                "insert into blog_post (slug, title, summary, published, published_at, admin_note) values (?, ?, ?, ?, ?, 'secret')",
                slug, slug + " title", slug + " summary", published, at);
    }

    private void setCategory(long postId, long categoryId) {
        jdbc.update("update blog_post set category_id = ? where id = ?", categoryId, postId);
    }

    private void link(String table, String column, long postId, long otherId) {
        jdbc.update("insert into " + table + " (blog_post_id, " + column + ") values (?, ?)", postId, otherId);
    }
}
