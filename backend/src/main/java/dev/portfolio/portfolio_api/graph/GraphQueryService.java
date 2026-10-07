package dev.portfolio.portfolio_api.graph;

import dev.portfolio.portfolio_api.graph.GraphResponse.Edge;
import dev.portfolio.portfolio_api.graph.GraphResponse.EdgeKind;
import dev.portfolio.portfolio_api.graph.GraphResponse.Node;
import dev.portfolio.portfolio_api.graph.GraphResponse.NodeType;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Builds the public graph with plain SQL (read only, no entities needed).
 * Only published projects/posts appear; categories and skills appear only when a published document uses them.
 */
@Service
@Transactional(readOnly = true)
public class GraphQueryService {

    private final JdbcTemplate jdbc;

    public GraphQueryService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public GraphResponse publicGraph() {
        List<Node> nodes = new ArrayList<>();
        List<Edge> edges = new ArrayList<>();

        // Same order as the public project list.
        nodes.addAll(jdbc.query("""
                select slug, title, summary, period_start, period_end from project where published
                order by display_order, period_start desc, id desc""",
                (rs, i) -> new Node(id(NodeType.PROJECT, rs.getString("slug")), NodeType.PROJECT, rs.getString("slug"),
                        rs.getString("title"), "/projects/" + rs.getString("slug"), rs.getString("summary"), null,
                        rs.getObject("period_start", java.time.LocalDate.class),
                        rs.getObject("period_end", java.time.LocalDate.class), null, null)));

        Map<Long, List<String>> tags = new HashMap<>();
        jdbc.query("""
                select bt.blog_post_id, t.name from blog_tag bt join tag t on t.id = bt.tag_id
                join blog_post b on b.id = bt.blog_post_id where b.published order by t.code""",
                rs -> {
                    tags.computeIfAbsent(rs.getLong(1), k -> new ArrayList<>()).add(rs.getString(2));
                });
        nodes.addAll(jdbc.query("""
                select b.id, b.slug, b.title, b.summary, b.published_at, c.code, c.color
                from blog_post b left join category c on c.id = b.category_id
                where b.published order by b.published_at desc nulls last, b.id desc""",
                (rs, i) -> {
                    Timestamp publishedAt = rs.getTimestamp("published_at");
                    return new Node(id(NodeType.BLOG, rs.getString("slug")), NodeType.BLOG, rs.getString("slug"),
                            rs.getString("title"), "/blog/" + rs.getString("slug"), rs.getString("summary"),
                            rs.getString("color"), null, null, publishedAt == null ? null : publishedAt.toInstant(),
                            tags.getOrDefault(rs.getLong("id"), List.of()));
                }));

        nodes.addAll(jdbc.query("""
                select c.code, c.name, c.color from category c
                where exists (select 1 from blog_post b where b.category_id = c.id and b.published)
                order by c.display_order, c.code""",
                (rs, i) -> new Node(id(NodeType.CATEGORY, rs.getString("code")), NodeType.CATEGORY, rs.getString("code"),
                        rs.getString("name"), "/blog?category=" + rs.getString("code"), null, rs.getString("color"),
                        null, null, null, null)));

        nodes.addAll(jdbc.query("""
                select s.code, s.name from skill s
                where exists (select 1 from project_skill ps join project p on p.id = ps.project_id
                              where ps.skill_id = s.id and p.published)
                   or exists (select 1 from blog_skill bs join blog_post b on b.id = bs.blog_post_id
                              where bs.skill_id = s.id and b.published)
                order by s.code""",
                (rs, i) -> new Node(id(NodeType.SKILL, rs.getString("code")), NodeType.SKILL, rs.getString("code"),
                        rs.getString("name"), null, null, null, null, null, null, null)));

        // References between published projects/posts only (document.visible mirrors published).
        edges.addAll(jdbc.query("""
                select lower(s.document_type) || ':' || coalesce(sp.slug, sb.slug) as source,
                       lower(t.document_type) || ':' || coalesce(tp.slug, tb.slug) as target
                from document_relation r
                join document s on s.id = r.source_document_id
                join document t on t.id = r.target_document_id
                left join project sp on s.document_type = 'PROJECT' and sp.id = s.source_id
                left join blog_post sb on s.document_type = 'BLOG' and sb.id = s.source_id
                left join project tp on t.document_type = 'PROJECT' and tp.id = t.source_id
                left join blog_post tb on t.document_type = 'BLOG' and tb.id = t.source_id
                where r.relation_type = 'RELATED_TO'
                  and coalesce(sp.published, sb.published) and coalesce(tp.published, tb.published)
                order by r.id""",
                (rs, i) -> new Edge(rs.getString("source"), rs.getString("target"), EdgeKind.REFERENCE)));

        edges.addAll(jdbc.query("""
                select 'project:' || p.slug, 'skill:' || s.code
                from project_skill ps join project p on p.id = ps.project_id join skill s on s.id = ps.skill_id
                where p.published order by p.id, ps.display_order""",
                (rs, i) -> new Edge(rs.getString(1), rs.getString(2), EdgeKind.SKILL)));
        edges.addAll(jdbc.query("""
                select 'blog:' || b.slug, 'skill:' || s.code
                from blog_skill bs join blog_post b on b.id = bs.blog_post_id join skill s on s.id = bs.skill_id
                where b.published order by b.id, s.code""",
                (rs, i) -> new Edge(rs.getString(1), rs.getString(2), EdgeKind.SKILL)));
        edges.addAll(jdbc.query("""
                select 'blog:' || b.slug, 'category:' || c.code
                from blog_post b join category c on c.id = b.category_id
                where b.published order by b.id""",
                (rs, i) -> new Edge(rs.getString(1), rs.getString(2), EdgeKind.CATEGORY)));

        return new GraphResponse(nodes, edges);
    }

    private static String id(NodeType type, String key) {
        return type.name().toLowerCase(java.util.Locale.ROOT) + ":" + key;
    }
}
