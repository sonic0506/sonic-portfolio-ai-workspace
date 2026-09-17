package dev.portfolio.portfolio_api.chat;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Keeps questions the chat could not answer, for admin review (ADR-0013). */
@Service
public class UnansweredQuestionService {

    public enum Status {
        OPEN,
        RESOLVED,
        IGNORED
    }

    public record RetrievedDoc(String type, String slug, String title, double distance) {
    }

    public record Item(long id, String question, String answer, String reason, List<RetrievedDoc> retrieved,
                       Status status, String adminNote, boolean inActiveSession, Instant createdAt,
                       Instant handledAt) {
    }

    public record Page(List<Item> items, int page, int size, long totalElements) {
    }

    private static final Logger log = LoggerFactory.getLogger(UnansweredQuestionService.class);
    private static final String SELECT = """
            select id, question, answer, reason, status, admin_note, session_id, created_at, handled_at
            from chat_unanswered_question""";

    private final JdbcTemplate jdbc;
    private final int retentionDays;

    public UnansweredQuestionService(JdbcTemplate jdbc,
                                     @Value("${app.chat.unanswered.retention-days:90}") int retentionDays) {
        this.jdbc = jdbc;
        this.retentionDays = retentionDays;
    }

    /** Stores the question when the answer counts as unanswered. */
    @Transactional
    public void recordIfUnanswered(String question, ChatService.Answer answer, Long sessionId) {
        if (answer.unanswered() == null) {
            return;
        }
        jdbc.update("""
                insert into chat_unanswered_question (question, answer, reason, retrieved, session_id)
                values (?, ?, ?, cast(? as jsonb), ?)""",
                question, answer.text(), answer.unanswered().name(), retrievedJson(answer.retrieved()), sessionId);
    }

    /** Recording must never break the answer the visitor already received. */
    public void recordQuietly(String question, ChatService.Answer answer, Long sessionId) {
        try {
            recordIfUnanswered(question, answer, sessionId);
        } catch (RuntimeException e) {
            log.warn("Could not record unanswered question", e);
        }
    }

    @Transactional(readOnly = true)
    public Page list(Status status, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        String where = status == null ? "" : " where status = '" + status.name() + "'";
        Long total = jdbc.queryForObject("select count(*) from chat_unanswered_question" + where, Long.class);
        List<Item> items = jdbc.query(SELECT + where + " order by created_at desc, id desc limit ? offset ?",
                (rs, n) -> new Item(rs.getLong("id"), rs.getString("question"), rs.getString("answer"),
                        rs.getString("reason"), List.of(), Status.valueOf(rs.getString("status")),
                        rs.getString("admin_note"), rs.getObject("session_id") != null,
                        rs.getTimestamp("created_at").toInstant(),
                        rs.getTimestamp("handled_at") == null ? null : rs.getTimestamp("handled_at").toInstant()),
                safeSize, (long) safePage * safeSize);
        return new Page(withRetrieved(items), safePage, safeSize, total == null ? 0 : total);
    }

    /** OPEN clears handled_at; RESOLVED/IGNORED stamp it. */
    @Transactional
    public Item update(long id, Status status, String adminNote) {
        String note = adminNote == null || adminNote.isBlank() ? null : adminNote.strip();
        // handled_at must be read before status changes, so compare against the stored status first
        int updated = jdbc.update("""
                update chat_unanswered_question set status = ?, admin_note = ?,
                  handled_at = case when cast(? as text) = 'OPEN' then null
                                    when status = cast(? as text) then handled_at
                                    else now() end
                where id = ?""", status.name(), note, status.name(), status.name(), id);
        if (updated == 0) {
            throw notFound();
        }
        return withRetrieved(jdbc.query(SELECT + " where id = ?", (rs, n) -> new Item(rs.getLong("id"),
                rs.getString("question"), rs.getString("answer"), rs.getString("reason"), List.of(),
                Status.valueOf(rs.getString("status")), rs.getString("admin_note"), rs.getObject("session_id") != null,
                rs.getTimestamp("created_at").toInstant(),
                rs.getTimestamp("handled_at") == null ? null : rs.getTimestamp("handled_at").toInstant()), id)).get(0);
    }

    @Transactional
    public void delete(long id) {
        if (jdbc.update("delete from chat_unanswered_question where id = ?", id) == 0) {
            throw notFound();
        }
    }

    @Scheduled(fixedDelayString = "${app.chat.session-cleanup-ms:3600000}", initialDelay = 90_000)
    @Transactional
    public void cleanupExpired() {
        deleteOlderThanRetention();
    }

    @Transactional
    public int deleteOlderThanRetention() {
        int deleted = jdbc.update(
                "delete from chat_unanswered_question where created_at < now() - make_interval(days => ?)",
                retentionDays);
        if (deleted > 0) {
            log.info("Deleted {} unanswered questions older than {} days", deleted, retentionDays);
        }
        return deleted;
    }

    private List<Item> withRetrieved(List<Item> items) {
        if (items.isEmpty()) {
            return items;
        }
        Map<Long, List<RetrievedDoc>> byId = new HashMap<>();
        jdbc.query("""
                select q.id, r.type, r.slug, r.title, r.distance
                from chat_unanswered_question q,
                     rows from (jsonb_to_recordset(q.retrieved)
                                as (type text, slug text, title text, distance float8))
                       with ordinality as r(type, slug, title, distance, ord)
                where q.id = any (?)
                order by q.id, r.ord""",
                rs -> {
                    byId.computeIfAbsent(rs.getLong("id"), k -> new ArrayList<>()).add(new RetrievedDoc(
                            rs.getString("type"), rs.getString("slug"), rs.getString("title"),
                            rs.getDouble("distance")));
                },
                (Object) items.stream().map(Item::id).toArray(Long[]::new));
        return items.stream().map(i -> new Item(i.id(), i.question(), i.answer(), i.reason(),
                byId.getOrDefault(i.id(), List.of()), i.status(), i.adminNote(), i.inActiveSession(),
                i.createdAt(), i.handledAt())).toList();
    }

    /** One entry per document, best (smallest) distance, in retrieval order. */
    static String retrievedJson(List<Retriever.Hit> hits) {
        Map<Long, Retriever.Hit> best = new LinkedHashMap<>();
        for (Retriever.Hit hit : hits) {
            best.merge(hit.document().id(), hit, (a, b) -> a.distance() <= b.distance() ? a : b);
        }
        StringBuilder sb = new StringBuilder("[");
        for (Retriever.Hit hit : best.values()) {
            if (sb.length() > 1) {
                sb.append(',');
            }
            sb.append("{\"type\":").append(json(hit.document().type()))
                    .append(",\"slug\":").append(json(hit.document().slug()))
                    .append(",\"title\":").append(json(hit.document().title()))
                    .append(",\"distance\":").append(Double.isFinite(hit.distance()) ? hit.distance() : 0)
                    .append('}');
        }
        return sb.append(']').toString();
    }

    private static String json(String value) {
        if (value == null) {
            return "null";
        }
        StringBuilder sb = new StringBuilder("\"");
        for (char c : value.toCharArray()) {
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
                }
            }
        }
        return sb.append('"').toString();
    }

    private static ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "unanswered question not found");
    }
}
