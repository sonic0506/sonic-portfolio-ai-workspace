package dev.portfolio.portfolio_api.content;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Title + Markdown section owned by exactly one project, blog post or profile (ADR-0005). */
@Entity
@Table(name = "content_section")
public class ContentSection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "blog_post_id")
    private Long blogPostId;

    @Column(name = "profile_id")
    private Long profileId;

    @Column(nullable = false)
    private String title;

    @Column(name = "body_markdown", nullable = false)
    private String bodyMarkdown;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    protected ContentSection() {
    }

    public Long getId() {
        return id;
    }

    public Long getProjectId() {
        return projectId;
    }

    public Long getBlogPostId() {
        return blogPostId;
    }

    public Long getProfileId() {
        return profileId;
    }

    public String getTitle() {
        return title;
    }

    public String getBodyMarkdown() {
        return bodyMarkdown;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }
}
