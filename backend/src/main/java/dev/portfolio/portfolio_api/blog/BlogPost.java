package dev.portfolio.portfolio_api.blog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "blog_post")
public class BlogPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private String title;

    private String summary;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @Column(nullable = false)
    private boolean published;

    @Column(name = "published_at")
    private Instant publishedAt;

    /** Admin only. Never exposed publicly or indexed. */
    @Column(name = "admin_note")
    private String adminNote;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected BlogPost() {
    }

    static BlogPost create(BlogPostAdminRequest request, Instant now) {
        BlogPost post = new BlogPost();
        post.apply(request, now);
        return post;
    }

    /** Same publish rule as Project: first publish stamps published_at, unpublishing keeps it. */
    void apply(BlogPostAdminRequest r, Instant now) {
        this.slug = r.slug();
        this.title = r.title().trim();
        this.summary = blankToNull(r.summary());
        this.thumbnailUrl = blankToNull(r.thumbnailUrl());
        if (r.published() && this.publishedAt == null) {
            this.publishedAt = now;
        }
        this.published = r.published();
        this.adminNote = blankToNull(r.adminNote());
        this.updatedAt = now;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public Long getId() { return id; }
    public String getSlug() { return slug; }
    public String getTitle() { return title; }
    public String getSummary() { return summary; }
    public String getThumbnailUrl() { return thumbnailUrl; }
    public boolean isPublished() { return published; }
    public Instant getPublishedAt() { return publishedAt; }
    public String getAdminNote() { return adminNote; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
