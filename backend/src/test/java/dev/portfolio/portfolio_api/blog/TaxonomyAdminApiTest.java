package dev.portfolio.portfolio_api.blog;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.portfolio.portfolio_api.support.ApiTestSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

class TaxonomyAdminApiTest extends ApiTestSupport {

    long post;

    @BeforeEach
    void seed() {
        jdbc.update("delete from blog_post");
        jdbc.update("delete from category");
        jdbc.update("delete from tag");
        post = insertReturningId("insert into blog_post (slug, title, published) values ('tx-post', 't', true)");
    }

    @Test
    void managesCategories() throws Exception {
        send(post("/api/admin/categories"), "{\"code\":\"tx-fe\",\"name\":\" 프론트엔드 \",\"displayOrder\":1,\"color\":\"#c7772a\"}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("프론트엔드"))
                // stored uppercase so the DB check and clients see one form
                .andExpect(jsonPath("$.color").value("#C7772A"));
        long arch = insertReturningId("insert into category (code, name, display_order) values ('tx-arch', '아키텍처', 0)");

        mockMvc.perform(get("/api/admin/categories").with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").value("tx-arch"))
                .andExpect(jsonPath("$[1].code").value("tx-fe"));

        send(post("/api/admin/categories"), "{\"code\":\"tx-fe\",\"name\":\"dup\",\"displayOrder\":0,\"color\":\"#c7772a\"}")
                .andExpect(status().isConflict());
        send(put("/api/admin/categories/{id}", arch), "{\"code\":\"tx-fe\",\"name\":\"dup\",\"displayOrder\":0,\"color\":\"#c7772a\"}")
                .andExpect(status().isConflict());
        send(put("/api/admin/categories/{id}", arch), "{\"code\":\"tx-architecture\",\"name\":\"설계\",\"displayOrder\":5,\"color\":\"#c7772a\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayOrder").value(5));
        send(post("/api/admin/categories"), "{\"code\":\"Bad Code\",\"name\":\"x\",\"displayOrder\":0,\"color\":\"#c7772a\"}")
                .andExpect(status().isBadRequest());
        // color is required and must be #RRGGBB
        send(post("/api/admin/categories"), "{\"code\":\"no-color\",\"name\":\"x\",\"displayOrder\":0}")
                .andExpect(status().isBadRequest());
        send(post("/api/admin/categories"), "{\"code\":\"bad-color\",\"name\":\"x\",\"displayOrder\":0,\"color\":\"red\"}")
                .andExpect(status().isBadRequest());
    }

    @Test
    void categoryInUseCannotBeDeleted() throws Exception {
        long used = insertReturningId("insert into category (code, name) values ('tx-used', 'used')");
        long unused = insertReturningId("insert into category (code, name) values ('tx-unused', 'unused')");
        jdbc.update("update blog_post set category_id = ? where id = ?", used, post);

        mockMvc.perform(delete("/api/admin/categories/{id}", used).with(admin()).with(csrf()))
                .andExpect(status().isConflict());
        mockMvc.perform(delete("/api/admin/categories/{id}", unused).with(admin()).with(csrf()))
                .andExpect(status().isNoContent());
        assertEquals(1, jdbc.queryForObject("select count(*) from category", Integer.class));
    }

    @Test
    void managesTagsAndDeletingUsedTagUnlinksPosts() throws Exception {
        send(post("/api/admin/tags"), "{\"code\":\"tx-websocket\",\"name\":\"websocket\"}")
                .andExpect(status().isCreated());
        send(post("/api/admin/tags"), "{\"code\":\"tx-websocket\",\"name\":\"dup\"}")
                .andExpect(status().isConflict());
        long tag = jdbc.queryForObject("select id from tag where code = 'tx-websocket'", Long.class);
        send(put("/api/admin/tags/{id}", tag), "{\"code\":\"tx-ws\",\"name\":\"WebSocket\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("tx-ws"));
        jdbc.update("insert into blog_tag (blog_post_id, tag_id) values (?, ?)", post, tag);

        mockMvc.perform(delete("/api/admin/tags/{id}", tag).with(admin()).with(csrf()))
                .andExpect(status().isNoContent());
        assertEquals(0, jdbc.queryForObject("select count(*) from blog_tag where blog_post_id = ?", Integer.class, post));
        mockMvc.perform(get("/api/admin/tags").with(admin()))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void requiresAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/tags")).andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/admin/categories/1").with(csrf())).andExpect(status().isUnauthorized());
    }

    private org.springframework.test.web.servlet.ResultActions send(MockHttpServletRequestBuilder request, String json)
            throws Exception {
        return mockMvc.perform(request.with(admin()).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(json));
    }
}
