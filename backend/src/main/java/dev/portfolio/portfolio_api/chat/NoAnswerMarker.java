package dev.portfolio.portfolio_api.chat;

import java.util.function.Consumer;

/**
 * Turns the model's [[NO_ANSWER:주제]] marker into the configured guide sentence (ADR-0013, wording fixed by
 * the server since 2026-10-14). The marker comes first; what follows is held until the end. If it cites
 * evidence it is the part the model could answer and is sent before the guide; otherwise it is the model's
 * own refusal wording and is dropped, so a fully unanswered question always reads exactly as the guide.
 * Text before a (misplaced) marker streams as usual. Text that could still become a marker is held back,
 * so a marker split across pieces never reaches the client. Leading whitespace of the answer is dropped.
 */
final class NoAnswerMarker implements Consumer<String> {

    static final String START = "[[NO_ANSWER";
    private static final String END = "]]";
    private static final java.util.regex.Pattern CITATION = java.util.regex.Pattern.compile("\\[\\d+]");
    /** Used when the model gives no topic (or the old [[NO_ANSWER]] form). */
    static final String FALLBACK_TOPIC = "이 질문";
    private static final int MAX_TOPIC = 60;
    /**
     * The start of an answer is held until it cites evidence or passes this length. Refusals are short and
     * uncited; holding them lets the server replace a refusal written without the marker as well.
     */
    static final int HOLD_CHARS = 200;

    private final String guide;
    private final Consumer<String> downstream;
    private final StringBuilder pending = new StringBuilder();
    private final StringBuilder emitted = new StringBuilder();
    /** Text after the marker, decided on at finish(). */
    private final StringBuilder tail = new StringBuilder();
    private boolean found;
    /** Set once the held start cited evidence or grew past HOLD_CHARS. */
    private boolean streaming;
    private String topic;

    NoAnswerMarker(String guide, Consumer<String> downstream) {
        this.guide = guide;
        this.downstream = downstream;
    }

    @Override
    public void accept(String piece) {
        if (found) {
            tail.append(piece);
            return;
        }
        pending.append(piece);
        int at = pending.indexOf(START);
        if (at >= 0) {
            if (streaming) {
                emit(pending.substring(0, at));
            } else {
                tail.append(pending, 0, at); // still held: judged with the rest at finish()
            }
            pending.delete(0, at);
            int end = pending.indexOf(END);
            if (end >= 0) {
                String rest = pending.substring(end + END.length());
                markFound(pending.substring(START.length(), end));
                tail.append(rest);
            }
            return;
        }
        if (!streaming) {
            if (!(cites(pending) || pending.length() > HOLD_CHARS)) {
                return;
            }
            streaming = true;
        }
        int hold = heldSuffixLength();
        emit(pending.substring(0, pending.length() - hold));
        pending.delete(0, pending.length() - hold);
    }

    /** Emits whatever is left and, when the marker was seen, the guide sentence. */
    void finish() {
        if (!found && pending.indexOf(START) == 0) {
            markFound(pending.substring(START.length()).replace("]", "")); // marker never closed
        }
        if (!found) {
            // Still held means short and uncited: the model's own refusal without the marker (NO_CITATION).
            emit(streaming ? pending.toString() : guide.replace(AnswerPrompt.GUIDE_PLACEHOLDER, FALLBACK_TOPIC));
            pending.setLength(0);
            return;
        }
        String answered = tail.toString().strip();
        if (cites(answered)) {
            emit(answered);
        }
        emit((emitted.toString().isBlank() ? "" : "\n\n") + guide.replace(AnswerPrompt.GUIDE_PLACEHOLDER, topic));
    }

    boolean found() {
        return found;
    }

    /** The answer as the client saw it. */
    String text() {
        return emitted.toString();
    }

    /** Cites evidence and says something besides the citation numbers ("[7][8]" alone does not count). */
    private static boolean cites(CharSequence text) {
        return CITATION.matcher(text).find() && !CITATION.matcher(text).replaceAll("").isBlank();
    }

    /** raw: what follows "[[NO_ANSWER" up to "]]", normally ":주제". */
    private void markFound(String raw) {
        found = true;
        pending.setLength(0);
        String t = raw.strip();
        t = t.startsWith(":") ? t.substring(1) : t;
        t = t.replaceAll("[\"'“”‘’]", "").strip();
        topic = t.isEmpty() ? FALLBACK_TOPIC : t.length() > MAX_TOPIC ? t.substring(0, MAX_TOPIC) : t;
    }

    /** Longest suffix of pending that is a proper prefix of the marker start. */
    private int heldSuffixLength() {
        for (int len = Math.min(START.length() - 1, pending.length()); len > 0; len--) {
            if (START.startsWith(pending.substring(pending.length() - len))) {
                return len;
            }
        }
        return 0;
    }

    private void emit(String text) {
        if (emitted.isEmpty()) {
            text = text.stripLeading();
        }
        if (!text.isEmpty()) {
            emitted.append(text);
            downstream.accept(text);
        }
    }
}
