package dev.portfolio.portfolio_api.skill;

import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class SkillAdminService {

    private final SkillRepository skills;
    private final JdbcTemplate jdbc;

    public SkillAdminService(SkillRepository skills, JdbcTemplate jdbc) {
        this.skills = skills;
        this.jdbc = jdbc;
    }

    public SkillResponse create(SkillRequest request) {
        if (skills.existsByCode(request.code())) {
            throw conflict("skill code already exists");
        }
        Skill skill = skills.saveAndFlush(new Skill(request.code(), request.name().trim(), request.normalizedIconKey()));
        return SkillResponse.from(skill);
    }

    public SkillResponse update(long id, SkillRequest request) {
        Skill skill = skills.findById(id).orElseThrow(SkillAdminService::notFound);
        if (skills.existsByCodeAndIdNot(request.code(), id)) {
            throw conflict("skill code already exists");
        }
        skill.update(request.code(), request.name().trim(), request.normalizedIconKey());
        return SkillResponse.from(skills.saveAndFlush(skill));
    }

    /** Referenced skills cannot be deleted (FK on delete restrict); remove the references first. */
    public void delete(long id) {
        Skill skill = skills.findById(id).orElseThrow(SkillAdminService::notFound);
        Integer references = jdbc.queryForObject("""
                select (select count(*) from project_skill where skill_id = ?)
                     + (select count(*) from blog_skill where skill_id = ?)
                     + (select count(*) from profile_skill where skill_id = ?)""",
                Integer.class, id, id, id);
        if (references != null && references > 0) {
            throw conflict("skill is used by " + references + " item(s)");
        }
        skills.delete(skill);
        skills.flush();
    }

    private static ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "skill not found");
    }

    private static ResponseStatusException conflict(String reason) {
        return new ResponseStatusException(HttpStatus.CONFLICT, reason);
    }
}
