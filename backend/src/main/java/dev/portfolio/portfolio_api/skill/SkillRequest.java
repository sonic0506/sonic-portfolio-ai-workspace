package dev.portfolio.portfolio_api.skill;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** code is the stable reference key (lowercase kebab-case), name is the display label. */
public record SkillRequest(
        @NotBlank @Size(max = 60) @Pattern(regexp = "[a-z0-9]+(-[a-z0-9]+)*") String code,
        @NotBlank @Size(max = 100) String name,
        @Size(max = 100) String iconKey,
        @Size(max = 500) @Pattern(regexp = "https?://\\S+") String iconUrl) {

    String normalizedIconKey() {
        return iconKey == null || iconKey.isBlank() ? null : iconKey.trim();
    }

    String normalizedIconUrl() {
        return iconUrl == null || iconUrl.isBlank() ? null : iconUrl.trim();
    }
}
