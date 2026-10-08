package dev.portfolio.portfolio_api.profile;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "career")
public class Career {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "profile_id", nullable = false)
    private Long profileId;

    @Column(nullable = false)
    private String company;

    private String role;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    /** null = currently employed. */
    @Column(name = "period_end")
    private LocalDate periodEnd;

    private String description;

    @Column(name = "employment_type")
    private String employmentType;

    /** 직책. role is the job (직무). */
    private String position;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    protected Career() {
    }

    public Long getId() { return id; }
    public Long getProfileId() { return profileId; }
    public String getCompany() { return company; }
    public String getRole() { return role; }
    public LocalDate getPeriodStart() { return periodStart; }
    public LocalDate getPeriodEnd() { return periodEnd; }
    public String getDescription() { return description; }
    public String getEmploymentType() { return employmentType; }
    public String getPosition() { return position; }
    public String getLogoUrl() { return logoUrl; }
    public int getDisplayOrder() { return displayOrder; }
}
