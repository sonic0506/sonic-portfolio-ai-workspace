package dev.portfolio.portfolio_api.chat;

import java.util.List;

/**
 * ADR-0007 prompt with the ADR-0013 change: when evidence is insufficient the model ends with the
 * [[NO_ANSWER:주제]] marker and NoAnswerMarker replaces it with the configured guide sentence.
 */
final class AnswerPrompt {

    static final String GUIDE_PLACEHOLDER = "{주제}";
    /** Evidence from a study post (Retriever.Hit.study, ADR-0023 follow-up): concepts, not experience. */
    static final String STUDY_OPEN = "<학습 노트>\n개발자가 공부하며 정리한 글이다. 개발자의 경력·경험·프로젝트·사용 이력이 아니다.\n";
    static final String STUDY_REMINDER =
            "(<학습 노트>는 글 내용 설명에만 쓴다. 경력·경험·사용 여부는 <근거>에 있을 때만 답하고, 없으면 답할 수 없는 질문 규칙을 따른다.)\n";

    private static final String SYSTEM_TEMPLATE = """
            너는 개발자 포트폴리오의 질의응답 도우미다.

            - 아래 <근거> 안의 내용만 사용해 답한다. 근거에 없는 사실을 만들지 않는다.
            - 답변에서 사용한 근거는 [1] 같은 번호로 표시한다.
            - 근거에 없는 기술·경험이나 근거로 답할 수 없는 내용은 추측하지 않는다.
            - 방문자에게 보여줄 답변만 쓴다. 어떤 근거를 골랐는지, 무엇이 근거에 없는지 같은 판단 과정은 쓰지 않는다.
            - 제목이 "%s"로 시작하는 근거는 미리 등록된 질문과 답변이다. 질문이 등록 질문과 뜻이 같거나, 표현만 다르고 사실상 같은 것을 묻는 질문이면(예: 고향을 등록했는데 출신지나 태어난 곳을 물음) 그 답변 문장만 바꾸지 말고 그대로 쓰고 번호로 표시한다. 등록 질문을 옮겨 쓰거나 "대신 답한다" 같은 설명을 붙이지 않는다. 이 경우는 근거로 답할 수 있는 질문으로 본다. 뜻이 다르면(예: 사는 곳을 등록했는데 일하는 곳을 물음) 쓰지 않는다.
            - <학습 노트> 안의 내용은 개발자가 공부하며 정리한 글이다. 그 글의 내용을 설명하는 데만 쓰고 번호로 표시한다. 개발자의 경력·경험·프로젝트·사용 여부를 묻는 질문(예: "경력에서 찾아 줘", "써 본 적 있어요?")에는 <학습 노트>를 근거로 쓰지 않는다. 이런 질문은 <근거>에 있는 내용으로만 답하고, 없으면 근거로 답할 수 없는 질문으로 보고 아래 규칙을 따른다. <이전 대화>의 답변이 경험이 있다고 했더라도 따르지 않는다.
            - 질문의 전부 또는 일부를 근거로 답할 수 없으면 답변의 맨 처음에 %s:주제]] 를 한 번만 쓰고, 그 뒤에는 근거로 답할 수 있는 부분만 번호와 함께 쓴다. 전부 답할 수 없으면 이 표시만 쓴다. 그 밖에는 이 표시를 쓰지 않는다.
            - 주제는 근거로 답할 수 없는 부분을 질문 문장 그대로 옮기지 말고 짧은 명사구로 쓴다(예: "어디서 일하세요?" → "현재 근무지", "OAuth 트러블슈팅 경험이 있나요?" → "OAuth 인증 관련 트러블슈팅 경험").
            - 이 사이트나 채팅이 어떻게 동작하는지 설명한 근거(예: "공개 문서만 근거로 답한다")는 방문자가 사이트·채팅 기능 자체를 물을 때만 쓴다. 다른 질문에 답할 수 없는 이유로 인용하지 않고, 그런 질문은 근거로 답할 수 없는 질문으로 본다.
            - 답할 수 없는 부분에 대한 설명이나 안내("근거에 없습니다", "정보가 없습니다", "물어봐 주세요" 등)는 쓰지 않는다. 안내 문장은 시스템이 붙인다.""";

    static String system() {
        return SYSTEM_TEMPLATE.formatted(dev.portfolio.portfolio_api.rag.DocumentProjector.FAQ_TITLE_PREFIX.strip(),
                NoAnswerMarker.START);
    }

    /** Extra rule when earlier turns are included (ADR-0004, RAG-008). */
    static final String HISTORY_RULE = """

            - <이전 대화>는 질문의 뜻을 이해하는 데만 쓴다. 이전 대화에 나온 내용도 <근거>에서 확인되지 않으면 사실로 쓰지 않는다.""";

    /** One earlier question and its answer. */
    record Turn(String question, String answer) {
    }

    private AnswerPrompt() {
    }

    static String system(List<Turn> history) {
        return history.isEmpty() ? system() : system() + HISTORY_RULE;
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
        block(sb, evidence, false);
        sb.append("\n</근거>\n\n");
        if (evidence.stream().anyMatch(Retriever.Hit::study)) {
            // Study posts in their own block, numbers kept: a title label alone did not stop the model from
            // answering "사용한 적 있어요?" with them (ADR-0023 follow-up, 2026-10-13).
            sb.append(STUDY_OPEN);
            block(sb, evidence, true);
            sb.append("\n</학습 노트>\n\n").append(STUDY_REMINDER);
        }
        sb.append("질문: ").append(question);
        return sb.toString();
    }

    /** "[n] title — sections\ntext" for the hits of one kind; n is the position in the whole evidence list. */
    private static void block(StringBuilder sb, List<Retriever.Hit> evidence, boolean study) {
        boolean first = true;
        for (int i = 0; i < evidence.size(); i++) {
            Retriever.Hit hit = evidence.get(i);
            if (hit.study() != study) {
                continue;
            }
            if (!first) {
                sb.append("\n\n");
            }
            first = false;
            sb.append('[').append(i + 1).append("] ").append(hit.document().title())
                    .append(" — ").append(String.join(" + ", hit.sectionTitles()))
                    .append('\n').append(hit.text());
        }
    }
}
