package dev.portfolio.portfolio_api.seed;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.portfolio.portfolio_api.support.ApiTestSupport;
import java.nio.file.Path;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

/** Seeds the real repository samples/ (Gradle runs tests from backend/). */
class SampleSeederTest extends ApiTestSupport {

    static final Path SAMPLES = Path.of("..", "samples").toAbsolutePath().normalize();

    @Autowired SampleSeeder seeder;

    @BeforeEach
    void clear() {
        jdbc.update("delete from project");
        jdbc.update("delete from blog_post");
        jdbc.update("delete from profile");
        jdbc.update("delete from category");
        jdbc.update("delete from tag");
        jdbc.update("delete from skill");
    }

    @Test
    void seedsSamplesThroughAdminRules() throws Exception {
        SampleSeeder.Result result = seeder.seed(SAMPLES);
        assertEquals(3, result.projects());
        assertEquals(3, result.blogPosts());
        assertTrue(result.profile());

        mockMvc.perform(get("/api/projects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.featured.length()").value(3))
                .andExpect(jsonPath("$.others.length()").value(0));
        mockMvc.perform(get("/api/projects/yujin-robot"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contributionNote").exists())
                .andExpect(jsonPath("$.periodStart").value("2024-11-01"))
                .andExpect(jsonPath("$.sections[0].title").value("개요"))
                .andExpect(jsonPath("$.skills[?(@.code == 'nestjs')]").exists());
        mockMvc.perform(get("/api/projects/viora"))
                .andExpect(jsonPath("$.periodEnd").value(org.hamcrest.Matchers.nullValue()));

        // offline-first-boundary is a draft sample and must stay hidden
        mockMvc.perform(get("/api/blog/posts"))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.items[0].slug").value("web-serial-usb"))
                .andExpect(jsonPath("$.items[0].publishedAt").value("2025-03-05T00:00:00Z"))
                .andExpect(jsonPath("$.items[1].slug").value("websocket-binary-video"));
        mockMvc.perform(get("/api/blog/posts/offline-first-boundary")).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/blog/posts").param("tag", "closed-network"))
                .andExpect(jsonPath("$.totalElements").value(1));
        mockMvc.perform(get("/api/blog/posts/web-serial-usb"))
                .andExpect(jsonPath("$.sections[0].bodyMarkdown").value(org.hamcrest.Matchers.containsString(":::questions")));

        mockMvc.perform(get("/api/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.headline").value(org.hamcrest.Matchers.startsWith("웹·앱 프론트엔드 6년차")))
                .andExpect(jsonPath("$.careers.length()").value(2))
                .andExpect(jsonPath("$.skillGroups[0].group").value("PRIMARY"))
                .andExpect(jsonPath("$.skillGroups[0].skills[0].code").value("typescript"))
                .andExpect(jsonPath("$.sections[0].title").value("소개"));

        assertEquals(1, jdbc.queryForObject(
                "select count(*) from project where slug = 'viora' and admin_note like '%측정값%'", Integer.class));
    }

    @Test
    void seedsRealContent() throws Exception {
        SampleSeeder.Result result = seeder.seed(SAMPLES.resolveSibling("content"));
        assertEquals(7, result.projects());
        assertEquals(12, result.blogPosts());
        assertEquals(15, result.relations());

        mockMvc.perform(get("/api/projects"))
                .andExpect(jsonPath("$.featured.length()").value(3))
                .andExpect(jsonPath("$.featured[0].slug").value("viora"))
                .andExpect(jsonPath("$.others.length()").value(4));
        mockMvc.perform(get("/api/projects/evar"))
                .andExpect(jsonPath("$.sections[?(@.title == '결정사항 / 트러블슈팅')]").isEmpty())
                .andExpect(jsonPath("$.references.length()").value(4));
        assertEquals(12, jdbc.queryForObject(
                "select count(*) from blog_post where admin_note is not null", Integer.class));
    }

    @Test
    void seedingTwiceReplacesInsteadOfDuplicating() {
        seeder.seed(SAMPLES);
        String counts = "select (select count(*) from skill) || '/' || (select count(*) from project) || '/'"
                + " || (select count(*) from blog_post) || '/' || (select count(*) from content_section) || '/'"
                + " || (select count(*) from profile) || '/' || (select count(*) from tag)";
        String first = jdbc.queryForObject(counts, String.class);
        seeder.seed(SAMPLES);
        assertEquals(first, jdbc.queryForObject(counts, String.class));
    }
}
