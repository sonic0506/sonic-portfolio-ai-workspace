package dev.portfolio.portfolio_api.content;

import dev.portfolio.portfolio_api.rag.DocumentProjector;
import jakarta.validation.constraints.NotNull;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * "Reference documents" between projects and blog posts (ADR-0005 follow-up, 2026-09-17).
 * A document_relation row (RELATED_TO) means "source references target". Outgoing rows are edited through the
 * owner's admin request; incoming rows are shown as "referenced by". Public views only list visible documents.
 */
@Component
public class DocumentReferences {

    public enum RefType {
        PROJECT("project", "/projects/"),
        BLOG("blog_post", "/blog/");

        private final String table;
        private final String urlPrefix;

        RefType(String table, String urlPrefix) {
            this.table = table;
            this.urlPrefix = urlPrefix;
        }

        DocumentProjector.Type documentType() {
            return DocumentProjector.Type.valueOf(name());
        }
    }

    public record ReferenceRequest(@NotNull RefType type, @NotNull Long id) {
    }

    public record AdminReference(RefType type, long id, String slug, String title, boolean published) {
    }

    /** category: the blog post's category, null for projects (and posts without one). */
    public record PublicReference(RefType type, String slug, String title, String url, CategoryLabel category) {

        static PublicReference of(RefType type, String slug, String title, CategoryLabel category) {
            return new PublicReference(type, slug, title, type.urlPrefix + slug, category);
        }
    }

    private static final String RELATION_TYPE = "RELATED_TO";

    private final JdbcTemplate jdbc;
    private final DocumentProjector projector;

    public DocumentReferences(JdbcTemplate jdbc, DocumentProjector projector) {
        this.jdbc = jdbc;
        this.projector = projector;
    }

    /** 400 on duplicates, self reference (ownerId null when creating) or unknown targets. */
    public void validate(RefType ownerType, Long ownerId, List<ReferenceRequest> references) {
        if (new HashSet<>(references).size() != references.size()) {
            throw badRequest("references must not contain duplicates");
        }
        if (ownerId != null && references.contains(new ReferenceRequest(ownerType, ownerId))) {
            throw badRequest("references must not contain the document itself");
        }
        Map<RefType, List<Long>> byType = references.stream().collect(Collectors.groupingBy(
                ReferenceRequest::type, Collectors.mapping(ReferenceRequest::id, Collectors.toList())));
        byType.forEach((type, ids) -> {
            Integer found = jdbc.queryForObject("select count(*) from " + type.table + " where id = any (?)",
                    Integer.class, (Object) ids.toArray(Long[]::new));
            if (found == null || found != ids.size()) {
                throw badRequest("references contain an unknown " + type.name().toLowerCase() + " id");
            }
        });
    }

    /** Replaces the owner's outgoing references. Must run after the owner has been projected. */
    public void replace(RefType ownerType, long ownerId, List<ReferenceRequest> references) {
        long source = documentId(ownerType, ownerId);
        jdbc.update("delete from document_relation where source_document_id = ? and relation_type = ?",
                source, RELATION_TYPE);
        for (ReferenceRequest ref : references) {
            jdbc.update("insert into document_relation (source_document_id, target_document_id, relation_type)"
                    + " values (?, ?, ?)", source, documentId(ref.type(), ref.id()), RELATION_TYPE);
        }
    }

    public List<AdminReference> adminReferences(RefType ownerType, long ownerId) {
        return jdbc.query(select("target_document_id", "source_document_id", false),
                (rs, n) -> adminRow(rs), ownerType.name(), ownerId, RELATION_TYPE);
    }

    public List<AdminReference> adminReferencedBy(RefType ownerType, long ownerId) {
        return jdbc.query(select("source_document_id", "target_document_id", false),
                (rs, n) -> adminRow(rs), ownerType.name(), ownerId, RELATION_TYPE);
    }

    public List<PublicReference> publicReferences(RefType ownerType, long ownerId) {
        return jdbc.query(select("target_document_id", "source_document_id", true),
                (rs, n) -> publicRow(rs), ownerType.name(), ownerId, RELATION_TYPE);
    }

    public List<PublicReference> publicReferencedBy(RefType ownerType, long ownerId) {
        return jdbc.query(select("source_document_id", "target_document_id", true),
                (rs, n) -> publicRow(rs), ownerType.name(), ownerId, RELATION_TYPE);
    }

    /** otherColumn: the linked document; ownerColumn: the owner's side of the row. */
    private static String select(String otherColumn, String ownerColumn, boolean visibleOnly) {
        return "select d.document_type, d.source_id, d.metadata->>'slug' as slug, d.title, d.visible,"
                + " c.code as category_code, c.name as category_name, c.color as category_color"
                + " from document_relation r join document d on d.id = r." + otherColumn
                + " left join blog_post b on d.document_type = 'BLOG' and b.id = d.source_id"
                + " left join category c on c.id = b.category_id"
                + " where r." + ownerColumn + " = (select o.id from document o"
                + "   where o.document_type = ? and o.source_id = ?)"
                + " and r.relation_type = ? and d.document_type in ('PROJECT', 'BLOG')"
                + (visibleOnly ? " and d.visible" : "")
                + " order by r.id";
    }

    private static AdminReference adminRow(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new AdminReference(RefType.valueOf(rs.getString("document_type")), rs.getLong("source_id"),
                rs.getString("slug"), rs.getString("title"), rs.getBoolean("visible"));
    }

    private static PublicReference publicRow(java.sql.ResultSet rs) throws java.sql.SQLException {
        String categoryCode = rs.getString("category_code");
        CategoryLabel category = categoryCode == null ? null
                : new CategoryLabel(categoryCode, rs.getString("category_name"), rs.getString("category_color"));
        return PublicReference.of(RefType.valueOf(rs.getString("document_type")),
                rs.getString("slug"), rs.getString("title"), category);
    }

    /** Sources created before document projection existed may lack a document; project them on demand. */
    private long documentId(RefType type, long sourceId) {
        Long id = projector.documentId(type.documentType(), sourceId);
        if (id == null) {
            if (type == RefType.PROJECT) {
                projector.projectProject(sourceId);
            } else {
                projector.projectBlogPost(sourceId);
            }
            id = projector.documentId(type.documentType(), sourceId);
        }
        if (id == null) {
            throw new IllegalStateException("no document for " + type + " " + sourceId);
        }
        return id;
    }

    private static ResponseStatusException badRequest(String reason) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, reason);
    }
}
