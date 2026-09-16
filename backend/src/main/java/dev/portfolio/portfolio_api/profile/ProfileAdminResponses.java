package dev.portfolio.portfolio_api.profile;

import dev.portfolio.portfolio_api.content.SectionResponse;
import dev.portfolio.portfolio_api.profile.ProfileAdminRequest.CareerRequest;
import dev.portfolio.portfolio_api.profile.ProfileAdminRequest.SkillEntry;
import java.time.Instant;
import java.util.List;

public final class ProfileAdminResponses {

    private ProfileAdminResponses() {
    }

    /** Mirrors the request shape so the admin UI can edit and send it back. */
    public record AdminProfileDetail(
            Long id, String headline, String shortBio, String imageUrl, String githubUrl, String email,
            Instant updatedAt,
            List<CareerRequest> careers, List<SkillEntry> skills, List<SectionResponse> sections) {
    }
}
