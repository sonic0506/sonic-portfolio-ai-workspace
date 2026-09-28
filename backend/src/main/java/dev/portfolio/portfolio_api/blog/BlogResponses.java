package dev.portfolio.portfolio_api.blog;

import dev.portfolio.portfolio_api.content.CategoryLabel;
import dev.portfolio.portfolio_api.content.DocumentReferences.PublicReference;
import dev.portfolio.portfolio_api.content.SectionResponse;
import dev.portfolio.portfolio_api.skill.SkillResponse;
import java.time.Instant;
import java.util.List;

/** Public blog payloads. published flag, admin notes and created_at are never included. */
public final class BlogResponses {

    private BlogResponses() {
    }

    public record LabelResponse(String code, String name) {
    }

    public record CategoryCount(String code, String name, String color, long postCount) {
    }

    public record BlogPostPage(List<BlogPostItem> items, int page, int size, long totalElements) {
    }

    public record BlogPostItem(
            String slug, String title, String summary, String thumbnailUrl,
            Instant publishedAt, Instant updatedAt,
            CategoryLabel category, List<LabelResponse> tags, List<SkillResponse> skills) {
    }

    public record BlogPostDetail(
            String slug, String title, String summary, String thumbnailUrl,
            Instant publishedAt, Instant updatedAt,
            CategoryLabel category, List<LabelResponse> tags, List<SkillResponse> skills,
            List<SectionResponse> sections,
            List<PublicReference> references, List<PublicReference> referencedBy) {
    }
}
