package dev.portfolio.portfolio_api.profile;

import dev.portfolio.portfolio_api.content.SectionRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

/** Full replacement of the single profile. List order becomes display_order. */
public record ProfileAdminRequest(
        @NotBlank @Size(max = 200) String headline,
        @NotBlank @Size(max = 1000) String shortBio,
        @Size(max = 500) @Pattern(regexp = "https?://\\S+") String imageUrl,
        @Size(max = 500) @Pattern(regexp = "https?://\\S+") String githubUrl,
        @Size(max = 200) @Email String email,
        @NotNull @Valid List<CareerRequest> careers,
        @NotNull @Valid List<SkillEntry> skills,
        @NotNull @Valid List<SectionRequest> sections) {

    /**
     * role is the job (직무). Wanted-style (ADR-0019): employmentType, position (직책) and the
     * per-project achievements below it. New fields may be omitted; achievements null means none.
     */
    public record CareerRequest(
            @NotBlank @Size(max = 200) String company,
            @Size(max = 200) String role,
            @NotNull LocalDate periodStart,
            LocalDate periodEnd,
            @Size(max = 5000) String description,
            @Size(max = 100) String employmentType,
            @Size(max = 100) String position,
            @Valid List<AchievementRequest> achievements) {

        public List<AchievementRequest> achievementsOrEmpty() {
            return achievements == null ? List.of() : achievements;
        }
    }

    /** One project under a career: list order becomes display_order. projectId links a portfolio project. */
    public record AchievementRequest(
            @NotBlank @Size(max = 200) String title,
            @NotNull LocalDate periodStart,
            LocalDate periodEnd,
            @Size(max = 100) String job,
            @Size(max = 100) String position,
            @Size(max = 20_000) String bodyMarkdown,
            Long projectId) {
    }

    /** group must be one of SkillGroup names. Order within the list is the display order. */
    public record SkillEntry(
            @NotNull Long skillId,
            @NotNull @Pattern(regexp = "PRIMARY|PROJECT_EXPERIENCE|LEARNING|COLLABORATION") String group) {
    }
}
