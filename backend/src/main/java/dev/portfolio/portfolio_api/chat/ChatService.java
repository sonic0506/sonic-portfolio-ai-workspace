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
import org.springframework.stereotype.Service;

/** Single-question RAG pipeline: search → relation expansion → answer → cited sources. */
@Service
public class ChatService {

    private static final Pattern CITATION = Pattern.compile("\\[(\\d+)]");

    private final EmbeddingClient embeddings;
    private final ChatGenerator generator;
    private final Retriever retriever;

    public ChatService(EmbeddingClient embeddings, ChatGenerator generator, Retriever retriever) {
        this.embeddings = embeddings;
        this.generator = generator;
        this.retriever = retriever;
    }

    public boolean available() {
        return embeddings.enabled() && generator.enabled();
    }

    public void answer(String question, Sink sink) {
        sink.send(ChatEvents.STATUS, new Status(Stage.SEARCHING));
        float[] query = embeddings.embed(List.of(question)).get(0);
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
        StringBuilder answer = new StringBuilder();
        generator.stream(AnswerPrompt.SYSTEM, AnswerPrompt.user(question, evidence), delta -> {
            answer.append(delta);
            sink.send(ChatEvents.ANSWER_DELTA, new AnswerDelta(delta));
        });

        sink.send(ChatEvents.DONE, new Done(citedDocuments(answer.toString(), evidence)));
    }

    /** Documents whose evidence numbers appear in the answer, in order of first citation. */
    static List<Doc> citedDocuments(String answer, List<Retriever.Hit> evidence) {
        Map<Long, Doc> cited = new LinkedHashMap<>();
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
                cited.putIfAbsent(ref.id(), Doc.of(ref));
            }
        }
        return List.copyOf(cited.values());
    }
}
