package dev.portfolio.portfolio_api.blog;

import dev.portfolio.portfolio_api.content.DocumentReferences.ReferenceRequest;
import dev.portfolio.portfolio_api.content.SectionRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

/** Full replacement of a blog post, including link lists and ordered sections. */
public record BlogPostAdminRequest(
        @NotBlank @Size(max = 100) @Pattern(regexp = "[a-z0-9]+(-[a-z0-9]+)*") String slug,
        @NotBlank @Size(max = 200) String title,
        @Size(max = 500) String summary,
        @Size(max = 500) @Pattern(regexp = "https?://\\S+") String thumbnailUrl,
        boolean published,
        @Size(max = 5000) String adminNote,
        @NotNull List<@NotNull Long> categoryIds,
        @NotNull List<@NotNull Long> tagIds,
        @NotNull List<@NotNull Long> skillIds,
        @NotNull @Valid List<SectionRequest> sections,
        @NotNull @Valid List<@NotNull ReferenceRequest> references) {
}
