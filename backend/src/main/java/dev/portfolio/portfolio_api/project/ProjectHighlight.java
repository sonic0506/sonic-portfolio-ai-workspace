package dev.portfolio.portfolio_api.project;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "project_highlight")
public class ProjectHighlight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(nullable = false)
    private String content;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    protected ProjectHighlight() {
    }

    public Long getId() { return id; }
    public Long getProjectId() { return projectId; }
    public String getContent() { return content; }
    public int getDisplayOrder() { return displayOrder; }
}
