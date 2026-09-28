package dev.portfolio.portfolio_api.blog;

import dev.portfolio.portfolio_api.blog.TaxonomyAdmin.CategoryRequest;
import dev.portfolio.portfolio_api.blog.TaxonomyAdmin.CategoryResponse;
import dev.portfolio.portfolio_api.blog.TaxonomyAdmin.TagRequest;
import dev.portfolio.portfolio_api.blog.TaxonomyAdmin.TagResponse;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class TaxonomyAdminService {

    private final CategoryRepository categories;
    private final TagRepository tags;
    private final JdbcTemplate jdbc;

    public TaxonomyAdminService(CategoryRepository categories, TagRepository tags, JdbcTemplate jdbc) {
        this.categories = categories;
        this.tags = tags;
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> listCategories() {
        return categories.findAllByOrderByDisplayOrderAscCodeAsc().stream().map(CategoryResponse::from).toList();
    }

    public CategoryResponse createCategory(CategoryRequest r) {
        if (categories.existsByCode(r.code())) {
            throw conflict("category code already exists");
        }
        return CategoryResponse.from(categories.saveAndFlush(new Category(r.code(), r.name().trim(), r.displayOrder(), r.color())));
    }

    public CategoryResponse updateCategory(long id, CategoryRequest r) {
        Category category = categories.findById(id).orElseThrow(() -> notFound("category"));
        if (categories.existsByCodeAndIdNot(r.code(), id)) {
            throw conflict("category code already exists");
        }
        category.update(r.code(), r.name().trim(), r.displayOrder(), r.color());
        return CategoryResponse.from(categories.saveAndFlush(category));
    }

    /** Categories in use cannot be deleted (FK on delete restrict). */
    public void deleteCategory(long id) {
        Category category = categories.findById(id).orElseThrow(() -> notFound("category"));
        Integer used = jdbc.queryForObject(
                "select count(*) from blog_post where category_id = ?", Integer.class, id);
        if (used != null && used > 0) {
            throw conflict("category is used by " + used + " blog post(s)");
        }
        categories.delete(category);
        categories.flush();
    }

    @Transactional(readOnly = true)
    public List<TagResponse> listTags() {
        return tags.findAllByOrderByCodeAsc().stream().map(TagResponse::from).toList();
    }

    public TagResponse createTag(TagRequest r) {
        if (tags.existsByCode(r.code())) {
            throw conflict("tag code already exists");
        }
        return TagResponse.from(tags.saveAndFlush(new Tag(r.code(), r.name().trim())));
    }

    public TagResponse updateTag(long id, TagRequest r) {
        Tag tag = tags.findById(id).orElseThrow(() -> notFound("tag"));
        if (tags.existsByCodeAndIdNot(r.code(), id)) {
            throw conflict("tag code already exists");
        }
        tag.update(r.code(), r.name().trim());
        return TagResponse.from(tags.saveAndFlush(tag));
    }

    /** Deleting a tag also removes it from posts (FK on delete cascade). */
    public void deleteTag(long id) {
        tags.delete(tags.findById(id).orElseThrow(() -> notFound("tag")));
        tags.flush();
    }

    private static ResponseStatusException notFound(String what) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, what + " not found");
    }

    private static ResponseStatusException conflict(String reason) {
        return new ResponseStatusException(HttpStatus.CONFLICT, reason);
    }
}
