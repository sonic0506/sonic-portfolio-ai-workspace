package dev.portfolio.portfolio_api.project;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "project")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String summary;

    private String organization;

    private String position;

    private Integer contribution;

    @Column(name = "contribution_note")
    private String contributionNote;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end")
    private LocalDate periodEnd;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @Column(nullable = false)
    private boolean featured;

    @Column(nullable = false)
    private boolean published;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "github_url")
    private String githubUrl;

    @Column(name = "service_url")
    private String serviceUrl;

    /** Admin only. Never exposed publicly or indexed. */
    @Column(name = "admin_note")
    private String adminNote;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private Instant updatedAt;

    protected Project() {
    }

    public Long getId() { return id; }
    public String getSlug() { return slug; }
    public String getTitle() { return title; }
    public String getSummary() { return summary; }
    public String getOrganization() { return organization; }
    public String getPosition() { return position; }
    public Integer getContribution() { return contribution; }
    public String getContributionNote() { return contributionNote; }
    public LocalDate getPeriodStart() { return periodStart; }
    public LocalDate getPeriodEnd() { return periodEnd; }
    public String getThumbnailUrl() { return thumbnailUrl; }
    public boolean isFeatured() { return featured; }
    public boolean isPublished() { return published; }
    public Instant getPublishedAt() { return publishedAt; }
    public int getDisplayOrder() { return displayOrder; }
    public String getGithubUrl() { return githubUrl; }
    public String getServiceUrl() { return serviceUrl; }
    public String getAdminNote() { return adminNote; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
