package dev.portfolio.portfolio_api.graph;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** Public graph (ADR-0015, GRAPH_DESIGN 4절). Optional fields are null when they do not apply to the node type. */
public record GraphResponse(List<Node> nodes, List<Edge> edges) {

    public enum NodeType { PROJECT, BLOG, CATEGORY, SKILL }

    public enum EdgeKind { REFERENCE, SKILL, CATEGORY }

    /** id is "{type}:{key}" in lowercase, e.g. "blog:evar-credit-flow", so project and blog slugs never clash. */
    public record Node(
            String id, NodeType type, String key, String title, String url,
            String summary, String color,
            LocalDate periodStart, LocalDate periodEnd,
            Instant publishedAt, List<String> tags) {
    }

    /** REFERENCE: source references target. SKILL: document → skill. CATEGORY: blog → category. */
    public record Edge(String source, String target, EdgeKind kind) {
    }
}
