package dev.portfolio.portfolio_api.chat;

import dev.portfolio.portfolio_api.chat.ChatEvents.AnswerDelta;
import dev.portfolio.portfolio_api.chat.ChatEvents.Doc;
import dev.portfolio.portfolio_api.chat.ChatEvents.Documents;
import dev.portfolio.portfolio_api.chat.ChatEvents.Done;
import dev.portfolio.portfolio_api.chat.ChatEvents.Sink;
import dev.portfolio.portfolio_api.chat.ChatEvents.Stage;
import dev.portfolio.portfolio_api.chat.ChatEvents.Status;
import dev.portfolio.portfolio_api.rag.EmbeddingClient;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** Single-question RAG pipeline: search → relation expansion → answer → cited sources. */
@Service
public class ChatService {

    private static final Pattern CITATION = Pattern.compile("\\[(\\d+)]");

    private final EmbeddingClient embeddings;
    private final ChatGenerator generator;
    private final Retriever retriever;
    private final FaqMatcher faqs;
    private final String guide;

    public ChatService(EmbeddingClient embeddings, ChatGenerator generator, Retriever retriever, FaqMatcher faqs,
                       @Value("${app.chat.no-answer-guide:}") String guide) {
        this.embeddings = embeddings;
        this.generator = generator;
        this.retriever = retriever;
        this.faqs = faqs;
        this.guide = guide == null || guide.isBlank() ? DEFAULT_GUIDE : guide.strip();
    }

    /** ADR-0013 default; kept in code because .properties files are not reliably read as UTF-8. */
    public static final String DEFAULT_GUIDE = AnswerPrompt.GUIDE_PLACEHOLDER
            + "에 대해서는 지금 정보로는 답변드리기 어려워요. 질문주신 내용은 따로 보관하여 더 보완하도록 하겠습니다. 감사합니다.";

    /** The system prompt sent to the model (for tests and diagnostics). */
    public String systemPrompt(boolean withHistory) {
        return withHistory ? AnswerPrompt.system(guide) + AnswerPrompt.HISTORY_RULE : AnswerPrompt.system(guide);
    }

    public boolean available() {
        return embeddings.enabled() && generator.enabled();
    }

    public enum Unanswered {
        NO_EVIDENCE,
        NO_CITATION
    }

    /**
     * Answer text (marker removed), cited documents, all documents looked at with their best distance,
     * and why it counts as unanswered (null when answered).
     */
    public record Answer(String text, List<Retriever.DocumentRef> cited, List<Retriever.Hit> retrieved,
                         Unanswered unanswered) {
    }

    public Answer answer(String question, Sink sink) {
        return answer(question, List.of(), sink);
    }

    /**
     * history: earlier turns, oldest first. The previous question is added to the search query so that
     * follow-ups ("거기서 맡은 역할은?") retrieve the same topic; facts still come only from retrieved evidence.
     */
    public Answer answer(String question, List<AnswerPrompt.Turn> history, Sink sink) {
        sink.send(ChatEvents.STATUS, new Status(Stage.SEARCHING));
        String searchText = history.isEmpty() ? question
                : history.get(history.size() - 1).question() + "\n" + question;
        float[] query = embeddings.embed(List.of(searchText)).get(0);
        List<Retriever.Hit> evidence = new ArrayList<>(retriever.search(query, Retriever.TOP_K));

        Map<Long, Retriever.DocumentRef> seen = new LinkedHashMap<>();
        evidence.forEach(hit -> seen.putIfAbsent(hit.document().id(), hit.document()));
        if (!seen.isEmpty()) {
            sink.send(ChatEvents.DOCUMENTS, new Documents(seen.values().stream().map(Doc::of).toList()));
        }

        List<Retriever.DocumentRef> related = retriever.related(seen.keySet(), Retriever.MAX_RELATED);
        if (!related.isEmpty()) {
            sink.send(ChatEvents.STATUS, new Status(Stage.EXPANDING));
            List<Doc> added = new ArrayList<>();
            for (Retriever.DocumentRef ref : related) {
                List<Retriever.Hit> best = retriever.bestChunk(ref.id(), query);
                if (!best.isEmpty()) {
                    evidence.addAll(best);
                    seen.putIfAbsent(ref.id(), ref);
                    added.add(Doc.of(ref));
                }
            }
            if (!added.isEmpty()) {
                sink.send(ChatEvents.DOCUMENTS, new Documents(added));
            }
        }

        sink.send(ChatEvents.STATUS, new Status(Stage.ANSWERING));
        String previousQuestion = history.isEmpty() ? null : history.get(history.size() - 1).question();
        var faq = faqs.match(question, previousQuestion, evidence);
        if (faq.isPresent()) {
            // Registered answer, sent unchanged (ADR-0014 follow-up)
            sink.send(ChatEvents.ANSWER_DELTA, new AnswerDelta(faq.get().answer()));
            return new Answer(faq.get().answer(), List.of(faq.get().document()), List.copyOf(evidence), null);
        }
        NoAnswerMarker marker = new NoAnswerMarker(
                delta -> sink.send(ChatEvents.ANSWER_DELTA, new AnswerDelta(delta)));
        generator.stream(AnswerPrompt.system(guide, history), AnswerPrompt.user(question, evidence, history), marker);
        marker.finish();

        String text = marker.text();
        List<Retriever.DocumentRef> cited = citedDocuments(text, evidence);
        Unanswered unanswered = marker.found() ? Unanswered.NO_EVIDENCE
                : cited.isEmpty() ? Unanswered.NO_CITATION : null;
        return new Answer(text, cited, List.copyOf(evidence), unanswered);
    }

    /** Sends the final event; kept separate so a session can store the turn first. */
    public static void done(Sink sink, Answer answer) {
        sink.send(ChatEvents.DONE,
                new Done(answer.cited().stream().map(Doc::of).toList(), answer.unanswered() != null));
    }

    /** Documents whose evidence numbers appear in the answer, in order of first citation. */
    static List<Retriever.DocumentRef> citedDocuments(String answer, List<Retriever.Hit> evidence) {
        Map<Long, Retriever.DocumentRef> cited = new LinkedHashMap<>();
        Matcher m = CITATION.matcher(answer);
        while (m.find()) {
            int n;
            try {
                n = Integer.parseInt(m.group(1));
            } catch (NumberFormatException e) {
                continue;
            }
            if (n >= 1 && n <= evidence.size()) {
                Retriever.DocumentRef ref = evidence.get(n - 1).document();
                cited.putIfAbsent(ref.id(), ref);
            }
        }
        return List.copyOf(cited.values());
    }
}
