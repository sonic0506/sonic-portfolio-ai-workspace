package dev.portfolio.portfolio_api.chat;

import dev.portfolio.portfolio_api.chat.ChatEvents.Doc;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Visitor chat sessions (ADR-0011): server-issued id + secret key (only its SHA-256 is stored),
 * expiry 24 hours after the last activity, at most 30 questions, last 3 turns sent to the model.
 */
@Service
public class ChatSessionService {

    public static final Duration TTL = Duration.ofHours(24);
    public static final int MAX_QUESTIONS = 30;
    public static final int HISTORY_TURNS = 3;

    public record Created(UUID sessionId, String sessionKey, Instant expiresAt) {
    }

    public record Session(long id, UUID publicId, Instant expiresAt) {
    }

    public record Message(String role, String content, List<Doc> sources, Instant createdAt) {
    }

    public record Transcript(UUID sessionId, Instant expiresAt, List<Message> messages) {
    }

    private static final Logger log = LoggerFactory.getLogger(ChatSessionService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final JdbcTemplate jdbc;

    public ChatSessionService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional
    public Created create() {
        byte[] secret = new byte[32];
        RANDOM.nextBytes(secret);
        String key = Base64.getUrlEncoder().withoutPadding().encodeToString(secret);
        Instant expiresAt = Instant.now().plus(TTL);
        UUID publicId = jdbc.queryForObject("""
                insert into chat_session (visitor_key, expires_at) values (?, ?) returning public_id""",
                UUID.class, hash(key), Timestamp.from(expiresAt));
        return new Created(publicId, key, expiresAt);
    }

    /** 404 for unknown, expired or wrong-key sessions alike. */
    @Transactional(readOnly = true)
    public Session find(UUID publicId, String key) {
        if (publicId == null || key == null || key.isBlank()) {
            throw notFound();
        }
        List<Map<String, Object>> rows = jdbc.queryForList("""
                select id, visitor_key, expires_at from chat_session
                where public_id = ? and expires_at > now()""", publicId);
        if (rows.isEmpty()) {
            throw notFound();
        }
        Map<String, Object> row = rows.get(0);
        byte[] stored = String.valueOf(row.get("visitor_key")).getBytes(StandardCharsets.US_ASCII);
        byte[] given = hash(key).getBytes(StandardCharsets.US_ASCII);
        if (!MessageDigest.isEqual(stored, given)) {
            throw notFound();
        }
        return new Session(((Number) row.get("id")).longValue(), publicId,
                ((Timestamp) row.get("expires_at")).toInstant());
    }

    @Transactional(readOnly = true)
    public int questionCount(long sessionId) {
        Integer count = jdbc.queryForObject(
                "select count(*) from chat_message where session_id = ? and role = 'USER'", Integer.class, sessionId);
        return count == null ? 0 : count;
    }

    /** Last HISTORY_TURNS question/answer pairs, oldest first. */
    @Transactional(readOnly = true)
    public List<AnswerPrompt.Turn> recentTurns(long sessionId) {
        List<String[]> rows = jdbc.query("""
                select role, content from chat_message where session_id = ?
                order by created_at desc, id desc limit ?""",
                (rs, n) -> new String[] {rs.getString("role"), rs.getString("content")},
                sessionId, HISTORY_TURNS * 2);
        Collections.reverse(rows);
        List<AnswerPrompt.Turn> turns = new ArrayList<>();
        for (int i = 0; i + 1 < rows.size(); i++) {
            if ("USER".equals(rows.get(i)[0]) && "ASSISTANT".equals(rows.get(i + 1)[0])) {
                turns.add(new AnswerPrompt.Turn(rows.get(i)[1], rows.get(i + 1)[1]));
                i++;
            }
        }
        return turns;
    }

    /** Stores a completed turn and extends the session's expiry. */
    @Transactional
    public void saveTurn(long sessionId, String question, ChatService.Answer answer) {
        Instant now = Instant.now();
        jdbc.update("insert into chat_message (session_id, role, content, created_at) values (?, 'USER', ?, ?)",
                sessionId, question, Timestamp.from(now));
        Long messageId = jdbc.queryForObject("""
                insert into chat_message (session_id, role, content, created_at)
                values (?, 'ASSISTANT', ?, ?) returning id""",
                Long.class, sessionId, answer.text(), Timestamp.from(now.plusMillis(1)));
        for (Retriever.DocumentRef ref : answer.cited()) {
            jdbc.update("""
                    insert into chat_message_source (message_id, document_id) select ?, ?
                    where exists (select 1 from document where id = ?)""", messageId, ref.id(), ref.id());
        }
        jdbc.update("update chat_session set last_active_at = ?, expires_at = ? where id = ?",
                Timestamp.from(now), Timestamp.from(now.plus(TTL)), sessionId);
    }

    /** Sources are shown only while the document is still public (ADR-0005). */
    @Transactional(readOnly = true)
    public Transcript transcript(Session session) {
        Map<Long, List<Doc>> sources = new LinkedHashMap<>();
        jdbc.query("""
                select s.message_id, d.document_type, coalesce(d.metadata->>'slug', case when d.document_type = 'PROFILE' then 'profile' end) as slug, d.title
                from chat_message_source s
                join chat_message m on m.id = s.message_id
                join document d on d.id = s.document_id
                where m.session_id = ? and d.visible
                order by s.message_id, d.id""",
                rs -> {
                    var ref = new Retriever.DocumentRef(0, rs.getString("document_type"),
                            rs.getString("slug"), rs.getString("title"));
                    sources.computeIfAbsent(rs.getLong("message_id"), k -> new ArrayList<>()).add(Doc.of(ref));
                },
                session.id());
        List<Message> messages = jdbc.query("""
                select id, role, content, created_at from chat_message where session_id = ?
                order by created_at, id""",
                (rs, n) -> new Message(rs.getString("role"), rs.getString("content"),
                        sources.getOrDefault(rs.getLong("id"), List.of()),
                        rs.getTimestamp("created_at").toInstant()),
                session.id());
        return new Transcript(session.publicId(), session.expiresAt(), messages);
    }

    @Transactional
    public void delete(Session session) {
        jdbc.update("delete from chat_session where id = ?", session.id());
    }

    /** Hourly cleanup of expired sessions (messages and sources cascade). */
    @Scheduled(fixedDelayString = "${app.chat.session-cleanup-ms:3600000}", initialDelay = 60_000)
    @Transactional
    public void cleanupExpired() {
        deleteExpired();
    }

    @Transactional
    public int deleteExpired() {
        int deleted = jdbc.update("delete from chat_session where expires_at is null or expires_at <= now()");
        if (deleted > 0) {
            log.info("Deleted {} expired chat sessions", deleted);
        }
        return deleted;
    }

    static String hash(String key) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(key.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "chat session not found");
    }
}
