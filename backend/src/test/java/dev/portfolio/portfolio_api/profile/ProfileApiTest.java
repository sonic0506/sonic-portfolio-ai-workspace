package dev.portfolio.portfolio_api.profile;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.portfolio.portfolio_api.support.ApiTestSupport;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ProfileApiTest extends ApiTestSupport {

    @BeforeEach
    void clear() {
        jdbc.update("delete from profile");
    }

    @Test
    void notFoundWithoutProfile() throws Exception {
        mockMvc.perform(get("/api/profile")).andExpect(status().isNotFound());
    }

    @Test
    void returnsProfileWithOrderedCareersGroupsAndSections() throws Exception {
        long id = insertReturningId("""
                insert into profile (headline, short_bio, github_url, email)
                values ('headline', 'short bio', 'https://github.com/me', 'me@example.com')""");
        career(id, "Old Co", LocalDate.of(2019, 1, 1), LocalDate.of(2021, 1, 1), 0);
        career(id, "Now Co", LocalDate.of(2021, 2, 1), null, 0);
        long java = skill("test-java", "Java");
        long slack = skill("test-slack", "Slack");
        long rust = skill("test-rust", "Rust");
        profileSkill(id, slack, "COLLABORATION", 0);
        profileSkill(id, rust, "LEARNING", 0);
        profileSkill(id, java, "PRIMARY", 0);
        jdbc.update("insert into content_section (profile_id, title, body_markdown, display_order) values (?, '소개', 'hello', 0)", id);

        mockMvc.perform(get("/api/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.headline").value("headline"))
                .andExpect(jsonPath("$.shortBio").value("short bio"))
                .andExpect(jsonPath("$.email").value("me@example.com"))
                .andExpect(jsonPath("$.imageUrl").value(nullValue()))
                .andExpect(jsonPath("$.careers[0].company").value("Now Co"))
                .andExpect(jsonPath("$.careers[0].periodEnd").value(nullValue()))
                .andExpect(jsonPath("$.careers[1].company").value("Old Co"))
                .andExpect(jsonPath("$.skillGroups.length()").value(3))
                .andExpect(jsonPath("$.skillGroups[0].group").value("PRIMARY"))
                .andExpect(jsonPath("$.skillGroups[0].skills[0].code").value("test-java"))
                .andExpect(jsonPath("$.skillGroups[1].group").value("LEARNING"))
                .andExpect(jsonPath("$.skillGroups[2].group").value("COLLABORATION"))
                .andExpect(jsonPath("$.sections[0].title").value("소개"))
                .andExpect(jsonPath("$.id").doesNotExist());
    }

    private void career(long profileId, String company, LocalDate start, LocalDate end, int order) {
        jdbc.update("insert into career (profile_id, company, period_start, period_end, display_order) values (?, ?, ?, ?, ?)",
                profileId, company, start, end, order);
    }

    private void profileSkill(long profileId, long skillId, String group, int order) {
        jdbc.update("insert into profile_skill (profile_id, skill_id, skill_group, display_order) values (?, ?, ?, ?)",
                profileId, skillId, group, order);
    }
}
