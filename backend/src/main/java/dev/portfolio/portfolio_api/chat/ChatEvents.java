package dev.portfolio.portfolio_api.chat;

import java.util.List;

/** SSE payloads (API_DESIGN "Chat Progress Stream"). Event names are the constants below. */
public final class ChatEvents {

    public static final String STATUS = "status";
    public static final String DOCUMENTS = "documents";
    public static final String ANSWER_DELTA = "answer_delta";
    public static final String DONE = "done";
    public static final String ERROR = "error";

    public enum Stage {
        SEARCHING,
        EXPANDING,
        ANSWERING
    }

    private ChatEvents() {
    }

    public record Status(Stage stage) {
    }

    public record Doc(String type, String slug, String title, String url) {
        static Doc of(Retriever.DocumentRef ref) {
            return new Doc(ref.type(), ref.slug(), ref.title(), ref.url());
        }
    }

    public record Documents(List<Doc> documents) {
    }

    public record AnswerDelta(String text) {
    }

    /** unanswered: the answer could not (fully) use public evidence and the question was kept (ADR-0013). */
    public record Done(List<Doc> sources, boolean unanswered) {
    }

    public record Error(String message) {
    }

    /** Where the pipeline writes events; the controller adapts it to SSE. */
    public interface Sink {
        void send(String event, Object payload);
    }
}
