package dev.portfolio.portfolio_api.content;

import static org.junit.jupiter.api.Assertions.assertEquals;
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

/** Reference documents between projects and blog posts (ADR-0005 follow-up, 2026-09-17). */
class ReferenceDocumentsApiTest extends ApiTestSupport {

    long publicPost;
    long privatePost;
    long category;

    @BeforeEach
    void seed() throws Exception {
        jdbc.update("delete from document_relation");
        jdbc.update("delete from project");
        jdbc.update("delete from blog_post");
        category = insertReturningId("insert into category (code, name) values ('rd-cat', '분류')");
        publicPost = createPost("rd-public", true, "[]");
        privatePost = createPost("rd-private", false, "[]");
    }

    @Test
    void showsReferencesAndReferencedBySeparatelyAndHidesPrivateDocuments() throws Exception {
        long project = createProject("rd-project", refs("BLOG", publicPost, "BLOG", privatePost));
        // the public post references the project back; the private post references the public one
        updatePost(publicPost, "rd-public", true, refs("PROJECT", project)).andExpect(status().isOk());
        updatePost(privatePost, "rd-private", false, refs("BLOG", publicPost)).andExpect(status().isOk());

        mockMvc.perform(get("/api/projects/rd-project"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.references.length()").value(1))
                .andExpect(jsonPath("$.references[0].type").value("BLOG"))
                .andExpect(jsonPath("$.references[0].slug").value("rd-public"))
                .andExpect(jsonPath("$.references[0].title").value("rd-public title"))
                .andExpect(jsonPath("$.references[0].url").value("/blog/rd-public"))
                .andExpect(jsonPath("$.references[0].category.code").value("rd-cat"))
                .andExpect(jsonPath("$.references[0].category.color").value("#8B8B94"))
                .andExpect(jsonPath("$.references[0].id").doesNotExist())
                .andExpect(jsonPath("$.referencedBy.length()").value(1))
                .andExpect(jsonPath("$.referencedBy[0].url").value("/blog/rd-public"));

        mockMvc.perform(get("/api/blog/posts/rd-public"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.references.length()").value(1))
                .andExpect(jsonPath("$.references[0].type").value("PROJECT"))
                .andExpect(jsonPath("$.references[0].url").value("/projects/rd-project"))
                .andExpect(jsonPath("$.references[0].category").value(org.hamcrest.Matchers.nullValue()))
                // referenced by the project and the private post; only the project is public
                .andExpect(jsonPath("$.referencedBy.length()").value(1))
                .andExpect(jsonPath("$.referencedBy[0].slug").value("rd-project"));

        mockMvc.perform(get("/api/admin/projects/{id}", project).with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.references.length()").value(2))
                .andExpect(jsonPath("$.references[0].id").value(publicPost))
                .andExpect(jsonPath("$.references[0].published").value(true))
                .andExpect(jsonPath("$.references[1].id").value(privatePost))
                .andExpect(jsonPath("$.references[1].published").value(false))
                .andExpect(jsonPath("$.referencedBy.length()").value(1))
                .andExpect(jsonPath("$.referencedBy[0].type").value("BLOG"));

        mockMvc.perform(get("/api/admin/blog/posts/{id}", publicPost).with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.referencedBy.length()").value(2));
    }

    @Test
    void updateReplacesOutgoingReferencesOnly() throws Exception {
        long project = createProject("rd-project", refs("BLOG", publicPost));
        updatePost(publicPost, "rd-public", true, refs("PROJECT", project)).andExpect(status().isOk());

        updateProject(project, "rd-project", "[]").andExpect(status().isOk())
                .andExpect(jsonPath("$.references.length()").value(0))
                .andExpect(jsonPath("$.referencedBy.length()").value(1));
        mockMvc.perform(get("/api/blog/posts/rd-public"))
                .andExpect(jsonPath("$.referencedBy.length()").value(0))
                .andExpect(jsonPath("$.references.length()").value(1));
        assertEquals(1, count());
    }

    @Test
    void projectsCanReferenceProjects() throws Exception {
        long first = createProject("rd-first", "[]");
        createProject("rd-second", refs("PROJECT", first));
        mockMvc.perform(get("/api/projects/rd-first"))
                .andExpect(jsonPath("$.referencedBy[0].url").value("/projects/rd-second"));
    }

    @Test
    void rejectsInvalidReferences() throws Exception {
        long project = createProject("rd-project", "[]");
        sendProject(post("/api/admin/projects"), "rd-dup", refs("BLOG", publicPost, "BLOG", publicPost))
                .andExpect(status().isBadRequest());
        sendProject(post("/api/admin/projects"), "rd-unknown", refs("BLOG", 999_999_999L))
                .andExpect(status().isBadRequest());
        sendProject(post("/api/admin/projects"), "rd-bad-type", "[{\"type\":\"PROFILE\",\"id\":1}]")
                .andExpect(status().isBadRequest());
        sendProject(post("/api/admin/projects"), "rd-null", "null").andExpect(status().isBadRequest());
        updateProject(project, "rd-project", refs("PROJECT", project)).andExpect(status().isBadRequest());
        updatePost(publicPost, "rd-public", true, refs("BLOG", publicPost)).andExpect(status().isBadRequest());
        assertEquals(0, count());
    }

    @Test
    void deletingADocumentRemovesItsReferencesBothWays() throws Exception {
        long project = createProject("rd-project", refs("BLOG", publicPost));
        updatePost(publicPost, "rd-public", true, refs("PROJECT", project)).andExpect(status().isOk());
        assertEquals(2, count());

        mockMvc.perform(delete("/api/admin/blog/posts/{id}", publicPost).with(admin()).with(csrf()))
                .andExpect(status().isNoContent());
        assertEquals(0, count());
        mockMvc.perform(get("/api/admin/projects/{id}", project).with(admin()))
                .andExpect(jsonPath("$.references.length()").value(0))
                .andExpect(jsonPath("$.referencedBy.length()").value(0));
    }

    private static String refs(Object... typeAndIds) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < typeAndIds.length; i += 2) {
            if (i > 0) {
                sb.append(',');
            }
            sb.append("{\"type\":\"").append(typeAndIds[i]).append("\",\"id\":").append(typeAndIds[i + 1]).append('}');
        }
        return sb.append(']').toString();
    }

    private long createProject(String slug, String references) throws Exception {
        return id(sendProject(post("/api/admin/projects"), slug, references).andExpect(status().isCreated()));
    }

    private ResultActions updateProject(long id, String slug, String references) throws Exception {
        return sendProject(put("/api/admin/projects/{id}", id), slug, references);
    }

    private ResultActions sendProject(MockHttpServletRequestBuilder request, String slug, String references)
            throws Exception {
        return send(request, """
                {"slug":"%s","title":"%s title","summary":"summary","organization":null,"position":null,
                 "contribution":null,"contributionNote":null,"periodStart":"2024-01-01","periodEnd":null,
                 "thumbnailUrl":null,"githubUrl":null,"serviceUrl":null,"featured":false,"published":true,
                 "displayOrder":0,"adminNote":null,"highlights":[],"skillIds":[],"sections":[],
                 "references":%s}""".formatted(slug, slug, references));
    }

    private long createPost(String slug, boolean published, String references) throws Exception {
        return id(sendPost(post("/api/admin/blog/posts"), slug, published, references)
                .andExpect(status().isCreated()));
    }

    private ResultActions updatePost(long id, String slug, boolean published, String references) throws Exception {
        return sendPost(put("/api/admin/blog/posts/{id}", id), slug, published, references);
    }

    private ResultActions sendPost(MockHttpServletRequestBuilder request, String slug, boolean published,
                                   String references) throws Exception {
        return send(request, """
                {"slug":"%s","title":"%s title","summary":null,"thumbnailUrl":null,"published":%s,
                 "adminNote":null,"categoryId":%d,"tagIds":[],"skillIds":[],"sections":[],
                 "references":%s}""".formatted(slug, slug, published, category, references));
    }

    private ResultActions send(MockHttpServletRequestBuilder request, String json) throws Exception {
        return mockMvc.perform(request.with(admin()).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private static long id(ResultActions result) throws Exception {
        return ((Number) JsonPath.read(result.andReturn().getResponse().getContentAsString(), "$.id")).longValue();
    }

    private int count() {
        return jdbc.queryForObject("select count(*) from document_relation", Integer.class);
    }
}
