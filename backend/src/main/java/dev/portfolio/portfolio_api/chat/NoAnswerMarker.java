package dev.portfolio.portfolio_api.chat;

import java.util.function.Consumer;

/**
 * Removes the model's [[NO_ANSWER]] marker from a streamed answer (ADR-0013). Text that could still
 * become a marker is held back until the next piece arrives, so a marker split across pieces never
 * reaches the client. Leading whitespace of the answer is dropped.
 */
final class NoAnswerMarker implements Consumer<String> {

    static final String MARKER = "[[NO_ANSWER]]";

    private final Consumer<String> downstream;
    private final StringBuilder pending = new StringBuilder();
    private final StringBuilder emitted = new StringBuilder();
    private boolean found;

    NoAnswerMarker(Consumer<String> downstream) {
        this.downstream = downstream;
    }

    @Override
    public void accept(String piece) {
        pending.append(piece);
        removeMarkers();
        int hold = heldSuffixLength();
        emit(pending.substring(0, pending.length() - hold));
        pending.delete(0, pending.length() - hold);
    }

    /** Emits whatever is left at the end of the answer. */
    void finish() {
        removeMarkers();
        emit(pending.toString());
        pending.setLength(0);
    }

    boolean found() {
        return found;
    }

    /** The answer as the client saw it. */
    String text() {
        return emitted.toString();
    }

    private void removeMarkers() {
        int at;
        while ((at = pending.indexOf(MARKER)) >= 0) {
            pending.delete(at, at + MARKER.length());
            found = true;
        }
    }

    /** Longest suffix of pending that is a proper prefix of the marker. */
    private int heldSuffixLength() {
        for (int len = Math.min(MARKER.length() - 1, pending.length()); len > 0; len--) {
            if (MARKER.startsWith(pending.substring(pending.length() - len))) {
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
