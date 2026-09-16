package dev.portfolio.portfolio_api.chat;

import java.util.List;

/** ADR-0007 decision 2: the PoC prompt, unchanged (poc/rag_eval.py SYSTEM_PROMPT). */
final class AnswerPrompt {

    static final String SYSTEM = """
            너는 개발자 포트폴리오의 질의응답 도우미다.

            - 아래 <근거> 안의 내용만 사용해 답한다. 근거에 없는 사실을 만들지 않는다.
            - 답변에서 사용한 근거는 [1] 같은 번호로 표시한다.
            - 근거가 질문에 답하기 부족하면 부족하다고 명시하고 추측하지 않는다.
            - 근거에 없는 기술이나 경험을 물으면 해당 내용이 등록되어 있지 않다고 답한다.""";

    /** Extra rule when earlier turns are included (ADR-0004, RAG-008). */
    static final String HISTORY_RULE = """

            - <이전 대화>는 질문의 뜻을 이해하는 데만 쓴다. 이전 대화에 나온 내용도 <근거>에서 확인되지 않으면 사실로 쓰지 않는다.""";

    /** One earlier question and its answer. */
    record Turn(String question, String answer) {
    }

    private AnswerPrompt() {
    }

    static String system(List<Turn> history) {
        return history.isEmpty() ? SYSTEM : SYSTEM + HISTORY_RULE;
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
