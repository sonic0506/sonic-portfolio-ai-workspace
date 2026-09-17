package dev.portfolio.portfolio_api.chat;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Decides whether a question asks the same thing as a retrieved FAQ (ADR-0014 follow-up, 2026-09-17).
 * The model only answers with an item number; on a match the registered answer is sent unchanged,
 * so the wording never varies and no reasoning leaks into the answer.
 */
@Component
public class FaqMatcher {

    /** Starts the judge's system prompt; tests use it to tell judge calls from answer calls. */
    public static final String SYSTEM_HEAD = "너는 질문 분류기다.";

    static final String SYSTEM = SYSTEM_HEAD + """

            방문자 질문이 아래 등록 질문 중 하나와 사실상 같은 정보를 묻는지 판단한다.
            - 표현이 달라도 원하는 정보가 같으면 같은 질문이다(예: "고향이 어디세요?" ↔ "어디서 태어나셨나요?", "출신이 어디예요?").
            - 원하는 정보가 다르면 다른 질문이다(예: "어디 사세요?" ↔ "어디서 일하세요?").
            - 방문자 질문이 등록 질문의 내용 말고 다른 내용도 함께 물으면 같은 질문이 아니다.
            - <이전 질문>이 있으면 방문자 질문의 뜻을 이해하는 데만 쓴다.
            같은 질문인 항목의 번호 하나만 출력한다. 없으면 0만 출력한다. 숫자 말고 다른 글자는 쓰지 않는다.""";

    private static final Pattern NUMBER = Pattern.compile("\\d+");
    private static final String FAQ_SLUG_PREFIX = "faq-";

    /** Registered answer and the document to cite. */
    public record Match(String answer, Retriever.DocumentRef document) {
    }

    private record Candidate(Retriever.DocumentRef document, String question, List<String> aliases, String answer) {
    }

    private final JdbcTemplate jdbc;
    private final ChatGenerator generator;

    public FaqMatcher(JdbcTemplate jdbc, ChatGenerator generator) {
        this.jdbc = jdbc;
        this.generator = generator;
    }

    /** Empty when no FAQ was retrieved (no model call) or the model found no same question. */
    public Optional<Match> match(String question, String previousQuestion, List<Retriever.Hit> evidence) {
        List<Candidate> candidates = candidates(evidence);
        if (candidates.isEmpty()) {
            return Optional.empty();
        }
        StringBuilder out = new StringBuilder();
        generator.stream(SYSTEM, user(question, previousQuestion, candidates), out::append);
        Matcher m = NUMBER.matcher(out);
        if (!m.find()) {
            return Optional.empty();
        }
        int n;
        try {
            n = Integer.parseInt(m.group());
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
        if (n < 1 || n > candidates.size()) {
            return Optional.empty();
        }
        Candidate c = candidates.get(n - 1);
        return Optional.of(new Match(c.answer(), c.document()));
    }

    static String user(String question, String previousQuestion, List<Candidate> candidates) {
        StringBuilder sb = new StringBuilder("<등록 질문>\n");
        for (int i = 0; i < candidates.size(); i++) {
            Candidate c = candidates.get(i);
            sb.append(i + 1).append(". ").append(c.question());
            if (!c.aliases().isEmpty()) {
                sb.append(" (같은 뜻: ").append(String.join(", ", c.aliases())).append(')');
            }
            sb.append('\n');
        }
        sb.append("</등록 질문>\n\n");
        if (previousQuestion != null && !previousQuestion.isBlank()) {
            sb.append("<이전 질문>").append(previousQuestion).append("</이전 질문>\n");
        }
        return sb.append("방문자 질문: ").append(question).toString();
    }

    /** Published FAQs among the retrieved documents, in retrieval order. */
    private List<Candidate> candidates(List<Retriever.Hit> evidence) {
        Map<Long, Retriever.DocumentRef> refs = new LinkedHashMap<>();
        for (Retriever.Hit hit : evidence) {
            Retriever.DocumentRef ref = hit.document();
            if ("FAQ".equals(ref.type()) && ref.slug() != null && ref.slug().startsWith(FAQ_SLUG_PREFIX)) {
                try {
                    refs.putIfAbsent(Long.parseLong(ref.slug().substring(FAQ_SLUG_PREFIX.length())), ref);
                } catch (NumberFormatException ignored) {
                    // not a FAQ slug we produced
                }
            }
        }
        List<Candidate> result = new ArrayList<>();
        for (Map.Entry<Long, Retriever.DocumentRef> e : refs.entrySet()) {
            List<Map<String, Object>> rows = jdbc.queryForList(
                    "select question, answer from faq where id = ? and published", e.getKey());
            if (rows.isEmpty()) {
                continue;
            }
            List<String> aliases = jdbc.queryForList(
                    "select question from faq_alias where faq_id = ? order by display_order, id", String.class, e.getKey());
            result.add(new Candidate(e.getValue(), (String) rows.get(0).get("question"), aliases,
                    (String) rows.get(0).get("answer")));
        }
        return result;
    }
}
