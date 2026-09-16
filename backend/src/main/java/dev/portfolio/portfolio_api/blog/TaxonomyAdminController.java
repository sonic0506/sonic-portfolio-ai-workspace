package dev.portfolio.portfolio_api.blog;

import dev.portfolio.portfolio_api.blog.TaxonomyAdmin.CategoryRequest;
import dev.portfolio.portfolio_api.blog.TaxonomyAdmin.CategoryResponse;
import dev.portfolio.portfolio_api.blog.TaxonomyAdmin.TagRequest;
import dev.portfolio.portfolio_api.blog.TaxonomyAdmin.TagResponse;
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
@RequestMapping("/api/admin")
public class TaxonomyAdminController {

    private final TaxonomyAdminService service;

    public TaxonomyAdminController(TaxonomyAdminService service) {
        this.service = service;
    }

    @GetMapping("/categories")
    public List<CategoryResponse> listCategories() {
        return service.listCategories();
    }

    @PostMapping("/categories")
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse createCategory(@Valid @RequestBody CategoryRequest request) {
        return service.createCategory(request);
    }

    @PutMapping("/categories/{id}")
    public CategoryResponse updateCategory(@PathVariable long id, @Valid @RequestBody CategoryRequest request) {
        return service.updateCategory(id, request);
    }

    @DeleteMapping("/categories/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCategory(@PathVariable long id) {
        service.deleteCategory(id);
    }

    @GetMapping("/tags")
    public List<TagResponse> listTags() {
        return service.listTags();
    }

    @PostMapping("/tags")
    @ResponseStatus(HttpStatus.CREATED)
    public TagResponse createTag(@Valid @RequestBody TagRequest request) {
        return service.createTag(request);
    }

    @PutMapping("/tags/{id}")
    public TagResponse updateTag(@PathVariable long id, @Valid @RequestBody TagRequest request) {
        return service.updateTag(id, request);
    }

    @DeleteMapping("/tags/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTag(@PathVariable long id) {
        service.deleteTag(id);
    }
}
