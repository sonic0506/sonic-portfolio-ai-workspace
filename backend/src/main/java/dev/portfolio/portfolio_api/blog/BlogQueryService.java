package dev.portfolio.portfolio_api.blog;

import static java.util.stream.Collectors.groupingBy;
import static java.util.stream.Collectors.mapping;
import static java.util.stream.Collectors.toList;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import dev.portfolio.portfolio_api.blog.BlogResponses.BlogPostDetail;
import dev.portfolio.portfolio_api.blog.BlogResponses.BlogPostItem;
import dev.portfolio.portfolio_api.blog.BlogResponses.BlogPostPage;
import dev.portfolio.portfolio_api.blog.BlogResponses.LabelResponse;
import dev.portfolio.portfolio_api.content.DocumentReferences;
import dev.portfolio.portfolio_api.content.DocumentReferences.RefType;
import dev.portfolio.portfolio_api.content.SectionQuery;
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
public class BlogQueryService {

    static final int DEFAULT_SIZE = 20;
    static final int MAX_SIZE = 50;

    private static final QBlogPost post = QBlogPost.blogPost;
    private static final QBlogCategory blogCategory = QBlogCategory.blogCategory;
    private static final QCategory category = QCategory.category;
    private static final QBlogTag blogTag = QBlogTag.blogTag;
    private static final QTag tag = QTag.tag;
    private static final QBlogSkill blogSkill = QBlogSkill.blogSkill;
    private static final QSkill skill = QSkill.skill;

    private final JPAQueryFactory queryFactory;
    private final SectionQuery sectionQuery;
    private final DocumentReferences references;

    public BlogQueryService(JPAQueryFactory queryFactory, SectionQuery sectionQuery,
                            DocumentReferences references) {
        this.queryFactory = queryFactory;
        this.sectionQuery = sectionQuery;
        this.references = references;
    }

    public BlogPostPage list(int page, int size, String categoryCode, String tagCode) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_SIZE);

        BooleanBuilder where = new BooleanBuilder(post.published.isTrue());
        if (categoryCode != null && !categoryCode.isBlank()) {
            where.and(post.id.in(JPAExpressions.select(blogCategory.blogPostId)
                    .from(blogCategory, category)
                    .where(blogCategory.categoryId.eq(category.id), category.code.eq(categoryCode))));
        }
        if (tagCode != null && !tagCode.isBlank()) {
            where.and(post.id.in(JPAExpressions.select(blogTag.blogPostId)
                    .from(blogTag, tag)
                    .where(blogTag.tagId.eq(tag.id), tag.code.eq(tagCode))));
        }

        Long total = queryFactory.select(post.count()).from(post).where(where).fetchOne();
        List<BlogPost> posts = queryFactory.selectFrom(post)
                .where(where)
                .orderBy(post.publishedAt.desc().nullsLast(), post.id.desc())
                .offset((long) safePage * safeSize)
                .limit(safeSize)
                .fetch();

        List<Long> ids = posts.stream().map(BlogPost::getId).toList();
        Map<Long, List<LabelResponse>> categories = categoriesByPost(ids);
        Map<Long, List<LabelResponse>> tags = tagsByPost(ids);
        Map<Long, List<SkillResponse>> skills = skillsByPost(ids);

        List<BlogPostItem> items = posts.stream()
                .map(p -> new BlogPostItem(
                        p.getSlug(), p.getTitle(), p.getSummary(), p.getThumbnailUrl(),
                        p.getPublishedAt(), p.getUpdatedAt(),
                        categories.getOrDefault(p.getId(), List.of()),
                        tags.getOrDefault(p.getId(), List.of()),
                        skills.getOrDefault(p.getId(), List.of())))
                .toList();
        return new BlogPostPage(items, safePage, safeSize, total == null ? 0 : total);
    }

    public BlogPostDetail detail(String slug) {
        BlogPost p = queryFactory.selectFrom(post)
                .where(post.slug.eq(slug), post.published.isTrue())
                .fetchOne();
        if (p == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "blog post not found");
        }
        List<Long> ids = List.of(p.getId());
        return new BlogPostDetail(
                p.getSlug(), p.getTitle(), p.getSummary(), p.getThumbnailUrl(),
                p.getPublishedAt(), p.getUpdatedAt(),
                categoriesByPost(ids).getOrDefault(p.getId(), List.of()),
                tagsByPost(ids).getOrDefault(p.getId(), List.of()),
                skillsByPost(ids).getOrDefault(p.getId(), List.of()),
                sectionQuery.forBlogPost(p.getId()),
                references.publicReferences(RefType.BLOG, p.getId()),
                references.publicReferencedBy(RefType.BLOG, p.getId()));
    }

    private Map<Long, List<LabelResponse>> categoriesByPost(Collection<Long> postIds) {
        if (postIds.isEmpty()) {
            return Map.of();
        }
        return queryFactory.select(blogCategory.blogPostId, category.code, category.name)
                .from(blogCategory, category)
                .where(blogCategory.categoryId.eq(category.id), blogCategory.blogPostId.in(postIds))
                .orderBy(category.displayOrder.asc(), category.code.asc())
                .fetch()
                .stream()
                .collect(groupingBy(t -> t.get(blogCategory.blogPostId),
                        mapping(t -> new LabelResponse(t.get(category.code), t.get(category.name)), toList())));
    }

    private Map<Long, List<LabelResponse>> tagsByPost(Collection<Long> postIds) {
        if (postIds.isEmpty()) {
            return Map.of();
        }
        return queryFactory.select(blogTag.blogPostId, tag.code, tag.name)
                .from(blogTag, tag)
                .where(blogTag.tagId.eq(tag.id), blogTag.blogPostId.in(postIds))
                .orderBy(tag.code.asc())
                .fetch()
                .stream()
                .collect(groupingBy(t -> t.get(blogTag.blogPostId),
                        mapping(t -> new LabelResponse(t.get(tag.code), t.get(tag.name)), toList())));
    }

    private Map<Long, List<SkillResponse>> skillsByPost(Collection<Long> postIds) {
        if (postIds.isEmpty()) {
            return Map.of();
        }
        return queryFactory.select(blogSkill.blogPostId, skill)
                .from(blogSkill, skill)
                .where(blogSkill.skillId.eq(skill.id), blogSkill.blogPostId.in(postIds))
                .orderBy(skill.code.asc())
                .fetch()
                .stream()
                .collect(groupingBy(t -> t.get(blogSkill.blogPostId),
                        mapping(t -> SkillResponse.from(t.get(skill)), toList())));
    }
}
