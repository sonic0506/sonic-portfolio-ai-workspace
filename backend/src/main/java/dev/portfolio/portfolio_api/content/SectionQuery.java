package dev.portfolio.portfolio_api.content;

import com.querydsl.core.types.dsl.NumberPath;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class SectionQuery {

    private final JPAQueryFactory queryFactory;

    public SectionQuery(JPAQueryFactory queryFactory) {
        this.queryFactory = queryFactory;
    }

    public List<SectionResponse> forProject(long projectId) {
        return find(QContentSection.contentSection.projectId, projectId);
    }

    public List<SectionResponse> forBlogPost(long blogPostId) {
        return find(QContentSection.contentSection.blogPostId, blogPostId);
    }

    public List<SectionResponse> forProfile(long profileId) {
        return find(QContentSection.contentSection.profileId, profileId);
    }

    private List<SectionResponse> find(NumberPath<Long> owner, long ownerId) {
        QContentSection section = QContentSection.contentSection;
        return queryFactory.selectFrom(section)
                .where(owner.eq(ownerId))
                .orderBy(section.displayOrder.asc(), section.id.asc())
                .fetch()
                .stream()
                .map(SectionResponse::from)
                .toList();
    }
}
