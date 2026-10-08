package dev.portfolio.portfolio_api.profile;

import dev.portfolio.portfolio_api.content.IdChecks;
import dev.portfolio.portfolio_api.content.IdChecks.RefTable;
import dev.portfolio.portfolio_api.content.SectionQuery;
import dev.portfolio.portfolio_api.content.SectionWriter;
import dev.portfolio.portfolio_api.profile.ProfileAdminRequest.AchievementRequest;
import dev.portfolio.portfolio_api.profile.ProfileAdminRequest.CareerRequest;
import dev.portfolio.portfolio_api.profile.ProfileAdminRequest.SkillEntry;
import dev.portfolio.portfolio_api.profile.ProfileAdminResponses.AdminProfileDetail;
import dev.portfolio.portfolio_api.rag.DocumentProjector;
import java.sql.Date;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class ProfileAdminService {

    private final ProfileRepository profiles;
    private final JdbcTemplate jdbc;
    private final IdChecks idChecks;
    private final SectionWriter sectionWriter;
    private final SectionQuery sectionQuery;
    private final DocumentProjector projector;
    private final Clock clock = Clock.systemUTC();

    public ProfileAdminService(ProfileRepository profiles, JdbcTemplate jdbc, IdChecks idChecks,
                               SectionWriter sectionWriter, SectionQuery sectionQuery,
                               DocumentProjector projector) {
        this.profiles = profiles;
        this.jdbc = jdbc;
        this.idChecks = idChecks;
        this.sectionWriter = sectionWriter;
        this.sectionQuery = sectionQuery;
        this.projector = projector;
    }

    @Transactional(readOnly = true)
    public AdminProfileDetail get() {
        return toDetail(profiles.findFirstByOrderByIdAsc()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "profile not found")));
    }

    /** Creates the profile on first save, replaces it afterwards. */
    public AdminProfileDetail save(ProfileAdminRequest request) {
        validate(request);
        Instant now = Instant.now(clock);
        Profile profile = profiles.findFirstByOrderByIdAsc()
                .map(existing -> {
                    existing.apply(request, now);
                    return existing;
                })
                .orElseGet(() -> Profile.create(request, now));
        profiles.saveAndFlush(profile);
        replaceChildren(profile.getId(), request);
        projector.projectProfile(profile.getId());
        return toDetail(profile);
    }

    private void validate(ProfileAdminRequest request) {
        List<Long> projectIds = new ArrayList<>();
        for (CareerRequest c : request.careers()) {
            if (c.periodEnd() != null && c.periodEnd().isBefore(c.periodStart())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "career periodEnd must not be before periodStart");
            }
            for (AchievementRequest a : c.achievementsOrEmpty()) {
                if (a.periodEnd() != null && a.periodEnd().isBefore(a.periodStart())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "achievement periodEnd must not be before periodStart");
                }
                if (a.projectId() != null && !projectIds.contains(a.projectId())) {
                    projectIds.add(a.projectId());
                }
            }
        }
        idChecks.requireExisting(RefTable.PROJECT, "careers.achievements.projectId", projectIds);
        idChecks.requireExisting(RefTable.SKILL, "skills.skillId",
                request.skills().stream().map(SkillEntry::skillId).toList());
    }

    private void replaceChildren(long profileId, ProfileAdminRequest request) {
        // Achievements go with their career (on delete cascade).
        jdbc.update("delete from career where profile_id = ?", profileId);
        for (int i = 0; i < request.careers().size(); i++) {
            CareerRequest c = request.careers().get(i);
            Long careerId = jdbc.queryForObject("""
                    insert into career (profile_id, company, role, period_start, period_end, description,
                                        employment_type, position, logo_url, display_order)
                    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) returning id""", Long.class,
                    profileId, c.company().trim(), blankToNull(c.role()), Date.valueOf(c.periodStart()),
                    date(c.periodEnd()), blankToNull(c.description()), blankToNull(c.employmentType()),
                    blankToNull(c.position()), blankToNull(c.logoUrl()), i);
            List<AchievementRequest> achievements = c.achievementsOrEmpty();
            for (int j = 0; j < achievements.size(); j++) {
                AchievementRequest a = achievements.get(j);
                jdbc.update("""
                        insert into career_achievement (career_id, title, period_start, period_end, job, position,
                                                        body_markdown, project_id, display_order)
                        values (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                        careerId, a.title().trim(), Date.valueOf(a.periodStart()), date(a.periodEnd()),
                        blankToNull(a.job()), blankToNull(a.position()), blankToNull(a.bodyMarkdown()),
                        a.projectId(), j);
            }
        }
        jdbc.update("delete from profile_skill where profile_id = ?", profileId);
        for (int i = 0; i < request.skills().size(); i++) {
            SkillEntry s = request.skills().get(i);
            jdbc.update("insert into profile_skill (profile_id, skill_id, skill_group, display_order) values (?, ?, ?, ?)",
                    profileId, s.skillId(), s.group(), i);
        }
        sectionWriter.replace(SectionWriter.Owner.PROFILE, profileId, request.sections());
    }

    private AdminProfileDetail toDetail(Profile p) {
        List<CareerRequest> careers = jdbc.query("""
                        select id, company, role, period_start, period_end, description, employment_type, position,
                               logo_url
                        from career where profile_id = ? order by display_order, id""",
                (rs, n) -> new CareerRequest(rs.getString("company"), rs.getString("role"),
                        rs.getDate("period_start").toLocalDate(), localDate(rs.getDate("period_end")),
                        rs.getString("description"), rs.getString("employment_type"), rs.getString("position"),
                        achievements(rs.getLong("id")), rs.getString("logo_url")),
                p.getId());
        List<SkillEntry> skills = jdbc.query("""
                        select skill_id, skill_group from profile_skill
                        where profile_id = ? order by display_order, skill_id""",
                (rs, n) -> new SkillEntry(rs.getLong("skill_id"), rs.getString("skill_group")),
                p.getId());
        return new AdminProfileDetail(p.getId(), p.getHeadline(), p.getShortBio(), p.getImageUrl(),
                p.getGithubUrl(), p.getEmail(), p.getUpdatedAt(), careers, skills, sectionQuery.forProfile(p.getId()));
    }

    private List<AchievementRequest> achievements(long careerId) {
        return jdbc.query("""
                        select title, period_start, period_end, job, position, body_markdown, project_id
                        from career_achievement where career_id = ? order by display_order, id""",
                (rs, n) -> new AchievementRequest(rs.getString("title"), rs.getDate("period_start").toLocalDate(),
                        localDate(rs.getDate("period_end")), rs.getString("job"), rs.getString("position"),
                        rs.getString("body_markdown"), rs.getObject("project_id", Long.class)),
                careerId);
    }

    private static Date date(LocalDate value) {
        return value == null ? null : Date.valueOf(value);
    }

    private static LocalDate localDate(Date value) {
        return value == null ? null : value.toLocalDate();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
