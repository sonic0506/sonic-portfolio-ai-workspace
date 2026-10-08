package dev.portfolio.portfolio_api.media;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.matchesPattern;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.portfolio.portfolio_api.support.ApiTestSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.ResultActions;

/** ADR-0020 upload tickets, signed with a dummy key (presigning never calls AWS). */
@TestPropertySource(properties = {
        "app.media.bucket=test-bucket", "app.media.access-key-id=AKIATESTKEY", "app.media.secret-access-key=test-secret",
        "app.media.public-base-url=https://images.example.com/", "app.media.key-prefix=test/images",
        "app.media.max-bytes=1000"})
class MediaAdminApiTest extends ApiTestSupport {

    @BeforeEach
    void clear() {
        jdbc.update("delete from media");
    }

    @Test
    void issuesAPresignedPutAndRecordsTheImage() throws Exception {
        upload("logo.png", "image/png", 500, "PROFILE").andExpect(status().isCreated())
                .andExpect(jsonPath("$.uploadUrl").value(containsString("test-bucket.s3.")))
                .andExpect(jsonPath("$.uploadUrl").value(containsString("X-Amz-SignedHeaders=content-length%3Bcontent-type%3Bhost")))
                .andExpect(jsonPath("$.headers['Content-Type']").value("image/png"))
                .andExpect(jsonPath("$.publicUrl").value(matchesPattern(
                        "https://images\\.example\\.com/test/images/\\d{4}/\\d{2}/[0-9a-f-]{36}\\.png")));
        assertEquals("logo.png|image/png|500|PROFILE", jdbc.queryForObject(
                "select original_name || '|' || content_type || '|' || size_bytes || '|' || purpose from media", String.class));
    }

    @Test
    void checksTypeAndSizePerPurpose() throws Exception {
        upload("a.svg", "image/svg+xml", 100, "THUMBNAIL").andExpect(status().isBadRequest());
        upload("a.svg", "image/svg+xml", 100, "SKILL_ICON").andExpect(status().isCreated());
        upload("a.pdf", "application/pdf", 100, "CONTENT").andExpect(status().isBadRequest());
        upload("big.jpg", "image/jpeg", 1001, "CONTENT").andExpect(status().isBadRequest());
        upload("a.jpg", "image/jpeg", 100, "NOPE").andExpect(status().isBadRequest());
    }

    @Test
    void listsLatestFirstAndByPurpose() throws Exception {
        upload("one.png", "image/png", 10, "THUMBNAIL");
        upload("two.svg", "image/svg+xml", 10, "SKILL_ICON");
        mockMvc.perform(get("/api/admin/media").with(admin()))
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].originalName").value("two.svg"));
        mockMvc.perform(get("/api/admin/media").param("purpose", "THUMBNAIL").with(admin()))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].purpose").value("THUMBNAIL"));
    }

    @Test
    void needsAdmin() throws Exception {
        mockMvc.perform(post("/api/admin/media/uploads").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{}")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/admin/media")).andExpect(status().isUnauthorized());
    }

    private ResultActions upload(String name, String type, long size, String purpose) throws Exception {
        return mockMvc.perform(post("/api/admin/media/uploads").with(admin()).with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"fileName\":\"%s\",\"contentType\":\"%s\",\"sizeBytes\":%d,\"purpose\":\"%s\"}"
                        .formatted(name, type, size, purpose)));
    }
}
