package dev.portfolio.portfolio_api.seed;

import dev.portfolio.portfolio_api.blog.BlogPostAdminRequest;
import dev.portfolio.portfolio_api.blog.BlogPostAdminService;
import dev.portfolio.portfolio_api.blog.TaxonomyAdmin.CategoryRequest;
import dev.portfolio.portfolio_api.blog.TaxonomyAdmin.TagRequest;
import dev.portfolio.portfolio_api.blog.TaxonomyAdminService;
import dev.portfolio.portfolio_api.profile.ProfileAdminRequest;
import dev.portfolio.portfolio_api.profile.ProfileAdminRequest.CareerRequest;
import dev.portfolio.portfolio_api.profile.ProfileAdminRequest.SkillEntry;
import dev.portfolio.portfolio_api.profile.ProfileAdminService;
import dev.portfolio.portfolio_api.project.ProjectAdminRequest;
import dev.portfolio.portfolio_api.project.ProjectAdminService;
import dev.portfolio.portfolio_api.rag.DocumentProjector;
import dev.portfolio.portfolio_api.skill.SkillAdminService;
import dev.portfolio.portfolio_api.skill.SkillRequest;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Loads samples/ into the database through the admin services, so the same validation applies.
 * Idempotent: rows are matched by skill/category/tag code and project/blog slug and replaced.
 * related_projects/related_blogs mean "this document references them" and become document_relation rows in that
 * direction (ADR-0005 follow-up). Saving through the admin services clears references first, so they are re-linked.
 */
@Component
public class SampleSeeder {

    public record Result(int skills, int categories, int tags, int projects, int blogPosts, boolean profile,
                         int relations) {
    }

    private final SkillAdminService skills;
    private final TaxonomyAdminService taxonomy;
    private final ProjectAdminService projects;
    private final BlogPostAdminService blogPosts;
    private final ProfileAdminService profiles;
    private final JdbcTemplate jdbc;
    private final DocumentProjector projector;

    @PersistenceContext
    private EntityManager entityManager;

    public SampleSeeder(SkillAdminService skills, TaxonomyAdminService taxonomy, ProjectAdminService projects,
                        BlogPostAdminService blogPosts, ProfileAdminService profiles, JdbcTemplate jdbc,
                        DocumentProjector projector) {
        this.skills = skills;
        this.taxonomy = taxonomy;
        this.projects = projects;
        this.blogPosts = blogPosts;
        this.profiles = profiles;
        this.jdbc = jdbc;
        this.projector = projector;
    }

    @Transactional
    public Result seed(Path dir) {
        Map<String, Long> skillIdsByName = new HashMap<>();
        Map<String, Long> skillIdsByCode = new HashMap<>();
        List<List<String>> skillRows = tableRows(dir.resolve("skills.md"), "| id | name | 사용처 |");
        for (List<String> row : skillRows) {
            long id = upsertSkill(row.get(0), row.get(1));
            skillIdsByName.put(row.get(1), id);
            skillIdsByCode.put(row.get(0), id);
        }

        Map<String, Long> categoryIds = new HashMap<>();
        List<List<String>> categoryRows =
                tableRows(dir.resolve("taxonomy.md"), "| code | name | display_order | color | rag |");
        for (List<String> row : categoryRows) {
            categoryIds.put(row.get(1), upsertCategory(row.get(0), row.get(1), Integer.parseInt(row.get(2)),
                    row.get(3), Boolean.parseBoolean(row.get(4))));
        }
        Map<String, Long> tagIds = new HashMap<>();
        List<List<String>> tagRows = tableRows(dir.resolve("taxonomy.md"), "| code | name |");
        for (List<String> row : tagRows) {
            tagIds.put(row.get(1), upsertTag(row.get(0), row.get(1)));
        }

        List<Path> projectFiles = markdownFiles(dir.resolve("projects"));
        List<SampleMarkdown> projectDocs = new ArrayList<>();
        for (int i = 0; i < projectFiles.size(); i++) {
            SampleMarkdown md = SampleMarkdown.read(projectFiles.get(i));
            seedProject(md, i, skillIdsByName);
            projectDocs.add(md);
        }
        List<Path> blogFiles = markdownFiles(dir.resolve("blog"));
        List<SampleMarkdown> blogDocs = new ArrayList<>();
        for (Path file : blogFiles) {
            SampleMarkdown md = SampleMarkdown.read(file);
            seedBlogPost(md, skillIdsByName, categoryIds, tagIds);
            blogDocs.add(md);
        }
        for (SampleMarkdown md : projectDocs) {
            linkRelated(md, "project");
        }
        for (SampleMarkdown md : blogDocs) {
            linkRelated(md, "blog_post");
        }
        Integer relations = jdbc.queryForObject("select count(*) from document_relation", Integer.class);

        Path profileFile = dir.resolve("profile.md");
        boolean profile = Files.exists(profileFile);
        if (profile) {
            seedProfile(SampleMarkdown.read(profileFile), skillIdsByCode);
        }
        return new Result(skillRows.size(), categoryRows.size(), tagRows.size(),
                projectFiles.size(), blogFiles.size(), profile, relations == null ? 0 : relations);
    }

