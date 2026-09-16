package dev.portfolio.portfolio_api.skill;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SkillRepository extends JpaRepository<Skill, Long> {

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);
}
