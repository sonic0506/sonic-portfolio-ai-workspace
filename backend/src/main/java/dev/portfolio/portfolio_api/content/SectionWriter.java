package dev.portfolio.portfolio_api.content;

import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** Replaces all sections of one owner. The owner row must already be flushed. */
@Component
public class SectionWriter {

    public enum Owner {
        PROJECT("project_id"),
        BLOG_POST("blog_post_id"),
        PROFILE("profile_id");

        private final String column;

        Owner(String column) {
            this.column = column;
        }
    }

    private final JdbcTemplate jdbc;

    public SectionWriter(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void replace(Owner owner, long ownerId, List<SectionRequest> sections) {
        jdbc.update("delete from content_section where " + owner.column + " = ?", ownerId);
        for (int i = 0; i < sections.size(); i++) {
            SectionRequest section = sections.get(i);
            jdbc.update("insert into content_section (" + owner.column + ", title, body_markdown, display_order)"
                    + " values (?, ?, ?, ?)", ownerId, section.title().trim(), section.bodyMarkdown(), i);
        }
    }
}