    private void seedProject(SampleMarkdown md, int order, Map<String, Long> skillIds) {
        Map<String, Object> links = md.map("links");
        var request = new ProjectAdminRequest(
                md.requiredText("id"), md.requiredText("title"), md.requiredText("summary"),
                md.text("organization"), md.text("position"), md.integer("contribution"), md.text("contribution_note"),
                SampleMarkdown.date(md.meta().get("period_start")),
                SampleMarkdown.date(md.meta().get("period_end")),
                md.text("thumbnail"), nullableText(links.get("github")), nullableText(links.get("service")),
                md.bool("featured"), md.bool("published"), order,
                adminNote(md.list("open_questions")),
                md.list("highlights"), resolve(md, "skills", skillIds), md.sections(), List.of());
        Long existing = idBySlug("project", request.slug());
        if (existing == null) {
            projects.create(request);
        } else {
            projects.update(existing, request);
        }
    }

    private void seedBlogPost(SampleMarkdown md, Map<String, Long> skillIds,
                              Map<String, Long> categoryIds, Map<String, Long> tagIds) {
        List<String> notes = new ArrayList<>();
        if (md.text("sample_note") != null) {
            notes.add(md.text("sample_note"));
        }
        if (md.text("draft_note") != null) {
            notes.add(md.text("draft_note"));
        }
        notes.addAll(md.list("open_questions"));
        var request = new BlogPostAdminRequest(
                md.requiredText("id"), md.requiredText("title"), md.text("summary"), md.text("thumbnail"),
                md.bool("published"), adminNote(notes),
                resolveOne(md, "category", categoryIds), resolve(md, "tags", tagIds),
                resolve(md, "skills", skillIds), md.sections(), List.of());
        Long id = idBySlug("blog_post", request.slug());
        if (id == null) {
            id = blogPosts.create(request).id();
        } else {
            blogPosts.update(id, request);
        }
        // Keep the sample's own dates instead of "now" (seed only).
        // The CASE branch needs an explicit type, otherwise PostgreSQL infers text for the parameter.
        LocalDate created = SampleMarkdown.date(md.meta().get("created_at"));
        LocalDate updated = SampleMarkdown.date(md.meta().get("updated_at"));
        if (created != null) {
            jdbc.update("update blog_post set created_at = ?, published_at = case when published then cast(? as timestamptz) end,"
                            + " updated_at = ? where id = ?",
                    startOfDay(created), startOfDay(created), startOfDay(updated != null ? updated : created), id);
            // The JDBC update bypasses JPA; drop cached entities so later reads in this transaction see it.
            entityManager.flush();
            entityManager.clear();
        }
    }

    private void seedProfile(SampleMarkdown md, Map<String, Long> skillIdsByCode) {
        List<CareerRequest> careers = md.maps("careers").stream()
                .map(c -> new CareerRequest(
                        String.valueOf(c.get("company")), nullableText(c.get("role")),
                        SampleMarkdown.date(c.get("period_start")), SampleMarkdown.date(c.get("period_end")),
                        nullableText(c.get("description"))))
                .toList();
        List<SkillEntry> skillEntries = new ArrayList<>();
        md.map("skills").forEach((group, codes) -> {
            for (Object code : (List<?>) codes) {
                Long id = skillIdsByCode.get(String.valueOf(code));
                if (id == null) {
                    throw new IllegalStateException(md.path() + ": unknown skill code " + code);
                }
                skillEntries.add(new SkillEntry(id, group));
            }
        });
        profiles.save(new ProfileAdminRequest(
                md.requiredText("headline"), md.requiredText("short_bio"),
                md.text("image_url"), md.text("github_url"), md.text("email"),
                careers, skillEntries, md.sections()));
    }

