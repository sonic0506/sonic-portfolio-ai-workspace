package dev.portfolio.portfolio_api.chat;

import java.util.List;

/**
 * ADR-0007 prompt with the ADR-0013 change: when evidence is insufficient the model writes the
 * [[NO_ANSWER]] marker and the configured guide sentence instead of a blunt refusal.
 */
final class AnswerPrompt {

    static final String GUIDE_PLACEHOLDER = "{주제}";

    private static final String SYSTEM_TEMPLATE = """
            너는 개발자 포트폴리오의 질의응답 도우미다.

            - 아래 <근거> 안의 내용만 사용해 답한다. 근거에 없는 사실을 만들지 않는다.
            - 답변에서 사용한 근거는 [1] 같은 번호로 표시한다.
            - 근거에 없는 기술·경험이나 근거로 답할 수 없는 내용은 추측하지 않는다.
            - 질문의 전부 또는 일부를 근거로 답할 수 없으면 답변의 맨 처음에 %s 를 한 번만 쓴다. 그 밖에는 이 표시를 쓰지 않는다.
            - 근거로 답할 수 없는 부분은 아래 안내 문장의 %s 자리에 질문 주제를 넣어 그대로 안내한다. 주제는 질문 문장을 그대로 옮기지 말고 짧은 명사구로 쓴다(예: "어디서 일하세요?" → "현재 근무지", "OAuth 트러블슈팅 경험이 있나요?" → "OAuth 인증 관련 트러블슈팅 경험"). 일부는 답할 수 있으면 그 부분을 먼저 답하고 안내 문장을 덧붙인다.
              안내 문장: %s
            - 제목이 "%s"로 시작하는 근거는 미리 등록된 질문과 답변이다. 질문과 뜻이 같으면 그 답변 문장을 바꾸지 말고 그대로 쓰고 번호로 표시한다. 뜻이 다르면(예: 사는 곳을 등록했는데 일하는 곳을 물음) 쓰지 않는다.""";

    static String system(String guide) {
        return SYSTEM_TEMPLATE.formatted(NoAnswerMarker.MARKER, GUIDE_PLACEHOLDER, guide,
                dev.portfolio.portfolio_api.rag.DocumentProjector.FAQ_TITLE_PREFIX.strip());
    }

    /** Extra rule when earlier turns are included (ADR-0004, RAG-008). */
    static final String HISTORY_RULE = """

            - <이전 대화>는 질문의 뜻을 이해하는 데만 쓴다. 이전 대화에 나온 내용도 <근거>에서 확인되지 않으면 사실로 쓰지 않는다.""";

    /** One earlier question and its answer. */
    record Turn(String question, String answer) {
    }

    private AnswerPrompt() {
    }

    static String system(String guide, List<Turn> history) {
        return history.isEmpty() ? system(guide) : system(guide) + HISTORY_RULE;
    }

    /** Without history this is exactly the PoC layout; with history an <이전 대화> block comes first. */
    static String user(String question, List<Retriever.Hit> evidence, List<Turn> history) {
        if (history.isEmpty()) {
            return user(question, evidence);
        }
        StringBuilder sb = new StringBuilder("<이전 대화>\n");
        for (Turn turn : history) {
            sb.append("사용자: ").append(turn.question()).append('\n')
                    .append("답변: ").append(turn.answer()).append('\n');
        }
        return sb.append("</이전 대화>\n\n").append(user(question, evidence)).toString();
    }

    /** Same layout as run_answer() in the PoC: "[n] title — sections\ntext". */
    static String user(String question, List<Retriever.Hit> evidence) {
        StringBuilder sb = new StringBuilder("<근거>\n");
        for (int i = 0; i < evidence.size(); i++) {
            Retriever.Hit hit = evidence.get(i);
            if (i > 0) {
                sb.append("\n\n");
            }
            sb.append('[').append(i + 1).append("] ").append(hit.document().title())
                    .append(" — ").append(String.join(" + ", hit.sectionTitles()))
                    .append('\n').append(hit.text());
        }
        sb.append("\n</근거>\n\n질문: ").append(question);
        return sb.toString();
    }
}
