package dev.portfolio.portfolio_api.content;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** One section of a full-replace list; list position becomes display_order. */
public record SectionRequest(
        @NotBlank @Size(max = 200) String title,
        @NotNull @Size(max = 100_000) String bodyMarkdown) {
}
