package dev.portfolio.portfolio_api.graph;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.empty;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import dev.portfolio.portfolio_api.support.ApiTestSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

/** Public graph (ADR-0015): only published documents, and only categories/skills they use. */
class GraphApiTest extends ApiTestSupport {

    long usedCategory;
    long privateOnlyCategory;
    long react;
    long privateOnlySkill;
    long tag;

    @BeforeEach
    void seed() {
        jdbc.update("delete from document_relation");
        jdbc.update("delete from project");
        jdbc.update("delete from blog_post");
        usedCategory = insertReturningId("insert into category (code, name, color) values ('gr-ux', 'UX', '#2E93A8')");
        privateOnlyCategory = insertReturningId("insert into category (code, name) values ('gr-hidden', '숨김')");
        react = skill("gr-react", "React");
        privateOnlySkill = skill("gr-secret", "Secret");
        tag = insertReturningId("insert into tag (code, name) values ('gr-admin', '관리자')");
    }

    @Test
    void containsOnlyPublishedDocumentsAndWhatTheyUse() throws Exception {
        long publicPost = blogPost("gr-public", true, usedCategory, "[" + tag + "]", "[" + react + "]", "[]");
        long privatePost = blogPost("gr-private", false, privateOnlyCategory, "[]", "[" + privateOnlySkill + "]", "[]");
        // the project references both posts; the edge to the private one must not appear
        project("gr-project", "[" + react + "]",
                "[{\"type\":\"BLOG\",\"id\":" + publicPost + "},{\"type\":\"BLOG\",\"id\":" + privatePost + "}]");

        mockMvc.perform(get("/api/graph"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nodes[*].id").value(contains(
                        "project:gr-project", "blog:gr-public", "category:gr-ux", "skill:gr-react")))
                .andExpect(jsonPath("$.nodes[0].url").value("/projects/gr-project"))
                .andExpect(jsonPath("$.nodes[0].periodStart").value("2024-01-01"))
                .andExpect(jsonPath("$.nodes[1].color").value("#2E93A8"))
                .andExpect(jsonPath("$.nodes[1].tags[0]").value("관리자"))
                .andExpect(jsonPath("$.nodes[2].url").value("/blog?category=gr-ux"))
                .andExpect(jsonPath("$.nodes[3].url").doesNotExist())
                .andExpect(jsonPath("$.edges[?(@.kind == 'REFERENCE')].target").value(contains("blog:gr-public")))
                .andExpect(jsonPath("$.edges[?(@.kind == 'REFERENCE')].source").value(contains("project:gr-project")))
                .andExpect(jsonPath("$.edges[?(@.kind == 'SKILL')].source").value(contains("project:gr-project", "blog:gr-public")))
                .andExpect(jsonPath("$.edges[?(@.kind == 'CATEGORY')].target").value(contains("category:gr-ux")))
                .andExpect(jsonPath("$.edges[?(@.target == 'skill:gr-secret')]").value(empty()));
    }

    @Test
    void isAnonymous() throws Exception {
        mockMvc.perform(get("/api/graph")).andExpect(status().isOk())
                .andExpect(jsonPath("$.nodes").isArray())
                .andExpect(jsonPath("$.edges").isArray());
    }

    private long blogPost(String slug, boolean published, long categoryId, String tagIds, String skillIds, String refs)
            throws Exception {
        return create("/api/admin/blog/posts", """
                {"slug":"%s","title":"%s title","summary":"s","thumbnailUrl":null,"published":%s,"adminNote":null,
                 "categoryId":%d,"tagIds":%s,"skillIds":%s,"sections":[],"references":%s}"""
                .formatted(slug, slug, published, categoryId, tagIds, skillIds, refs));
    }

    private long project(String slug, String skillIds, String refs) throws Exception {
        return create("/api/admin/projects", """
                {"slug":"%s","title":"%s title","summary":"summary","organization":null,"position":null,
                 "contribution":null,"contributionNote":null,"periodStart":"2024-01-01","periodEnd":null,
                 "thumbnailUrl":null,"githubUrl":null,"serviceUrl":null,"featured":false,"published":true,
                 "displayOrder":0,"adminNote":null,"highlights":[],"skillIds":%s,"sections":[],
                 "references":%s}""".formatted(slug, slug, skillIds, refs));
    }

    private long create(String path, String json) throws Exception {
        String body = mockMvc.perform(post(path).with(admin()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }
}
