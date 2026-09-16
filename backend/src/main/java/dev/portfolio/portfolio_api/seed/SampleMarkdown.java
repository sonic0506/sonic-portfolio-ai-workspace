package dev.portfolio.portfolio_api.seed;

import dev.portfolio.portfolio_api.content.SectionRequest;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.SafeConstructor;

/** A sample file: YAML front matter + body split into "## " sections. */
record SampleMarkdown(Path path, Map<String, Object> meta, List<SectionRequest> sections) {

    static SampleMarkdown read(Path path) {
        String text;
        try {
            text = Files.readString(path, StandardCharsets.UTF_8).replace("\r\n", "\n");
        } catch (IOException e) {
            throw new IllegalStateException("cannot read " + path, e);
        }
        if (!text.startsWith("---\n")) {
            throw new IllegalStateException(path + ": missing front matter");
        }
        int end = text.indexOf("\n---\n", 4);
        if (end < 0) {
            throw new IllegalStateException(path + ": unterminated front matter");
        }
        Object loaded;
        try {
            loaded = new Yaml(new SafeConstructor(new LoaderOptions())).load(text.substring(4, end));
        } catch (RuntimeException e) {
            throw new IllegalStateException(path + ": invalid front matter YAML", e);
        }
        @SuppressWarnings("unchecked")
        Map<String, Object> meta = loaded instanceof Map<?, ?> m ? (Map<String, Object>) m : new LinkedHashMap<>();
        return new SampleMarkdown(path, meta, sections(text.substring(end + 5)));
    }

    /** Splits on level-2 headings; text before the first heading is ignored. */
    static List<SectionRequest> sections(String body) {
        List<SectionRequest> result = new ArrayList<>();
        String title = null;
        StringBuilder current = new StringBuilder();
        for (String line : body.split("\n", -1)) {
            if (line.startsWith("## ")) {
                if (title != null) {
                    result.add(new SectionRequest(title, current.toString().strip()));
                }
                title = line.substring(3).strip();
                current.setLength(0);
            } else if (title != null) {
                current.append(line).append('\n');
            }
        }
        if (title != null) {
            result.add(new SectionRequest(title, current.toString().strip()));
        }
        return result;
    }

    String text(String key) {
        Object value = meta.get(key);
        return value == null ? null : String.valueOf(value).strip();
    }

    String requiredText(String key) {
        String value = text(key);
        if (value == null || value.isEmpty()) {
            throw new IllegalStateException(path + ": missing " + key);
        }
        return value;
    }

    boolean bool(String key) {
        return Boolean.TRUE.equals(meta.get(key));
    }

    Integer integer(String key) {
        Object value = meta.get(key);
        return value instanceof Number n ? n.intValue() : null;
    }

    List<String> list(String key) {
        Object value = meta.get(key);
        if (value == null) {
            return List.of();
        }
        if (!(value instanceof List<?> items)) {
            throw new IllegalStateException(path + ": " + key + " must be a list");
        }
        return items.stream().map(item -> String.valueOf(item).strip()).toList();
    }

    @SuppressWarnings("unchecked")
    Map<String, Object> map(String key) {
        Object value = meta.get(key);
        return value instanceof Map<?, ?> m ? (Map<String, Object>) m : Map.of();
    }

    @SuppressWarnings("unchecked")
    List<Map<String, Object>> maps(String key) {
        Object value = meta.get(key);
        return value instanceof List<?> l ? (List<Map<String, Object>>) l : List.of();
    }

    /** Accepts YYYY-MM (first day of month), YYYY-MM-DD, or a YAML date. */
    static LocalDate date(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof java.util.Date d) {
            return d.toInstant().atZone(java.time.ZoneOffset.UTC).toLocalDate();
        }
        String text = String.valueOf(value).strip();
        return text.length() == 7 ? LocalDate.parse(text + "-01") : LocalDate.parse(text);
    }
}
