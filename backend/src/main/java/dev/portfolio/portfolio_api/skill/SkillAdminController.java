package dev.portfolio.portfolio_api.skill;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Admin writes. Listing reuses the public GET /api/skills. */
@RestController
@RequestMapping("/api/admin/skills")
public class SkillAdminController {

    private final SkillAdminService service;

    public SkillAdminController(SkillAdminService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SkillResponse create(@Valid @RequestBody SkillRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public SkillResponse update(@PathVariable long id, @Valid @RequestBody SkillRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id) {
        service.delete(id);
    }
}
