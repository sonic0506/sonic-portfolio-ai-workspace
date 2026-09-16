package dev.portfolio.portfolio_api.project;

import dev.portfolio.portfolio_api.content.SectionResponse;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** Admin payloads: include unpublished items and admin-only fields. */
public final class ProjectAdminResponses {

    private ProjectAdminResponses() {
    }

    public record AdminProjectItem(
            Long id, String slug, String title, boolean featured, boolean published, int displayOrder,
            LocalDate periodStart, LocalDate periodEnd, Instant publishedAt, Instant updatedAt) {
    }

    public record AdminProjectDetail(
            Long id, String slug, String title, String summary, String organization, String position,
            Integer contribution, String contributionNote, LocalDate periodStart, LocalDate periodEnd,
            String thumbnailUrl, String githubUrl, String serviceUrl,
            boolean featured, boolean published, int displayOrder, Instant publishedAt,
            String adminNote, Instant createdAt, Instant updatedAt,
            List<String> highlights, List<Long> skillIds, List<SectionResponse> sections) {
    }
}
