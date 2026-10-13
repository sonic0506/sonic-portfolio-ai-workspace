package dev.portfolio.portfolio_api.chat;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

class NoAnswerMarkerTest {

    private static final String GUIDE = "{주제}에 대해서는 어려워요.";

    private static List<String> run(NoAnswerMarker[] holder, String... pieces) {
        List<String> out = new ArrayList<>();
        NoAnswerMarker marker = new NoAnswerMarker(GUIDE, out::add);
        for (String piece : pieces) {
            marker.accept(piece);
        }
        marker.finish();
        holder[0] = marker;
        return out;
    }

    @Test
    void markerSplitAcrossPiecesBecomesTheGuideWithTopic() {
        NoAnswerMarker[] m = new NoAnswerMarker[1];
        List<String> out = run(m, " [[NO_", "ANSWER:OAuth 인증", " 경험]]");
        assertTrue(m[0].found());
        assertEquals("OAuth 인증 경험에 대해서는 어려워요.", String.join("", out));
        assertEquals("OAuth 인증 경험에 대해서는 어려워요.", m[0].text());
    }

    @Test
    void citedPartAfterTheMarkerIsKeptAndUncitedRefusalWordingIsDropped() {
        // 2026-10-14: the model wrote its own "근거에 없습니다" instead of the guide; the server now owns it.
        NoAnswerMarker[] m = new NoAnswerMarker[1];
        List<String> out = run(m, "[[NO_ANSWER:B 경험]] A는 이렇습니다 [1].");
        assertEquals("A는 이렇습니다 [1].\n\nB 경험에 대해서는 어려워요.", String.join("", out));

        out = run(m, "[[NO_ANSWER:magpie 사용 경험]]", " magpie를 쓴 경험은 근거에 없습니다.");
        assertEquals("magpie 사용 경험에 대해서는 어려워요.", String.join("", out));
        assertFalse(m[0].text().contains("근거에 없습니다"));
    }

    @Test
    void textBeforeAMisplacedMarkerStillStreams() {
        NoAnswerMarker[] m = new NoAnswerMarker[1];
        List<String> out = run(m, "A는 이렇습니다 [1]. ", "[[NO_ANSWER:B]]");
        assertEquals("A는 이렇습니다 [1]. \n\nB에 대해서는 어려워요.", String.join("", out));
    }

    @Test
    void oldFormUnclosedMarkerAndQuotesFallBackSafely() {
        NoAnswerMarker[] m = new NoAnswerMarker[1];
        assertEquals("이 질문에 대해서는 어려워요.", String.join("", run(m, "[[NO_ANSWER]]어려워요.")));
        assertEquals("magpie 사용 경험에 대해서는 어려워요.",
                String.join("", run(m, "[[NO_ANSWER:\"magpie 사용 경험\"")));
    }

    @Test
    void heldStartIsReleasedAtTheFirstCitation() {
        NoAnswerMarker[] m = new NoAnswerMarker[1];
        List<String> out = run(m, "답변 [", "1].", " 이어서");
        assertFalse(m[0].found());
        assertEquals(List.of("답변 [1].", " 이어서"), out);
    }

    @Test
    void shortUncitedRefusalWithoutTheMarkerBecomesTheGuide() {
        // 2026-10-14: the model often left out the marker and wrote "…근거에 없습니다." on its own.
        NoAnswerMarker[] m = new NoAnswerMarker[1];
        List<String> out = run(m, "해당 라이브러리를 사용한 ", "프로젝트 경험은 근거에 없습니다.");
        assertFalse(m[0].found());
        assertEquals("이 질문에 대해서는 어려워요.", String.join("", out));
    }

    @Test
    void citationNumbersAloneDoNotCountAsAnAnswer() {
        NoAnswerMarker[] m = new NoAnswerMarker[1];
        assertEquals("이 질문에 대해서는 어려워요.", String.join("", run(m, "[7][8]", "[9]")));
    }

    @Test
    void longUncitedAnswerStreamsUnchanged() {
        NoAnswerMarker[] m = new NoAnswerMarker[1];
        String text = "가".repeat(NoAnswerMarker.HOLD_CHARS + 1);
        List<String> out = run(m, text, " 끝 [[NO");
        assertEquals(text + " 끝 [[NO", String.join("", out));
    }
}
