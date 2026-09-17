package dev.portfolio.portfolio_api.faq;

import dev.portfolio.portfolio_api.faq.FaqAdmin.FaqRequest;
import dev.portfolio.portfolio_api.faq.FaqAdmin.FaqResponse;
import dev.portfolio.portfolio_api.rag.DocumentProjector;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Registered questions and answers (ADR-0014); every change is projected into the RAG document layer. */
@Service
@Transactional
public class FaqAdminService {

    private static final String SELECT = """
            select f.id, f.question, f.answer, f.published, f.display_order, f.created_at, f.updated_at,
                   d.index_status
            from faq f left join document d on d.document_type = 'FAQ' and d.source_id = f.id""";

    private static final RowMapper<FaqResponse> ROW = (rs, n) -> new FaqResponse(
            rs.getLong("id"), rs.getString("question"), rs.getString("answer"), rs.getBoolean("published"),
            rs.getInt("display_order"), rs.getString("index_status"),
            rs.getTimestamp("created_at").toInstant(), rs.getTimestamp("updated_at").toInstant());

    private final JdbcTemplate jdbc;
    private final DocumentProjector projector;

    public FaqAdminService(JdbcTemplate jdbc, DocumentProjector projector) {
        this.jdbc = jdbc;
        this.projector = projector;
    }

    @Transactional(readOnly = true)
    public List<FaqResponse> list() {
        return jdbc.query(SELECT + " order by f.display_order, f.id", ROW);
    }

    public FaqResponse create(FaqRequest r) {
        Long id = jdbc.queryForObject("""
                insert into faq (question, answer, published, display_order) values (?, ?, ?, ?) returning id""",
                Long.class, r.question().strip(), r.answer().strip(), r.published(), r.displayOrder());
        projector.projectFaq(id);
        resolveUnanswered(r.fromUnansweredId(), id);
        return get(id);
    }

    public FaqResponse update(long id, FaqRequest r) {
        int updated = jdbc.update("""
                update faq set question = ?, answer = ?, published = ?, display_order = ?, updated_at = now()
                where id = ?""", r.question().strip(), r.answer().strip(), r.published(), r.displayOrder(), id);
        if (updated == 0) {
            throw notFound();
        }
        projector.projectFaq(id);
        resolveUnanswered(r.fromUnansweredId(), id);
        return get(id);
    }

    public void delete(long id) {
        projector.remove(DocumentProjector.Type.FAQ, id);
        if (jdbc.update("delete from faq where id = ?", id) == 0) {
            throw notFound();
        }
    }

    private FaqResponse get(long id) {
        return jdbc.query(SELECT + " where f.id = ?", ROW, id).stream().findFirst().orElseThrow(this::notFound);
    }

    private void resolveUnanswered(Long unansweredId, long faqId) {
        if (unansweredId == null) {
            return;
        }
        int updated = jdbc.update("""
                update chat_unanswered_question set status = 'RESOLVED', handled_at = now(),
                  admin_note = concat_ws(E'\\n', admin_note, cast(? as text))
                where id = ?""", "FAQ #" + faqId + " 등록", unansweredId);
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "unanswered question not found");
        }
    }

    private ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "faq not found");
    }
}
