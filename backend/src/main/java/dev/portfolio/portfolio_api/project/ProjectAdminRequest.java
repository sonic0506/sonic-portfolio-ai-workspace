package dev.portfolio.portfolio_api.project;

import dev.portfolio.portfolio_api.content.SectionRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

/** Full replacement of a project, including ordered child lists. */
public record ProjectAdminRequest(
        @NotBlank @Size(max = 100) @Pattern(regexp = "[a-z0-9]+(-[a-z0-9]+)*") String slug,
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(max = 500) String summary,
        @Size(max = 100) String organization,
        @Size(max = 100) String position,
        @Min(0) @Max(100) Integer contribution,
        @Size(max = 200) String contributionNote,
        @NotNull LocalDate periodStart,
        LocalDate periodEnd,
        @Size(max = 500) @Pattern(regexp = "https?://\\S+") String thumbnailUrl,
        @Size(max = 500) @Pattern(regexp = "https?://\\S+") String githubUrl,
        @Size(max = 500) @Pattern(regexp = "https?://\\S+") String serviceUrl,
        boolean featured,
        boolean published,
        int displayOrder,
        @Size(max = 5000) String adminNote,
        @NotNull List<@NotBlank @Size(max = 500) String> highlights,
        @NotNull List<@NotNull Long> skillIds,
        @NotNull @Valid List<SectionRequest> sections) {
}
