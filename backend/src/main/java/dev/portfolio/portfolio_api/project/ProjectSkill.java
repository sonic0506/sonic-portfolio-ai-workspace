package dev.portfolio.portfolio_api.project;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "project_skill")
@IdClass(ProjectSkill.Key.class)
public class ProjectSkill {

    @Id
    @Column(name = "project_id")
    private Long projectId;

    @Id
    @Column(name = "skill_id")
    private Long skillId;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    protected ProjectSkill() {
    }

    public Long getProjectId() { return projectId; }
    public Long getSkillId() { return skillId; }
    public int getDisplayOrder() { return displayOrder; }

    public static class Key implements Serializable {
        private Long projectId;
        private Long skillId;

        public Key() {
        }

        @Override
        public boolean equals(Object o) {
            return o instanceof Key k && Objects.equals(projectId, k.projectId) && Objects.equals(skillId, k.skillId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(projectId, skillId);
        }
    }
}
