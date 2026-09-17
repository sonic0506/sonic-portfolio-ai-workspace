package dev.portfolio.portfolio_api.chat;

import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Cosine search over document_chunk. Only visible documents are ever returned (ADR-0005),
 * including relation expansion.
 */
@Component
public class Retriever {

    public static final int TOP_K = 5;
    public static final int MAX_RELATED = 2;

    /**
     * Public view of a document; no internal id is sent to clients. Profile documents projected before
     * the fixed "profile" slug existed have no slug in metadata, so the queries fall back to it.
     */
    public record DocumentRef(long id, String type, String slug, String title) {

        /** null for FAQ: there is no public FAQ page. */
        public String url() {
            return switch (type) {
                case "PROJECT" -> "/projects/" + slug;
                case "BLOG" -> "/blog/" + slug;
                case "FAQ" -> null;
                default -> "/profile";
            };
        }
    }

    public record Hit(DocumentRef document, List<String> sectionTitles, String text, double distance) {
    }

    private static final String SELECT = """
            select d.id as doc_id, d.document_type, coalesce(d.metadata->>'slug', case when d.document_type = 'PROFILE' then 'profile' end) as slug, d.title,
                   c.section_titles, c.content, c.embedding <=> cast(? as vector) as distance
            from document_chunk c join document d on d.id = c.document_id
            where d.visible and c.embedding is not null
            """;

    private final JdbcTemplate jdbc;

    public Retriever(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Hit> search(float[] query, int limit) {
        return jdbc.query(SELECT + " order by distance, c.id limit ?", this::hit, literal(query), limit);
    }

    /** Visible documents linked to any of the given documents, in either direction, excluding them. */
    public List<DocumentRef> related(Collection<Long> documentIds, int limit) {
        if (documentIds.isEmpty()) {
            return List.of();
        }
        Long[] ids = documentIds.toArray(Long[]::new);
        return jdbc.query("""
                select distinct on (d.id) d.id, d.document_type, coalesce(d.metadata->>'slug', case when d.document_type = 'PROFILE' then 'profile' end) as slug, d.title
                from document_relation r
                join document d on d.id = case when r.source_document_id = any (?)
                                               then r.target_document_id else r.source_document_id end
                where (r.source_document_id = any (?) or r.target_document_id = any (?))
                  and d.visible and not (d.id = any (?))
                order by d.id
                limit ?""",
                (rs, n) -> new DocumentRef(rs.getLong("id"), rs.getString("document_type"),
                        rs.getString("slug"), rs.getString("title")),
                ids, ids, ids, ids, limit);
    }

    /** The chunk of one document closest to the query, if it has any embedded chunk. */
    public List<Hit> bestChunk(long documentId, float[] query) {
        return jdbc.query(SELECT + " and d.id = ? order by distance, c.id limit 1",
                this::hit, literal(query), documentId);
    }

    private Hit hit(ResultSet rs, int row) throws SQLException {
        Array titles = rs.getArray("section_titles");
        List<String> sectionTitles = titles == null ? List.of() : Arrays.asList((String[]) titles.getArray());
        return new Hit(new DocumentRef(rs.getLong("doc_id"), rs.getString("document_type"),
                rs.getString("slug"), rs.getString("title")),
                sectionTitles, rs.getString("content"), rs.getDouble("distance"));
    }

    private static String literal(float[] vector) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < vector.length; i++) {
            if (i > 0) {
                sb.append(',');
            }
            sb.append(vector[i]);
        }
        return sb.append(']').toString();
    }
}
