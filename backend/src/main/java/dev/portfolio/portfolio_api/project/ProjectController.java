package dev.portfolio.portfolio_api.project;

import dev.portfolio.portfolio_api.project.ProjectResponses.ProjectDetail;
import dev.portfolio.portfolio_api.project.ProjectResponses.ProjectList;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectQueryService projects;

    public ProjectController(ProjectQueryService projects) {
        this.projects = projects;
    }

    @GetMapping
    public ProjectList list() {
        return projects.list();
    }

    @GetMapping("/{slug}")
    public ProjectDetail detail(@PathVariable String slug) {
        return projects.detail(slug);
    }
}
