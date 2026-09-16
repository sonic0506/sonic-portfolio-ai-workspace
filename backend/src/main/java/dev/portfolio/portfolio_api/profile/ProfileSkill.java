package dev.portfolio.portfolio_api.profile;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "profile_skill")
@IdClass(ProfileSkill.Key.class)
public class ProfileSkill {

    @Id
    @Column(name = "profile_id")
    private Long profileId;

    @Id
    @Column(name = "skill_id")
    private Long skillId;

    /** text + check constraint in the schema; mapped as plain text to keep validation simple. */
    @Column(name = "skill_group", nullable = false)
    private String skillGroup;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    protected ProfileSkill() {
    }

    public Long getProfileId() { return profileId; }
    public Long getSkillId() { return skillId; }
    public SkillGroup getSkillGroup() { return SkillGroup.valueOf(skillGroup); }
    public int getDisplayOrder() { return displayOrder; }

    public static class Key implements Serializable {
        private Long profileId;
        private Long skillId;

        public Key() {
        }

        @Override
        public boolean equals(Object o) {
            return o instanceof Key k && Objects.equals(profileId, k.profileId) && Objects.equals(skillId, k.skillId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(profileId, skillId);
        }
    }
}
