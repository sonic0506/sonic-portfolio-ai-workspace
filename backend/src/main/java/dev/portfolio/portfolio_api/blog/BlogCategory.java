package dev.portfolio.portfolio_api.blog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "blog_category")
@IdClass(BlogCategory.Key.class)
public class BlogCategory {

    @Id
    @Column(name = "blog_post_id")
    private Long blogPostId;

    @Id
    @Column(name = "category_id")
    private Long categoryId;

    protected BlogCategory() {
    }

    public Long getBlogPostId() { return blogPostId; }
    public Long getCategoryId() { return categoryId; }

    public static class Key implements Serializable {
        private Long blogPostId;
        private Long categoryId;

        public Key() {
        }

        @Override
        public boolean equals(Object o) {
            return o instanceof Key k && Objects.equals(blogPostId, k.blogPostId) && Objects.equals(categoryId, k.categoryId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(blogPostId, categoryId);
        }
    }
}
