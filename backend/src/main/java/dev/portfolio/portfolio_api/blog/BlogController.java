package dev.portfolio.portfolio_api.blog;

import dev.portfolio.portfolio_api.blog.BlogResponses.BlogPostDetail;
import dev.portfolio.portfolio_api.blog.BlogResponses.BlogPostPage;
import dev.portfolio.portfolio_api.blog.BlogResponses.CategoryCount;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/blog")
public class BlogController {

    private final BlogQueryService blog;

    public BlogController(BlogQueryService blog) {
        this.blog = blog;
    }

    /** size is clamped to 1..50; category/tag filter by code and combine with AND. */
    @GetMapping("/posts")
    public BlogPostPage list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "" + BlogQueryService.DEFAULT_SIZE) int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String tag) {
        return blog.list(page, size, category, tag);
    }

    @GetMapping("/posts/{slug}")
    public BlogPostDetail detail(@PathVariable String slug) {
        return blog.detail(slug);
    }

    /** Categories in display order with their published post counts (0 included). */
    @GetMapping("/categories")
    public List<CategoryCount> categories() {
        return blog.categories();
    }
}
