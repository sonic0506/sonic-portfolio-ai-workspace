package dev.portfolio.portfolio_api.project;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
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

class ProjectAdminApiTest extends ApiTestSupport {

    long java;
    long ble;

    @BeforeEach
    void seed() {
        jdbc.update("delete from project");
        java = skill("pa-java", "Java");
        ble = skill("pa-ble", "BLE");
    }

    @Test
    void createsProjectVisibleToAdminAndPublic() throws Exception {
        long id = create(body("viora", true, "[\"first\",\"second\"]", "[" + ble + "," + java + "]",
                "[{\"title\":\"개요\",\"bodyMarkdown\":\"A\"},{\"title\":\"배운 것\",\"bodyMarkdown\":\"B\"}]"));

        mockMvc.perform(get("/api/admin/projects/{id}", id).with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slug").value("viora"))
                .andExpect(jsonPath("$.adminNote").value("memo"))
                .andExpect(jsonPath("$.published").value(true))
                .andExpect(jsonPath("$.publishedAt").isNotEmpty())
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.highlights[1]").value("second"))
                .andExpect(jsonPath("$.skillIds[0]").value(ble))
                .andExpect(jsonPath("$.skillIds[1]").value(java))
                .andExpect(jsonPath("$.sections[1].title").value("배운 것"));

        mockMvc.perform(get("/api/projects/viora"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.skills[0].code").value("pa-ble"))
                .andExpect(jsonPath("$.sections.length()").value(2))
                .andExpect(jsonPath("$.adminNote").doesNotExist());
    }

    @Test
    void publishStampsDateOnceAndUnpublishHidesButKeepsIt() throws Exception {
        long id = create(body("draft", false, "[]", "[]", "[]"));
        assertNull(publishedAt(id));
        mockMvc.perform(get("/api/projects/draft")).andExpect(status().isNotFound());

        update(id, body("draft", true, "[]", "[]", "[]")).andExpect(status().isOk());
        String first = publishedAt(id);
        assertNotNull(first);
        mockMvc.perform(get("/api/projects/draft")).andExpect(status().isOk());

        update(id, body("draft", false, "[]", "[]", "[]")).andExpect(status().isOk());
        assertEquals(first, publishedAt(id));
        mockMvc.perform(get("/api/projects/draft")).andExpect(status().isNotFound());

        update(id, body("draft", true, "[]", "[]", "[]")).andExpect(status().isOk());
        assertEquals(first, publishedAt(id));
    }

    @Test
    void updateReplacesChildListsAndSlug() throws Exception {
        long id = create(body("old-slug", true, "[\"a\",\"b\"]", "[" + java + "," + ble + "]",
                "[{\"title\":\"x\",\"bodyMarkdown\":\"1\"}]"));
        update(id, body("new-slug", true, "[\"c\"]", "[" + ble + "]", "[]"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slug").value("new-slug"))
                .andExpect(jsonPath("$.highlights.length()").value(1))
                .andExpect(jsonPath("$.highlights[0]").value("c"))
                .andExpect(jsonPath("$.skillIds.length()").value(1))
                .andExpect(jsonPath("$.sections.length()").value(0));
        assertEquals(0, jdbc.queryForObject(
                "select count(*) from content_section where project_id = ?", Integer.class, id));
        mockMvc.perform(get("/api/projects/old-slug")).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/projects/new-slug")).andExpect(status().isOk());
    }

    @Test
    void rejectsConflictsAndInvalidInput() throws Exception {
        long first = create(body("taken", true, "[]", "[]", "[]"));
        long second = create(body("other", true, "[]", "[]", "[]"));

        send(post("/api/admin/projects"), body("taken", true, "[]", "[]", "[]")).andExpect(status().isConflict());
        update(second, body("taken", true, "[]", "[]", "[]")).andExpect(status().isConflict());
        update(first, body("taken", true, "[]", "[]", "[]")).andExpect(status().isOk());

        String reversed = body("rev", true, "[]", "[]", "[]").replace("\"periodEnd\":null", "\"periodEnd\":\"2020-01-01\"");
        send(post("/api/admin/projects"), reversed).andExpect(status().isBadRequest());
        send(post("/api/admin/projects"), body("unknown", true, "[]", "[999999999]", "[]"))
                .andExpect(status().isBadRequest());
        send(post("/api/admin/projects"), body("dup", true, "[]", "[" + java + "," + java + "]", "[]"))
                .andExpect(status().isBadRequest());
        send(post("/api/admin/projects"), body("Bad Slug", true, "[]", "[]", "[]"))
                .andExpect(status().isBadRequest());
        send(post("/api/admin/projects"), body("no-lists", true, "[]", "[]", "[]").replace(",\"sections\":[]", ""))
                .andExpect(status().isBadRequest());
        update(999_999_999L, body("ghost", true, "[]", "[]", "[]")).andExpect(status().isNotFound());
    }

    @Test
    void adminListIncludesUnpublishedAndDeleteRemovesChildren() throws Exception {
        long hidden = create(body("hidden", false, "[\"h\"]", "[" + java + "]",
                "[{\"title\":\"t\",\"bodyMarkdown\":\"b\"}]"));
        create(body("shown", true, "[]", "[]", "[]"));

        mockMvc.perform(get("/api/admin/projects").with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[?(@.slug == 'hidden')].published").value(false));

        mockMvc.perform(delete("/api/admin/projects/{id}", hidden).with(admin()).with(csrf()))
                .andExpect(status().isNoContent());
        assertEquals(0, jdbc.queryForObject(
                "select (select count(*) from project_highlight where project_id = ?)"
                        + " + (select count(*) from project_skill where project_id = ?)"
                        + " + (select count(*) from content_section where project_id = ?)",
                Integer.class, hidden, hidden, hidden));
        mockMvc.perform(get("/api/admin/projects/{id}", hidden).with(admin())).andExpect(status().isNotFound());
    }

    @Test
    void requiresAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/projects")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/admin/projects").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(body("x", true, "[]", "[]", "[]")))
                .andExpect(status().isUnauthorized());
    }

    private static String body(String slug, boolean published, String highlights, String skillIds, String sections) {
        return """
                {"slug":"%s","title":"%s title","summary":"summary","organization":"사내","position":"개발",
                 "contribution":30,"contributionNote":null,"periodStart":"2026-07-01","periodEnd":null,
                 "thumbnailUrl":null,"githubUrl":"https://github.com/x","serviceUrl":null,
                 "featured":true,"published":%s,"displayOrder":0,"adminNote":"memo",
                 "highlights":%s,"skillIds":%s,"sections":%s}"""
                .formatted(slug, slug, published, highlights, skillIds, sections)
                .replace("\n", "").replace(",  ", ",").replace(", \"", ",\"");
    }

    private long create(String json) throws Exception {
        String response = send(post("/api/admin/projects"), json)
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(response, "$.id")).longValue();
    }

    private ResultActions update(long id, String json) throws Exception {
        return send(put("/api/admin/projects/{id}", id), json);
    }

    private ResultActions send(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request,
                               String json) throws Exception {
        return mockMvc.perform(request.with(admin()).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private String publishedAt(long id) throws Exception {
        String response = mockMvc.perform(get("/api/admin/projects/{id}", id).with(admin()))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(response, "$.publishedAt");
    }

    private static void assertNull(Object value) {
        org.junit.jupiter.api.Assertions.assertNull(value);
    }
}
