package dev.portfolio.portfolio_api.media;

import java.util.Set;

/** Where an uploaded image is used (ADR-0020). SVG can carry scripts, so only skill logos may use it. */
public enum MediaPurpose {
    PROFILE, THUMBNAIL, CAREER_LOGO, SKILL_ICON, CONTENT;

    private static final Set<String> RASTER = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

    boolean allows(String contentType) {
        return RASTER.contains(contentType) || (this == SKILL_ICON && "image/svg+xml".equals(contentType));
    }
}
