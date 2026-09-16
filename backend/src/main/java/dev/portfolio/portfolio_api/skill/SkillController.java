package dev.portfolio.portfolio_api.skill;

import com.querydsl.jpa.impl.JPAQueryFactory;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/skills")
public class SkillController {

    private final JPAQueryFactory queryFactory;

    public SkillController(JPAQueryFactory queryFactory) {
        this.queryFactory = queryFactory;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<SkillResponse> list() {
        QSkill skill = QSkill.skill;
        return queryFactory.selectFrom(skill)
                .orderBy(skill.code.asc())
                .fetch()
                .stream()
                .map(SkillResponse::from)
                .toList();
    }
}
