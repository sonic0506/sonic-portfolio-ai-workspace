package dev.portfolio.portfolio_api.project;

import com.querydsl.jpa.impl.JPAQueryFactory;
import dev.portfolio.portfolio_api.content.SectionQuery;
import dev.portfolio.portfolio_api.content.SectionWriter;
import dev.portfolio.portfolio_api.project.ProjectAdminResponses.AdminProjectDetail;
import dev.portfolio.portfolio_api.project.ProjectAdminResponses.AdminProjectItem;
import dev.portfolio.portfolio_api.skill.SkillRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.Clock;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class ProjectAdminService {

    private static final QProject project = QProject.project;

    private final ProjectRepository projects;
    private final SkillRepository skills;
    private final JPAQueryFactory queryFactory;
    private final JdbcTemplate jdbc;
    private final SectionWriter sectionWriter;
    private final SectionQuery sectionQuery;
    private final Clock clock = Clock.systemUTC();

    @PersistenceContext
    private EntityManager entityManager;

    public ProjectAdminService(ProjectRepository projects, SkillRepository skills, JPAQueryFactory queryFactory,
                               JdbcTemplate jdbc, SectionWriter sectionWriter, SectionQuery sectionQuery) {
        this.projects = projects;
        this.skills = skills;
        this.queryFactory = queryFactory;
        this.jdbc = jdbc;
        this.sectionWriter = sectionWriter;
        this.sectionQuery = sectionQuery;
    }

    @Transactional(readOnly = true)
    public List<AdminProjectItem> list() {
        return queryFactory.selectFrom(project)
                .orderBy(project.displayOrder.asc(), project.periodStart.desc(), project.id.desc())
                .fetch()
                .stream()
                .map(p -> new AdminProjectItem(p.getId(), p.getSlug(), p.getTitle(), p.isFeatured(),
                        p.isPublished(), p.getDisplayOrder(), p.getPeriodStart(), p.getPeriodEnd(),
                        p.getPublishedAt(), p.getUpdatedAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminProjectDetail get(long id) {
        return toDetail(find(id));
    }

    public AdminProjectDetail create(ProjectAdminRequest request) {
        validate(request);
        if (projects.existsBySlug(request.slug())) {
            throw conflict("project slug already exists");
        }
        Project saved = projects.saveAndFlush(Project.create(request, Instant.now(clock)));
        entityManager.refresh(saved); // load DB-generated created_at
        replaceChildren(saved.getId(), request);
        return toDetail(saved);
    }

    public AdminProjectDetail update(long id, ProjectAdminRequest request) {
        Project existing = find(id);
        validate(request);
        if (projects.existsBySlugAndIdNot(request.slug(), id)) {
            throw conflict("project slug already exists");
        }
        existing.apply(request, Instant.now(clock));
        projects.saveAndFlush(existing);
        replaceChildren(id, request);
        return toDetail(existing);
    }

    /** Highlights, skill links and sections are removed by FK cascade. */
    public void delete(long id) {
        projects.delete(find(id));
        projects.flush();
    }

    private void validate(ProjectAdminRequest request) {
        if (request.periodEnd() != null && request.periodEnd().isBefore(request.periodStart())) {
            throw badRequest("periodEnd must not be before periodStart");
        }
        var distinct = new HashSet<>(request.skillIds());
        if (distinct.size() != request.skillIds().size()) {
            throw badRequest("skillIds must not contain duplicates");
        }
        if (!distinct.isEmpty() && skills.findAllById(distinct).size() != distinct.size()) {
            throw badRequest("skillIds contain an unknown skill");
        }
    }

    private void replaceChildren(long projectId, ProjectAdminRequest request) {
        jdbc.update("delete from project_highlight where project_id = ?", projectId);
        for (int i = 0; i < request.highlights().size(); i++) {
            jdbc.update("insert into project_highlight (project_id, content, display_order) values (?, ?, ?)",
                    projectId, request.highlights().get(i).trim(), i);
        }
        jdbc.update("delete from project_skill where project_id = ?", projectId);
        for (int i = 0; i < request.skillIds().size(); i++) {
            jdbc.update("insert into project_skill (project_id, skill_id, display_order) values (?, ?, ?)",
                    projectId, request.skillIds().get(i), i);
        }
        sectionWriter.replace(SectionWriter.Owner.PROJECT, projectId, request.sections());
    }

    private AdminProjectDetail toDetail(Project p) {
        List<String> highlights = jdbc.queryForList(
                "select content from project_highlight where project_id = ? order by display_order, id",
                String.class, p.getId());
        List<Long> skillIds = jdbc.queryForList(
                "select skill_id from project_skill where project_id = ? order by display_order, skill_id",
                Long.class, p.getId());
        return new AdminProjectDetail(p.getId(), p.getSlug(), p.getTitle(), p.getSummary(),
                p.getOrganization(), p.getPosition(), p.getContribution(), p.getContributionNote(),
                p.getPeriodStart(), p.getPeriodEnd(), p.getThumbnailUrl(), p.getGithubUrl(), p.getServiceUrl(),
                p.isFeatured(), p.isPublished(), p.getDisplayOrder(), p.getPublishedAt(),
                p.getAdminNote(), p.getCreatedAt(), p.getUpdatedAt(),
                highlights, skillIds, sectionQuery.forProject(p.getId()));
    }

    private Project find(long id) {
        return projects.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "project not found"));
    }

    private static ResponseStatusException badRequest(String reason) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, reason);
    }

    private static ResponseStatusException conflict(String reason) {
        return new ResponseStatusException(HttpStatus.CONFLICT, reason);
    }
}
