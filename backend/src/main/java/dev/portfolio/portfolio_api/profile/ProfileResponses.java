package dev.portfolio.portfolio_api.profile;

import dev.portfolio.portfolio_api.content.SectionResponse;
import dev.portfolio.portfolio_api.skill.SkillResponse;
import java.time.LocalDate;
import java.util.List;

public final class ProfileResponses {

    private ProfileResponses() {
    }

    public record ProfileDetail(
            String headline, String shortBio, String imageUrl, String githubUrl, String email,
            List<CareerResponse> careers, List<SkillGroupResponse> skillGroups,
            List<SectionResponse> sections) {
    }

    public record CareerResponse(
            String company, String role, LocalDate periodStart, LocalDate periodEnd, String description,
            String employmentType, String position, List<AchievementResponse> achievements) {
    }

    /** project is set only when the linked project is published. */
    public record AchievementResponse(
            String title, LocalDate periodStart, LocalDate periodEnd, String job, String position,
            String bodyMarkdown, ProjectLink project) {
    }

    public record ProjectLink(String slug, String title, String url) {
    }

    public record SkillGroupResponse(SkillGroup group, List<SkillResponse> skills) {
    }
}
