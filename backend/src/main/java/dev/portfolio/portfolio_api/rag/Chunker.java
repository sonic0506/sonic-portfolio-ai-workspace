package dev.portfolio.portfolio_api.rag;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Port of chunk_bounded() in poc/rag_eval.py (ADR-0006 decision 2). Keep the two in sync:
 * split on "## " headings, split bodies longer than MAX_CHARS on blank lines, and merge a piece into
 * the previous chunk when either is shorter than MIN_CHARS. Lengths are code points, like Python len().
 */
public final class Chunker {

    public static final int MAX_CHARS = 1200;
    public static final int MIN_CHARS = 200;

    private static final Pattern HEADING = Pattern.compile("^## +(.+)$", Pattern.MULTILINE);

    public record Chunk(List<String> sectionTitles, String text) {
    }

    private Chunker() {
    }

    public static List<Chunk> chunk(String content) {
        List<StringBuilder> texts = new ArrayList<>();
        List<List<String>> titleLists = new ArrayList<>();
        for (String[] section : sections(content)) {
            String title = section[0];
            String body = section[1];
            if (body.isEmpty()) {
                continue;
            }
            for (String piece : splitLong(body)) {
                String text = title + "\n\n" + piece;
                int last = texts.size() - 1;
                if (last >= 0 && (length(text) < MIN_CHARS || length(texts.get(last)) < MIN_CHARS)) {
                    texts.get(last).append("\n\n").append(text);
                    titleLists.get(last).add(title);
                } else {
                    texts.add(new StringBuilder(text));
                    titleLists.add(new ArrayList<>(List.of(title)));
                }
            }
        }
        List<Chunk> chunks = new ArrayList<>();
        for (int i = 0; i < texts.size(); i++) {
            chunks.add(new Chunk(List.copyOf(titleLists.get(i)), texts.get(i).toString()));
        }
        return chunks;
    }

    /** (title, body) pairs; text before the first heading becomes "(도입)". */
    static List<String[]> sections(String content) {
        List<String[]> result = new ArrayList<>();
        Matcher m = HEADING.matcher(content);
        List<int[]> spans = new ArrayList<>();
        List<String> titles = new ArrayList<>();
        while (m.find()) {
            spans.add(new int[] {m.start(), m.end()});
            titles.add(m.group(1).strip());
        }
        String lead = (spans.isEmpty() ? content : content.substring(0, spans.get(0)[0])).strip();
        if (!lead.isEmpty()) {
            result.add(new String[] {"(도입)", lead});
        }
        for (int i = 0; i < spans.size(); i++) {
            int end = i + 1 < spans.size() ? spans.get(i + 1)[0] : content.length();
            result.add(new String[] {titles.get(i), content.substring(spans.get(i)[1], end).strip()});
        }
        return result;
    }

    static List<String> splitLong(String body) {
        if (length(body) <= MAX_CHARS) {
            return List.of(body);
        }
        List<String> pieces = new ArrayList<>();
        String cur = "";
        for (String para : body.split("\n\n", -1)) {
            if (!cur.isEmpty() && length(cur) + length(para) + 2 > MAX_CHARS) {
                pieces.add(cur);
                cur = para;
            } else {
                cur = cur.isEmpty() ? para : cur + "\n\n" + para;
            }
        }
        if (!cur.isEmpty()) {
            pieces.add(cur);
        }
        return pieces;
    }

    static int length(CharSequence text) {
        return Character.codePointCount(text, 0, text.length());
    }
}
