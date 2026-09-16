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

    private AnswerPrompt() {
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
