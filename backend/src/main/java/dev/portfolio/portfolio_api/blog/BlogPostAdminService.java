package dev.portfolio.portfolio_api.blog;

import com.querydsl.jpa.impl.JPAQueryFactory;
import dev.portfolio.portfolio_api.blog.BlogPostAdminResponses.AdminBlogPostDetail;
import dev.portfolio.portfolio_api.blog.BlogPostAdminResponses.AdminBlogPostItem;
import dev.portfolio.portfolio_api.content.IdChecks;
import dev.portfolio.portfolio_api.content.IdChecks.RefTable;
import dev.portfolio.portfolio_api.content.SectionQuery;
import dev.portfolio.portfolio_api.content.SectionWriter;
import dev.portfolio.portfolio_api.rag.DocumentProjector;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class BlogPostAdminService {

    private static final QBlogPost post = QBlogPost.blogPost;

    private final BlogPostRepository posts;
    private final JPAQueryFactory queryFactory;
    private final JdbcTemplate jdbc;
    private final IdChecks idChecks;
    private final SectionWriter sectionWriter;
    private final SectionQuery sectionQuery;
    private final DocumentProjector projector;
    private final Clock clock = Clock.systemUTC();

    @PersistenceContext
    private EntityManager entityManager;

    public BlogPostAdminService(BlogPostRepository posts, JPAQueryFactory queryFactory, JdbcTemplate jdbc,
                                IdChecks idChecks, SectionWriter sectionWriter, SectionQuery sectionQuery,
                                DocumentProjector projector) {
        this.posts = posts;
        this.queryFactory = queryFactory;
        this.jdbc = jdbc;
        this.idChecks = idChecks;
        this.sectionWriter = sectionWriter;
        this.sectionQuery = sectionQuery;
        this.projector = projector;
    }

    /** Drafts (no published_at) first, then newest. */
    @Transactional(readOnly = true)
    public List<AdminBlogPostItem> list() {
        return queryFactory.selectFrom(post)
                .orderBy(post.publishedAt.desc().nullsFirst(), post.id.desc())
                .fetch()
                .stream()
                .map(p -> new AdminBlogPostItem(p.getId(), p.getSlug(), p.getTitle(), p.isPublished(),
                        p.getPublishedAt(), p.getUpdatedAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminBlogPostDetail get(long id) {
        return toDetail(find(id));
    }

    public AdminBlogPostDetail create(BlogPostAdminRequest request) {
        validate(request);
        if (posts.existsBySlug(request.slug())) {
            throw conflict();
        }
        BlogPost saved = posts.saveAndFlush(BlogPost.create(request, Instant.now(clock)));
        entityManager.refresh(saved); // load DB-generated created_at
        replaceChildren(saved.getId(), request);
        projector.projectBlogPost(saved.getId());
        return toDetail(saved);
    }

    public AdminBlogPostDetail update(long id, BlogPostAdminRequest request) {
        BlogPost existing = find(id);
        validate(request);
        if (posts.existsBySlugAndIdNot(request.slug(), id)) {
            throw conflict();
        }
        existing.apply(request, Instant.now(clock));
        posts.saveAndFlush(existing);
        replaceChildren(id, request);
        projector.projectBlogPost(id);
        return toDetail(existing);
    }

    /** Category/tag/skill links and sections are removed by FK cascade. */
    public void delete(long id) {
        posts.delete(find(id));
        posts.flush();
        projector.remove(DocumentProjector.Type.BLOG, id);
    }

    private void validate(BlogPostAdminRequest request) {
        idChecks.requireExisting(RefTable.CATEGORY, "categoryIds", request.categoryIds());
        idChecks.requireExisting(RefTable.TAG, "tagIds", request.tagIds());
        idChecks.requireExisting(RefTable.SKILL, "skillIds", request.skillIds());
    }

    private void replaceChildren(long postId, BlogPostAdminRequest request) {
        replaceLinks("blog_category", "category_id", postId, request.categoryIds());
        replaceLinks("blog_tag", "tag_id", postId, request.tagIds());
        replaceLinks("blog_skill", "skill_id", postId, request.skillIds());
        sectionWriter.replace(SectionWriter.Owner.BLOG_POST, postId, request.sections());
    }

    private void replaceLinks(String table, String column, long postId, List<Long> ids) {
        jdbc.update("delete from " + table + " where blog_post_id = ?", postId);
        for (Long id : ids) {
            jdbc.update("insert into " + table + " (blog_post_id, " + column + ") values (?, ?)", postId, id);
        }
    }

    private AdminBlogPostDetail toDetail(BlogPost p) {
        return new AdminBlogPostDetail(p.getId(), p.getSlug(), p.getTitle(), p.getSummary(), p.getThumbnailUrl(),
                p.isPublished(), p.getPublishedAt(), p.getAdminNote(), p.getCreatedAt(), p.getUpdatedAt(),
                linkedIds("blog_category", "category_id", p.getId()),
                linkedIds("blog_tag", "tag_id", p.getId()),
                linkedIds("blog_skill", "skill_id", p.getId()),
                sectionQuery.forBlogPost(p.getId()));
    }

    private List<Long> linkedIds(String table, String column, long postId) {
        return jdbc.queryForList("select " + column + " from " + table + " where blog_post_id = ? order by "
                + column, Long.class, postId);
    }

    private BlogPost find(long id) {
        return posts.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "blog post not found"));
    }

    private static ResponseStatusException conflict() {
        return new ResponseStatusException(HttpStatus.CONFLICT, "blog post slug already exists");
    }
}
