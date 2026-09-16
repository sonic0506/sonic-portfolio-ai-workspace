package dev.portfolio.portfolio_api.project;

import dev.portfolio.portfolio_api.project.ProjectAdminResponses.AdminProjectDetail;
import dev.portfolio.portfolio_api.project.ProjectAdminResponses.AdminProjectItem;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/projects")
public class ProjectAdminController {

    private final ProjectAdminService service;

    public ProjectAdminController(ProjectAdminService service) {
        this.service = service;
    }

    @GetMapping
    public List<AdminProjectItem> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public AdminProjectDetail get(@PathVariable long id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdminProjectDetail create(@Valid @RequestBody ProjectAdminRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public AdminProjectDetail update(@PathVariable long id, @Valid @RequestBody ProjectAdminRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id) {
        service.delete(id);
    }
}
