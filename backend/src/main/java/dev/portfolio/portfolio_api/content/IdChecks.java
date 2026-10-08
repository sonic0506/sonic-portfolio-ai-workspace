package dev.portfolio.portfolio_api.content;

import java.util.Collection;
import java.util.HashSet;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/** Validates reference id lists in admin requests: no duplicates and every id exists (400 otherwise). */
@Component
public class IdChecks {

    public enum RefTable {
        SKILL("skill"),
        CATEGORY("category"),
        TAG("tag"),
        PROJECT("project");

        private final String table;

        RefTable(String table) {
            this.table = table;
        }
    }

    private final JdbcTemplate jdbc;

    public IdChecks(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void requireExisting(RefTable ref, String field, Collection<Long> ids) {
        var distinct = new HashSet<>(ids);
        if (distinct.size() != ids.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " must not contain duplicates");
        }
        if (distinct.isEmpty()) {
            return;
        }
        Integer found = jdbc.queryForObject(
                "select count(*) from " + ref.table + " where id = any (?)",
                Integer.class, (Object) distinct.toArray(Long[]::new));
        if (found == null || found != distinct.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " contain an unknown id");
        }
    }
}
