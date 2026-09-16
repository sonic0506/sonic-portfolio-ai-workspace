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
            String company, String role, LocalDate periodStart, LocalDate periodEnd, String description) {
    }

    public record SkillGroupResponse(SkillGroup group, List<SkillResponse> skills) {
    }
}
