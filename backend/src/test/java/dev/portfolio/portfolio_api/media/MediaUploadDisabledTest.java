package dev.portfolio.portfolio_api.media;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.portfolio.portfolio_api.support.ApiTestSupport;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;

/** Without a bucket and keys the rest of the app runs; only uploads answer 503. */
@TestPropertySource(properties = {"app.media.bucket=", "app.media.access-key-id=", "app.media.secret-access-key="})
class MediaUploadDisabledTest extends ApiTestSupport {

    @Test
    void uploadIsUnavailableUntilConfigured() throws Exception {
        mockMvc.perform(post("/api/admin/media/uploads").with(admin()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fileName\":\"a.png\",\"contentType\":\"image/png\",\"sizeBytes\":10,\"purpose\":\"PROFILE\"}"))
                .andExpect(status().isServiceUnavailable());
    }
}