    private void linkRelated(SampleMarkdown md, String ownTable) {
        long source = documentIdBySlug(md, ownTable, md.requiredText("id"));
        List<Long> targets = new ArrayList<>();
        for (String slug : md.list("related_projects")) {
            targets.add(documentIdBySlug(md, "project", slug));
        }
        for (String slug : md.list("related_blogs")) {
            targets.add(documentIdBySlug(md, "blog_post", slug));
        }
        for (Long target : targets) {
            jdbc.update("""
                    insert into document_relation (source_document_id, target_document_id)
                    values (?, ?) on conflict do nothing""", source, target);
        }
    }

    private long documentIdBySlug(SampleMarkdown md, String table, String slug) {
        Long sourceId = idBySlug(table, slug);
        DocumentProjector.Type type = "project".equals(table) ? DocumentProjector.Type.PROJECT
                : DocumentProjector.Type.BLOG;
        Long documentId = sourceId == null ? null : projector.documentId(type, sourceId);
        if (documentId == null) {
            throw new IllegalStateException(md.path() + ": related " + table + " '" + slug + "' not found");
        }
        return documentId;
    }

    private long upsertSkill(String code, String name) {
        Long id = idByCode("skill", code);
        var request = new SkillRequest(code, name, null);
        return id == null ? skills.create(request).id() : skills.update(id, request).id();
    }

    private long upsertCategory(String code, String name, int order, String color, boolean ragEnabled) {
        Long id = idByCode("category", code);
        var request = new CategoryRequest(code, name, order, color, ragEnabled);
        return id == null ? taxonomy.createCategory(request).id() : taxonomy.updateCategory(id, request).id();
    }

    private long upsertTag(String code, String name) {
        Long id = idByCode("tag", code);
        var request = new TagRequest(code, name);
        return id == null ? taxonomy.createTag(request).id() : taxonomy.updateTag(id, request).id();
    }

    private static List<Long> resolve(SampleMarkdown md, String key, Map<String, Long> idsByName) {
        return md.list(key).stream().map(name -> {
            Long id = idsByName.get(name);
            if (id == null) {
                throw new IllegalStateException(md.path() + ": " + key + " has no code mapping for '" + name + "'");
            }
            return id;
        }).toList();
    }

    private static Long resolveOne(SampleMarkdown md, String key, Map<String, Long> idsByName) {
        String name = md.requiredText(key);
        Long id = idsByName.get(name);
        if (id == null) {
            throw new IllegalStateException(md.path() + ": " + key + " has no code mapping for '" + name + "'");
        }
        return id;
    }

    /** Rows of the first markdown table whose header cells equal the given header exactly. */
    static List<List<String>> tableRows(Path file, String headerPrefix) {
        List<String> lines;
        try {
            lines = Files.readAllLines(file, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("cannot read " + file, e);
        }
        List<String> header = cells(headerPrefix);
        List<List<String>> rows = new ArrayList<>();
        boolean inTable = false;
        for (String line : lines) {
            String trimmed = line.strip();
            if (!inTable) {
                if (trimmed.startsWith("|") && cells(trimmed).equals(header)) {
                    inTable = true;
                }
                continue;
            }
            if (!trimmed.startsWith("|")) {
                break;
            }
            if (trimmed.matches("\\|[\\s:|-]+\\|?")) {
                continue;
            }
            rows.add(cells(trimmed));
        }
        if (rows.isEmpty()) {
            throw new IllegalStateException(file + ": no table rows under " + headerPrefix);
        }
        return rows;
    }

    private static List<String> cells(String line) {
        String inner = line.strip();
        inner = inner.substring(1, inner.endsWith("|") ? inner.length() - 1 : inner.length());
        return Stream.of(inner.split("\\|")).map(String::strip).toList();
    }

    private static List<Path> markdownFiles(Path dir) {
        try (Stream<Path> files = Files.list(dir)) {
            return files.filter(p -> p.toString().endsWith(".md")).sorted().toList();
        } catch (IOException e) {
            throw new IllegalStateException("cannot list " + dir, e);
        }
    }

    private Long idBySlug(String table, String slug) {
        return jdbc.query("select id from " + table + " where slug = ?", rs -> rs.next() ? rs.getLong(1) : null, slug);
    }

    private Long idByCode(String table, String code) {
        return jdbc.query("select id from " + table + " where code = ?", rs -> rs.next() ? rs.getLong(1) : null, code);
    }

    private static String adminNote(List<String> notes) {
        return notes.isEmpty() ? null : String.join("\n", notes.stream().map(n -> "- " + n).toList());
    }

    private static String nullableText(Object value) {
        return value == null ? null : String.valueOf(value).strip();
    }

    private static Timestamp startOfDay(LocalDate date) {
        return Timestamp.from(date.atStartOfDay().toInstant(ZoneOffset.UTC));
    }
}
