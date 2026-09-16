package dev.portfolio.portfolio_api.blog;

import dev.portfolio.portfolio_api.blog.BlogPostAdminResponses.AdminBlogPostDetail;
import dev.portfolio.portfolio_api.blog.BlogPostAdminResponses.AdminBlogPostItem;
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
@RequestMapping("/api/admin/blog/posts")
public class BlogPostAdminController {

    private final BlogPostAdminService service;

    public BlogPostAdminController(BlogPostAdminService service) {
        this.service = service;
    }

    @GetMapping
    public List<AdminBlogPostItem> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public AdminBlogPostDetail get(@PathVariable long id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdminBlogPostDetail create(@Valid @RequestBody BlogPostAdminRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public AdminBlogPostDetail update(@PathVariable long id, @Valid @RequestBody BlogPostAdminRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id) {
        service.delete(id);
    }
}
