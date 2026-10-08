package dev.portfolio.portfolio_api.skill;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "skill")
public class Skill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(name = "icon_key")
    private String iconKey;

    /** Uploaded logo (ADR-0020); when set it wins over the simple-icons iconKey. */
    @Column(name = "icon_url")
    private String iconUrl;

    // DB default now(); the application never writes it.
    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    protected Skill() {
    }

    public Skill(String code, String name, String iconKey, String iconUrl) {
        update(code, name, iconKey, iconUrl);
    }

    public void update(String code, String name, String iconKey, String iconUrl) {
        this.code = code;
        this.name = name;
        this.iconKey = iconKey;
        this.iconUrl = iconUrl;
    }

    public Long getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public String getIconKey() {
        return iconKey;
    }

    public String getIconUrl() {
        return iconUrl;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
