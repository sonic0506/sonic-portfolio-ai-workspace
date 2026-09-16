package dev.portfolio.portfolio_api.blog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "blog_tag")
@IdClass(BlogTag.Key.class)
public class BlogTag {

    @Id
    @Column(name = "blog_post_id")
    private Long blogPostId;

    @Id
    @Column(name = "tag_id")
    private Long tagId;

    protected BlogTag() {
    }

    public Long getBlogPostId() { return blogPostId; }
    public Long getTagId() { return tagId; }

    public static class Key implements Serializable {
        private Long blogPostId;
        private Long tagId;

        public Key() {
        }

        @Override
        public boolean equals(Object o) {
            return o instanceof Key k && Objects.equals(blogPostId, k.blogPostId) && Objects.equals(tagId, k.tagId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(blogPostId, tagId);
        }
    }
}
