package dev.portfolio.portfolio_api.content;

/** Markdown is returned as stored, including :::questions blocks. */
public record SectionResponse(String title, String bodyMarkdown) {

    public static SectionResponse from(ContentSection section) {
        return new SectionResponse(section.getTitle(), section.getBodyMarkdown());
    }
}
