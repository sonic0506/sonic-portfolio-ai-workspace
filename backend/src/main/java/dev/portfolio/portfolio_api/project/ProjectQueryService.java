package dev.portfolio.portfolio_api.project;

import static java.util.stream.Collectors.groupingBy;
import static java.util.stream.Collectors.mapping;
import static java.util.stream.Collectors.toList;

import com.querydsl.core.Tuple;
import com.querydsl.jpa.impl.JPAQueryFactory;
import dev.portfolio.portfolio_api.content.DocumentReferences;
import dev.portfolio.portfolio_api.content.DocumentReferences.RefType;
import dev.portfolio.portfolio_api.content.SectionQuery;
import dev.portfolio.portfolio_api.project.ProjectResponses.ProjectDetail;
import dev.portfolio.portfolio_api.project.ProjectResponses.FeaturedProject;
import dev.portfolio.portfolio_api.project.ProjectResponses.ProjectItem;
import dev.portfolio.portfolio_api.project.ProjectResponses.ProjectList;
import dev.portfolio.portfolio_api.skill.QSkill;
import dev.portfolio.portfolio_api.skill.SkillResponse;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class ProjectQueryService {

    private static final QProject project = QProject.project;
    private static final QProjectHighlight highlight = QProjectHighlight.projectHighlight;
    private static final QProjectSkill projectSkill = QProjectSkill.projectSkill;
    private static final QSkill skill = QSkill.skill;

    private final JPAQueryFactory queryFactory;
    private final SectionQuery sectionQuery;
    private final DocumentReferences references;

    public ProjectQueryService(JPAQueryFactory queryFactory, SectionQuery sectionQuery,
                               DocumentReferences references) {
        this.queryFactory = queryFactory;
        this.sectionQuery = sectionQuery;
        this.references = references;
    }

    public ProjectList list() {
        List<Project> projects = queryFactory.selectFrom(project)
                .where(project.published.isTrue())
                .orderBy(project.displayOrder.asc(), project.periodStart.desc(), project.id.desc())
                .fetch();
        List<Long> ids = projects.stream().map(Project::getId).toList();
        Map<Long, List<String>> highlights = highlightsByProject(ids);
        Map<Long, List<SkillResponse>> skills = skillsByProject(ids);

        List<FeaturedProject> featured = projects.stream()
                .filter(Project::isFeatured)
                .map(p -> new FeaturedProject(
                        p.getSlug(), p.getTitle(), p.getSummary(),
                        highlights.getOrDefault(p.getId(), List.of()),
                        p.getPeriodStart(), p.getPeriodEnd(), p.getPosition(),
                        p.getContribution(), p.getContributionNote(), p.getThumbnailUrl(),
                        skills.getOrDefault(p.getId(), List.of())))
                .toList();
        List<ProjectItem> others = projects.stream()
                .filter(p -> !p.isFeatured())
                .map(p -> new ProjectItem(
                        p.getSlug(), p.getTitle(), p.getSummary(),
                        p.getPeriodStart(), p.getPeriodEnd(), p.getPosition(),
                        p.getContribution(), p.getContributionNote(),
                        skills.getOrDefault(p.getId(), List.of())))
                .toList();
        return new ProjectList(featured, others);
    }

    public ProjectDetail detail(String slug) {
        Project p = queryFactory.selectFrom(project)
                .where(project.slug.eq(slug), project.published.isTrue())
                .fetchOne();
        if (p == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "project not found");
        }
        List<Long> ids = List.of(p.getId());
        return new ProjectDetail(
                p.getSlug(), p.getTitle(), p.getSummary(),
                highlightsByProject(ids).getOrDefault(p.getId(), List.of()),
                p.getOrganization(), p.getPosition(), p.getContribution(), p.getContributionNote(),
                p.getPeriodStart(), p.getPeriodEnd(), p.getThumbnailUrl(),
                p.getGithubUrl(), p.getServiceUrl(),
                skillsByProject(ids).getOrDefault(p.getId(), List.of()),
                sectionQuery.forProject(p.getId()),
                references.publicReferences(RefType.PROJECT, p.getId()),
                references.publicReferencedBy(RefType.PROJECT, p.getId()));
    }

    private Map<Long, List<String>> highlightsByProject(Collection<Long> projectIds) {
        if (projectIds.isEmpty()) {
            return Map.of();
        }
        return queryFactory.selectFrom(highlight)
                .where(highlight.projectId.in(projectIds))
                .orderBy(highlight.displayOrder.asc(), highlight.id.asc())
                .fetch()
                .stream()
                .collect(groupingBy(ProjectHighlight::getProjectId,
                        mapping(ProjectHighlight::getContent, toList())));
    }

    private Map<Long, List<SkillResponse>> skillsByProject(Collection<Long> projectIds) {
        if (projectIds.isEmpty()) {
            return Map.of();
        }
        List<Tuple> rows = queryFactory.select(projectSkill.projectId, skill)
                .from(projectSkill, skill)
                .where(projectSkill.skillId.eq(skill.id), projectSkill.projectId.in(projectIds))
                .orderBy(projectSkill.displayOrder.asc(), skill.code.asc())
                .fetch();
        return rows.stream()
                .collect(groupingBy(t -> t.get(projectSkill.projectId),
                        mapping(t -> SkillResponse.from(t.get(skill)), toList())));
    }
}
