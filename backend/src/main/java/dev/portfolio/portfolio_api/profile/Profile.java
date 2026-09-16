package dev.portfolio.portfolio_api.profile;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "profile")
public class Profile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String headline;

    @Column(name = "short_bio", nullable = false)
    private String shortBio;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "github_url")
    private String githubUrl;

    private String email;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private Instant updatedAt;

    protected Profile() {
    }

    public Long getId() { return id; }
    public String getHeadline() { return headline; }
    public String getShortBio() { return shortBio; }
    public String getImageUrl() { return imageUrl; }
    public String getGithubUrl() { return githubUrl; }
    public String getEmail() { return email; }
    public Instant getUpdatedAt() { return updatedAt; }
}
