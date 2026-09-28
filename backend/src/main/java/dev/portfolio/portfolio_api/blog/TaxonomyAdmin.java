package dev.portfolio.portfolio_api.blog;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Request/response records for admin category and tag management. */
public final class TaxonomyAdmin {

    private TaxonomyAdmin() {
    }

    public record CategoryRequest(
            @NotBlank @Size(max = 60) @Pattern(regexp = "[a-z0-9]+(-[a-z0-9]+)*") String code,
            @NotBlank @Size(max = 100) String name,
            int displayOrder,
            @NotNull @Pattern(regexp = "#[0-9A-Fa-f]{6}") String color) {
    }

    public record CategoryResponse(Long id, String code, String name, int displayOrder, String color) {
        static CategoryResponse from(Category c) {
            return new CategoryResponse(c.getId(), c.getCode(), c.getName(), c.getDisplayOrder(), c.getColor());
        }
    }

    public record TagRequest(
            @NotBlank @Size(max = 60) @Pattern(regexp = "[a-z0-9]+(-[a-z0-9]+)*") String code,
            @NotBlank @Size(max = 100) String name) {
    }

    public record TagResponse(Long id, String code, String name) {
        static TagResponse from(Tag t) {
            return new TagResponse(t.getId(), t.getCode(), t.getName());
        }
    }
}
