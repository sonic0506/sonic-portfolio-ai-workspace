package dev.portfolio.portfolio_api.profile;

import static java.util.stream.Collectors.groupingBy;
import static java.util.stream.Collectors.mapping;
import static java.util.stream.Collectors.toList;

import com.querydsl.jpa.impl.JPAQueryFactory;
import dev.portfolio.portfolio_api.content.SectionQuery;
import dev.portfolio.portfolio_api.profile.ProfileResponses.CareerResponse;
import dev.portfolio.portfolio_api.profile.ProfileResponses.ProfileDetail;
import dev.portfolio.portfolio_api.profile.ProfileResponses.SkillGroupResponse;
import dev.portfolio.portfolio_api.skill.QSkill;
import dev.portfolio.portfolio_api.skill.SkillResponse;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class ProfileQueryService {

    private static final QProfile profile = QProfile.profile;
    private static final QCareer career = QCareer.career;
    private static final QProfileSkill profileSkill = QProfileSkill.profileSkill;
    private static final QSkill skill = QSkill.skill;

    private final JPAQueryFactory queryFactory;
    private final SectionQuery sectionQuery;

    public ProfileQueryService(JPAQueryFactory queryFactory, SectionQuery sectionQuery) {
        this.queryFactory = queryFactory;
        this.sectionQuery = sectionQuery;
    }

    /** MVP has a single profile row; the lowest id is the one shown. */
    public ProfileDetail get() {
        Profile p = queryFactory.selectFrom(profile)
                .orderBy(profile.id.asc())
                .fetchFirst();
        if (p == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "profile not found");
        }

        List<CareerResponse> careers = queryFactory.selectFrom(career)
                .where(career.profileId.eq(p.getId()))
                .orderBy(career.displayOrder.asc(), career.periodStart.desc(), career.id.asc())
                .fetch()
                .stream()
                .map(c -> new CareerResponse(
                        c.getCompany(), c.getRole(), c.getPeriodStart(), c.getPeriodEnd(), c.getDescription()))
                .toList();

        Map<SkillGroup, List<SkillResponse>> byGroup = queryFactory.select(profileSkill.skillGroup, skill)
                .from(profileSkill, skill)
                .where(profileSkill.skillId.eq(skill.id), profileSkill.profileId.eq(p.getId()))
                .orderBy(profileSkill.displayOrder.asc(), skill.code.asc())
                .fetch()
                .stream()
                .collect(groupingBy(t -> SkillGroup.valueOf(t.get(profileSkill.skillGroup)),
                        mapping(t -> SkillResponse.from(t.get(skill)), toList())));
        List<SkillGroupResponse> skillGroups = Arrays.stream(SkillGroup.values())
                .filter(byGroup::containsKey)
                .map(g -> new SkillGroupResponse(g, byGroup.get(g)))
                .toList();

        return new ProfileDetail(
                p.getHeadline(), p.getShortBio(), p.getImageUrl(), p.getGithubUrl(), p.getEmail(),
                careers, skillGroups, sectionQuery.forProfile(p.getId()));
    }
}
