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

    public record CareerRequest(
            @NotBlank @Size(max = 200) String company,
            @Size(max = 200) String role,
            @NotNull LocalDate periodStart,
            LocalDate periodEnd,
            @Size(max = 5000) String description) {
    }

    /** group must be one of SkillGroup names. Order within the list is the display order. */
    public record SkillEntry(
            @NotNull Long skillId,
            @NotNull @Pattern(regexp = "PRIMARY|PROJECT_EXPERIENCE|LEARNING|COLLABORATION") String group) {
    }
}
