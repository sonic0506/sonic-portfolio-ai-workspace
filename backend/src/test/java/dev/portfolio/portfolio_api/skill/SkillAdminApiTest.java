package dev.portfolio.portfolio_api.skill;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.hamcrest.Matchers.nullValue;

import dev.portfolio.portfolio_api.support.ApiTestSupport;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class SkillAdminApiTest extends ApiTestSupport {

    @BeforeEach
    void clear() {
        jdbc.update("delete from skill where code like 'adm-%'");
    }

    @Test
    void createsSkill() throws Exception {
        mockMvc.perform(post("/api/admin/skills").with(admin()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"adm-web-serial\",\"name\":\" Web Serial API \",\"iconKey\":\"  \"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.code").value("adm-web-serial"))
                .andExpect(jsonPath("$.name").value("Web Serial API"))
                .andExpect(jsonPath("$.iconKey").value(nullValue()));
        assertEquals(1, count("adm-web-serial"));
    }

    @Test
    void writesNeedAdminAndCsrf() throws Exception {
        String body = "{\"code\":\"adm-x\",\"name\":\"X\"}";
        mockMvc.perform(post("/api/admin/skills").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/admin/skills").with(admin()).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());
        assertEquals(0, count("adm-x"));
    }

    @Test
    void rejectsInvalidInput() throws Exception {
        mockMvc.perform(post("/api/admin/skills").with(admin()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"Web Serial\",\"name\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void duplicateCodeIsConflict() throws Exception {
        skill("adm-java", "Java");
        mockMvc.perform(post("/api/admin/skills").with(admin()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"adm-java\",\"name\":\"Java 21\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void updatesSkillAndChecksConflicts() throws Exception {
        long id = skill("adm-react", "React");
        skill("adm-vue", "Vue");
        mockMvc.perform(put("/api/admin/skills/{id}", id).with(admin()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"adm-react\",\"name\":\"React 19\",\"iconKey\":\"react\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("React 19"))
                .andExpect(jsonPath("$.iconKey").value("react"));
        mockMvc.perform(put("/api/admin/skills/{id}", id).with(admin()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"adm-vue\",\"name\":\"React\"}"))
                .andExpect(status().isConflict());
        mockMvc.perform(put("/api/admin/skills/{id}", 999_999_999L).with(admin()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"code\":\"adm-none\",\"name\":\"None\"}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void deletesUnusedSkillButNotReferencedOne() throws Exception {
        long unused = skill("adm-unused", "Unused");
        mockMvc.perform(delete("/api/admin/skills/{id}", unused).with(admin()).with(csrf()))
                .andExpect(status().isNoContent());
        assertEquals(0, count("adm-unused"));

        long used = skill("adm-used", "Used");
        long project = insertReturningId(
                "insert into project (slug, title, summary, period_start) values ('adm-p', 't', 's', ?)",
                LocalDate.of(2024, 1, 1));
        jdbc.update("insert into project_skill (project_id, skill_id) values (?, ?)", project, used);
        mockMvc.perform(delete("/api/admin/skills/{id}", used).with(admin()).with(csrf()))
                .andExpect(status().isConflict());
        assertEquals(1, count("adm-used"));
    }

    private int count(String code) {
        return jdbc.queryForObject("select count(*) from skill where code = ?", Integer.class, code);
    }
}
