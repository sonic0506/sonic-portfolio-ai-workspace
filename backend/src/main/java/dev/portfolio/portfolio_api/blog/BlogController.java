package dev.portfolio.portfolio_api.blog;

import dev.portfolio.portfolio_api.blog.BlogResponses.BlogPostDetail;
import dev.portfolio.portfolio_api.blog.BlogResponses.BlogPostPage;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/blog/posts")
public class BlogController {

    private final BlogQueryService blog;

    public BlogController(BlogQueryService blog) {
        this.blog = blog;
    }

    /** size is clamped to 1..50; category/tag filter by code and combine with AND. */
    @GetMapping
    public BlogPostPage list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "" + BlogQueryService.DEFAULT_SIZE) int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String tag) {
        return blog.list(page, size, category, tag);
    }

    @GetMapping("/{slug}")
    public BlogPostDetail detail(@PathVariable String slug) {
        return blog.detail(slug);
    }
}
