package dev.portfolio.portfolio_api.project;

import dev.portfolio.portfolio_api.content.DocumentReferences.PublicReference;
import dev.portfolio.portfolio_api.content.SectionResponse;
import dev.portfolio.portfolio_api.skill.SkillResponse;
import java.time.LocalDate;
import java.util.List;

/** Public project payloads. published/featured flags and admin notes are never included. */
public final class ProjectResponses {

    private ProjectResponses() {
    }

    public record ProjectList(List<FeaturedProject> featured, List<ProjectItem> others) {
    }

    /** Featured list item: includes highlights and thumbnail (CONTENT_SPEC 1). */
    public record FeaturedProject(
            String slug, String title, String summary, List<String> highlights,
            LocalDate periodStart, LocalDate periodEnd, String position,
            Integer contribution, String contributionNote, String thumbnailUrl,
            List<SkillResponse> skills) {
    }

    /** Non-featured list item. */
    public record ProjectItem(
            String slug, String title, String summary,
            LocalDate periodStart, LocalDate periodEnd, String position,
            Integer contribution, String contributionNote,
            List<SkillResponse> skills) {
    }

    public record ProjectDetail(
            String slug, String title, String summary, List<String> highlights,
            String organization, String position, Integer contribution, String contributionNote,
            LocalDate periodStart, LocalDate periodEnd, String thumbnailUrl,
            String githubUrl, String serviceUrl,
            List<SkillResponse> skills, List<SectionResponse> sections,
            List<PublicReference> references, List<PublicReference> referencedBy) {
    }
}
