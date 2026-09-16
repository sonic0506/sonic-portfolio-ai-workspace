package dev.portfolio.portfolio_api.rag;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Projects source content into the document table (ADR-0005). Must run in the same transaction as the
 * source change so that document.visible never disagrees with the published flag.
 * Admin-only fields and :::questions blocks are never projected.
 */
@Component
@Transactional(propagation = Propagation.MANDATORY)
public class DocumentProjector {

    public enum Type {
        PROJECT,
        BLOG,
        PROFILE
    }

    /** Same pattern as QUESTIONS_BLOCK in poc/rag_eval.py. */
    static final Pattern QUESTIONS_BLOCK =
            Pattern.compile("^:::questions\\s*$.*?^:::\\s*$", Pattern.MULTILINE | Pattern.DOTALL);

    private final JdbcTemplate jdbc;
    private final ApplicationEventPublisher events;

    public DocumentProjector(JdbcTemplate jdbc, ApplicationEventPublisher events) {
        this.jdbc = jdbc;
        this.events = events;
    }

    public void projectProject(long projectId) {
        Map<String, Object> row = jdbc.queryForMap(
                "select slug, title, published from project where id = ?", projectId);
        List<String> skills = jdbc.queryForList("""
                select s.code from project_skill ps join skill s on s.id = ps.skill_id
                where ps.project_id = ? order by ps.display_order, s.code""", String.class, projectId);
        upsert(Type.PROJECT, projectId, (String) row.get("title"), content("project_id", projectId),
                (Boolean) row.get("published"), (String) row.get("slug"), skills);
    }

    public void projectBlogPost(long postId) {
        Map<String, Object> row = jdbc.queryForMap(
                "select slug, title, published from blog_post where id = ?", postId);
        List<String> skills = jdbc.queryForList("""
                select s.code from blog_skill bs join skill s on s.id = bs.skill_id
                where bs.blog_post_id = ? order by s.code""", String.class, postId);
        upsert(Type.BLOG, postId, (String) row.get("title"), content("blog_post_id", postId),
                (Boolean) row.get("published"), (String) row.get("slug"), skills);
    }

    /** The profile is always public. */
    public void projectProfile(long profileId) {
        List<String> skills = jdbc.queryForList("""
                select s.code from profile_skill ps join skill s on s.id = ps.skill_id
                where ps.profile_id = ? order by ps.display_order, s.code""", String.class, profileId);
        upsert(Type.PROFILE, profileId, "프로필", content("profile_id", profileId), true, null, skills);
    }

    /** Chunks and relations go with it (FK cascade). */
    public void remove(Type type, long sourceId) {
        jdbc.update("delete from document where document_type = ? and source_id = ?", type.name(), sourceId);
    }

    /** Re-projects every source and drops documents whose source no longer exists. */
    public void rebuildAll() {
        jdbc.queryForList("select id from project", Long.class).forEach(this::projectProject);
        jdbc.queryForList("select id from blog_post", Long.class).forEach(this::projectBlogPost);
        jdbc.queryForList("select id from profile", Long.class).forEach(this::projectProfile);
        jdbc.update("""
                delete from document d where
                  (d.document_type = 'PROJECT' and not exists (select 1 from project p where p.id = d.source_id))
                  or (d.document_type = 'BLOG' and not exists (select 1 from blog_post b where b.id = d.source_id))
                  or (d.document_type = 'PROFILE' and not exists (select 1 from profile f where f.id = d.source_id))
                  or d.document_type not in ('PROJECT', 'BLOG', 'PROFILE')""");
    }

    public Long documentId(Type type, long sourceId) {
        return jdbc.query("select id from document where document_type = ? and source_id = ?",
                rs -> rs.next() ? rs.getLong(1) : null, type.name(), sourceId);
    }

    private String content(String ownerColumn, long ownerId) {
        List<String> parts = jdbc.query(
                "select title, body_markdown from content_section where " + ownerColumn + " = ?"
                        + " order by display_order, id",
                (rs, n) -> "## " + rs.getString("title") + "\n\n"
                        + QUESTIONS_BLOCK.matcher(rs.getString("body_markdown")).replaceAll("").strip(),
                ownerId);
        return String.join("\n\n", parts);
    }

    private void upsert(Type type, long sourceId, String title, String content, boolean visible,
                        String slug, List<String> skills) {
        String hash = sha256(title + "\n" + content);
        String metadata = "jsonb_build_object('slug', cast(? as text), 'skills', to_jsonb(cast(? as text[])),"
                + " 'contentHash', cast(? as text))";
        String[] skillArray = skills.toArray(String[]::new);

        Map<String, Object> existing = jdbc.query(
                "select id, metadata->>'contentHash' as hash from document where document_type = ? and source_id = ?",
                rs -> rs.next() ? Map.of("id", rs.getLong("id"), "hash", String.valueOf(rs.getString("hash"))) : null,
                type.name(), sourceId);

        if (existing == null) {
            Long id = jdbc.queryForObject(
                    "insert into document (document_type, source_id, title, content, metadata, visible,"
                            + " source_updated_at, index_status) values (?, ?, ?, ?, " + metadata
                            + ", ?, now(), 'PENDING') returning id",
                    Long.class, type.name(), sourceId, title, content, slug, skillArray, hash, visible);
            events.publishEvent(new DocumentChangedEvent(id));
            return;
        }

        long id = (Long) existing.get("id");
        boolean changed = !hash.equals(existing.get("hash"));
        jdbc.update("update document set title = ?, content = ?, metadata = " + metadata + ", visible = ?,"
                        + " source_updated_at = now(), updated_at = now(),"
                        + " index_status = case when ? then 'PENDING' else index_status end,"
                        + " index_error = case when ? then null else index_error end"
                        + " where id = ?",
                title, content, slug, skillArray, hash, visible, changed, changed, id);
        if (changed) {
            events.publishEvent(new DocumentChangedEvent(id));
        }
    }

    static String sha256(String text) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(text.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
