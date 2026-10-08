package dev.portfolio.portfolio_api.profile;

import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.portfolio.portfolio_api.support.ApiTestSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

class ProfileAdminApiTest extends ApiTestSupport {

    long java;
    long slack;

    @BeforeEach
    void seed() {
        jdbc.update("delete from profile");
        java = skill("pf-java", "Java");
        slack = skill("pf-slack", "Slack");
    }

    @Test
    void firstPutCreatesProfileVisibleToPublic() throws Exception {
        mockMvc.perform(get("/api/admin/profile").with(admin())).andExpect(status().isNotFound());

        save(body("headline", careers(), skills(), "[{\"title\":\"소개\",\"bodyMarkdown\":\"hello\"}]"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.careers[0].company").value("Now Co"))
                .andExpect(jsonPath("$.careers[0].periodEnd").value(nullValue()))
                .andExpect(jsonPath("$.skills[0].skillId").value(slack))
                .andExpect(jsonPath("$.skills[0].group").value("COLLABORATION"))
                .andExpect(jsonPath("$.updatedAt").isNotEmpty());

        mockMvc.perform(get("/api/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.headline").value("headline"))
                .andExpect(jsonPath("$.careers[1].company").value("Old Co"))
                .andExpect(jsonPath("$.skillGroups[0].group").value("PRIMARY"))
                .andExpect(jsonPath("$.skillGroups[1].group").value("COLLABORATION"))
                .andExpect(jsonPath("$.sections[0].title").value("소개"));
    }

    @Test
    void secondPutReplacesInsteadOfCreatingAnotherRow() throws Exception {
        save(body("first", careers(), skills(), "[]")).andExpect(status().isOk());
        save(body("second", "[]", "[]", "[]"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.headline").value("second"))
                .andExpect(jsonPath("$.careers.length()").value(0))
                .andExpect(jsonPath("$.skills.length()").value(0));
        assertEquals(1, jdbc.queryForObject("select count(*) from profile", Integer.class));
        assertEquals(0, jdbc.queryForObject("select count(*) from career", Integer.class));
    }

    @Test
    void rejectsInvalidInput() throws Exception {
        String reversed = "[{\"company\":\"X\",\"role\":null,\"periodStart\":\"2024-01-01\","
                + "\"periodEnd\":\"2023-01-01\",\"description\":null}]";
        save(body("h", reversed, "[]", "[]")).andExpect(status().isBadRequest());
        save(body("h", "[]", "[{\"skillId\":" + java + ",\"group\":\"EXPERT\"}]", "[]"))
                .andExpect(status().isBadRequest());
        save(body("h", "[]", "[{\"skillId\":999999999,\"group\":\"PRIMARY\"}]", "[]"))
                .andExpect(status().isBadRequest());
        save(body("h", "[]", "[{\"skillId\":" + java + ",\"group\":\"PRIMARY\"},"
                + "{\"skillId\":" + java + ",\"group\":\"LEARNING\"}]", "[]"))
                .andExpect(status().isBadRequest());
        save(body("h", "[]", "[]", "[]").replace("\"email\":\"me@example.com\"", "\"email\":\"not-an-email\""))
                .andExpect(status().isBadRequest());
        assertEquals(0, jdbc.queryForObject("select count(*) from profile", Integer.class));
    }

    @Test
    void careersCarryAchievementsWithOptionalProjectLink() throws Exception {
        // ADR-0019: Wanted-style career → achievements. A link shows publicly only for a published project.
        long viora = insertReturningId("insert into project (slug, title, summary, period_start, published)"
                + " values ('pf-viora', 'VIORA', 's', '2026-07-01', true)");
        long draft = insertReturningId("insert into project (slug, title, summary, period_start, published)"
                + " values ('pf-draft', '비공개', 's', '2026-01-01', false)");
        String careers = ("[{\"company\":\"슬로그업\",\"role\":\"FE 개발자\",\"periodStart\":\"2021-08-01\",\"periodEnd\":null,"
                + "\"description\":\"요약\",\"employmentType\":\"정규직\",\"position\":\"챕터 리드\",\"achievements\":["
                + "{\"title\":\"VIORA\",\"periodStart\":\"2026-07-01\",\"periodEnd\":\"2026-09-01\",\"job\":\"앱 개발\","
                + "\"position\":null,\"bodyMarkdown\":\"[주요 성과]\\n- 처리 위치 제안\",\"projectId\":%d},"
                + "{\"title\":\"비공개 작업\",\"periodStart\":\"2026-01-01\",\"projectId\":%d}]}]").formatted(viora, draft);
        save(body("h", careers, "[]", "[]")).andExpect(status().isOk())
                .andExpect(jsonPath("$.careers[0].employmentType").value("정규직"))
                .andExpect(jsonPath("$.careers[0].achievements[0].projectId").value(viora))
                .andExpect(jsonPath("$.careers[0].achievements[1].title").value("비공개 작업"));

        mockMvc.perform(get("/api/profile"))
                .andExpect(jsonPath("$.careers[0].position").value("챕터 리드"))
                .andExpect(jsonPath("$.careers[0].achievements[0].job").value("앱 개발"))
                .andExpect(jsonPath("$.careers[0].achievements[0].bodyMarkdown").value("[주요 성과]\n- 처리 위치 제안"))
                .andExpect(jsonPath("$.careers[0].achievements[0].project.url").value("/projects/pf-viora"))
                .andExpect(jsonPath("$.careers[0].achievements[1].project").value(nullValue()));

        // the profile chat document gets one "## company · title" section per achievement
        String content = jdbc.queryForObject("select content from document where document_type = 'PROFILE'", String.class);
        assertTrue(content.contains("## 경력 · 슬로그업"), content);
        assertTrue(content.contains("## 슬로그업 · VIORA\n\n2026.07 - 2026.09 · 앱 개발\n\n[주요 성과]"), content);

        // replacing the careers list drops the old achievements with them
        save(body("h", careers(), "[]", "[]")).andExpect(status().isOk());
        assertEquals(0, jdbc.queryForObject("select count(*) from career_achievement", Integer.class));
    }

    @Test
    void rejectsInvalidAchievements() throws Exception {
        String endBeforeStart = "[{\"company\":\"C\",\"periodStart\":\"2021-01-01\",\"achievements\":["
                + "{\"title\":\"A\",\"periodStart\":\"2022-05-01\",\"periodEnd\":\"2022-01-01\"}]}]";
        save(body("h", endBeforeStart, "[]", "[]")).andExpect(status().isBadRequest());
        String unknownProject = "[{\"company\":\"C\",\"periodStart\":\"2021-01-01\",\"achievements\":["
                + "{\"title\":\"A\",\"periodStart\":\"2022-01-01\",\"projectId\":999999}]}]";
        save(body("h", unknownProject, "[]", "[]")).andExpect(status().isBadRequest());
        String noTitle = "[{\"company\":\"C\",\"periodStart\":\"2021-01-01\",\"achievements\":[{\"periodStart\":\"2022-01-01\"}]}]";
        save(body("h", noTitle, "[]", "[]")).andExpect(status().isBadRequest());
    }

    @Test
    void requiresAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/profile")).andExpect(status().isUnauthorized());
    }

    private String careers() {
        return "[{\"company\":\"Now Co\",\"role\":\"Dev\",\"periodStart\":\"2021-02-01\",\"periodEnd\":null,"
                + "\"description\":\"current\"},"
                + "{\"company\":\"Old Co\",\"role\":null,\"periodStart\":\"2019-01-01\",\"periodEnd\":\"2021-01-01\","
                + "\"description\":null}]";
    }

    private String skills() {
        return "[{\"skillId\":" + slack + ",\"group\":\"COLLABORATION\"},"
                + "{\"skillId\":" + java + ",\"group\":\"PRIMARY\"}]";
    }

    private static String body(String headline, String careers, String skills, String sections) {
        return ("{\"headline\":\"%s\",\"shortBio\":\"short bio\",\"imageUrl\":null,"
                + "\"githubUrl\":\"https://github.com/sonic0506\",\"email\":\"me@example.com\","
                + "\"careers\":%s,\"skills\":%s,\"sections\":%s}")
                .formatted(headline, careers, skills, sections);
    }

    private ResultActions save(String json) throws Exception {
        return mockMvc.perform(put("/api/admin/profile").with(admin()).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(json));
    }
}
