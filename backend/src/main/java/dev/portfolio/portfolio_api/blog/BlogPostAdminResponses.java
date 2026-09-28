package dev.portfolio.portfolio_api.blog;

import dev.portfolio.portfolio_api.content.DocumentReferences.AdminReference;
import dev.portfolio.portfolio_api.content.SectionResponse;
import java.time.Instant;
import java.util.List;

public final class BlogPostAdminResponses {

    private BlogPostAdminResponses() {
    }

    public record AdminBlogPostItem(
            Long id, String slug, String title, boolean published, Instant publishedAt, Instant updatedAt) {
    }

    public record AdminBlogPostDetail(
            Long id, String slug, String title, String summary, String thumbnailUrl,
            boolean published, Instant publishedAt, String adminNote, Instant createdAt, Instant updatedAt,
            Long categoryId, List<Long> tagIds, List<Long> skillIds, List<SectionResponse> sections,
            List<AdminReference> references, List<AdminReference> referencedBy) {
    }
}
