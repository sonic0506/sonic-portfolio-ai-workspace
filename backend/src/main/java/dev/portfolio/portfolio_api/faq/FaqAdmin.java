package dev.portfolio.portfolio_api.faq;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class FaqAdmin {

    private FaqAdmin() {
    }

    /** fromUnansweredId: optional unanswered question this FAQ resolves (ADR-0014 decision 4). */
    public record FaqRequest(
            @NotBlank @Size(max = 300) String question,
            @NotBlank @Size(max = 3000) String answer,
            boolean published,
            int displayOrder,
            Long fromUnansweredId) {
    }

    public record FaqResponse(long id, String question, String answer, boolean published, int displayOrder,
                              String indexStatus, Instant createdAt, Instant updatedAt) {
    }
}
