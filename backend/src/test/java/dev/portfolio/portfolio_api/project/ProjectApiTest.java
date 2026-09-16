package dev.portfolio.portfolio_api.project;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.portfolio.portfolio_api.support.ApiTestSupport;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ProjectApiTest extends ApiTestSupport {

    long viora;

    @BeforeEach
    void seed() {
        jdbc.update("delete from project");
        long java = skill("test-java", "Java");
        long ble = skill("test-ble", "BLE");

        // featured, ongoing
        viora = project("viora", true, true, 0, LocalDate.of(2026, 7, 1), null);
        jdbc.update("update project set organization = '사내 프로덕트', thumbnail_url = 'https://img/viora.png',"
                + " github_url = 'https://github.com/x', admin_note = 'secret note' where id = ?", viora);
        highlight(viora, "second", 1);
        highlight(viora, "first", 0);
        projectSkill(viora, ble, 1);
        projectSkill(viora, java, 0);
        section(viora, "배운 것", "B", 1);
        section(viora, "개요", "A\n\n:::questions\n- 질문\n:::", 0);

        // non-featured, same display order: newer period first, then higher id
        long older = project("older", false, true, 1, LocalDate.of(2023, 1, 1), LocalDate.of(2023, 6, 1));
        highlight(older, "hidden in list", 0);
        project("newer", false, true, 1, LocalDate.of(2024, 1, 1), LocalDate.of(2024, 6, 1));

        long hidden = project("hidden", true, false, 0, LocalDate.of(2025, 1, 1), null);
        section(hidden, "비공개", "X", 0);
    }

    @Test
    void listSeparatesFeaturedAndExcludesUnpublished() throws Exception {
        mockMvc.perform(get("/api/projects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.featured.length()").value(1))
                .andExpect(jsonPath("$.featured[0].slug").value("viora"))
                .andExpect(jsonPath("$.featured[0].highlights[0]").value("first"))
                .andExpect(jsonPath("$.featured[0].highlights[1]").value("second"))
                .andExpect(jsonPath("$.featured[0].thumbnailUrl").value("https://img/viora.png"))
                .andExpect(jsonPath("$.featured[0].periodStart").value("2026-07-01"))
                .andExpect(jsonPath("$.featured[0].periodEnd").value(nullValue()))
                .andExpect(jsonPath("$.featured[0].skills[0].code").value("test-java"))
                .andExpect(jsonPath("$.featured[0].skills[1].code").value("test-ble"))
                .andExpect(jsonPath("$.featured[0].sections").doesNotExist())
                .andExpect(jsonPath("$.others.length()").value(2))
                .andExpect(jsonPath("$.others[0].slug").value("newer"))
                .andExpect(jsonPath("$.others[1].slug").value("older"))
                .andExpect(jsonPath("$.others[1].highlights").doesNotExist())
                .andExpect(jsonPath("$.others[1].thumbnailUrl").doesNotExist());
    }

    @Test
    void listNeverExposesAdminFields() throws Exception {
        mockMvc.perform(get("/api/projects"))
                .andExpect(jsonPath("$.featured[0].adminNote").doesNotExist())
                .andExpect(jsonPath("$.featured[0].featured").doesNotExist())
                .andExpect(jsonPath("$.featured[0].published").doesNotExist())
                .andExpect(jsonPath("$.featured[0].id").doesNotExist());
    }

    @Test
    void detailReturnsOwnSectionsInOrder() throws Exception {
        mockMvc.perform(get("/api/projects/viora"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.organization").value("사내 프로덕트"))
                .andExpect(jsonPath("$.githubUrl").value("https://github.com/x"))
                .andExpect(jsonPath("$.serviceUrl").value(nullValue()))
                .andExpect(jsonPath("$.highlights.length()").value(2))
                .andExpect(jsonPath("$.sections.length()").value(2))
                .andExpect(jsonPath("$.sections[0].title").value("개요"))
                .andExpect(jsonPath("$.sections[0].bodyMarkdown").value("A\n\n:::questions\n- 질문\n:::"))
                .andExpect(jsonPath("$.sections[1].title").value("배운 것"))
                .andExpect(jsonPath("$.adminNote").doesNotExist())
                .andExpect(jsonPath("$.published").doesNotExist());
    }

    @Test
    void unpublishedOrUnknownProjectIsNotFound() throws Exception {
        mockMvc.perform(get("/api/projects/hidden")).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/projects/nope")).andExpect(status().isNotFound());
    }

    @Test
    void emptyListWhenNothingPublished() throws Exception {
        jdbc.update("delete from project");
        mockMvc.perform(get("/api/projects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.featured.length()").value(0))
                .andExpect(jsonPath("$.others.length()").value(0));
    }

    private long project(String slug, boolean featured, boolean published, int displayOrder,
                         LocalDate start, LocalDate end) {
        return insertReturningId("""
                insert into project (slug, title, summary, position, contribution, period_start, period_end,
                                     featured, published, display_order)
                values (?, ?, ?, '개발', 30, ?, ?, ?, ?, ?)""",
                slug, slug + " title", slug + " summary", start, end, featured, published, displayOrder);
    }

    private void highlight(long projectId, String content, int order) {
        jdbc.update("insert into project_highlight (project_id, content, display_order) values (?, ?, ?)",
                projectId, content, order);
    }

    private void projectSkill(long projectId, long skillId, int order) {
        jdbc.update("insert into project_skill (project_id, skill_id, display_order) values (?, ?, ?)",
                projectId, skillId, order);
    }

    private void section(long projectId, String title, String body, int order) {
        jdbc.update("insert into content_section (project_id, title, body_markdown, display_order) values (?, ?, ?, ?)",
                projectId, title, body, order);
    }
}
