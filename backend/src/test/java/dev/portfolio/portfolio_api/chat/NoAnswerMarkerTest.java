package dev.portfolio.portfolio_api.chat;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

class NoAnswerMarkerTest {

    private static List<String> run(NoAnswerMarker[] holder, String... pieces) {
        List<String> out = new ArrayList<>();
        NoAnswerMarker marker = new NoAnswerMarker(out::add);
        for (String piece : pieces) {
            marker.accept(piece);
        }
        marker.finish();
        holder[0] = marker;
        return out;
    }

    @Test
    void removesMarkerSplitAcrossPiecesAndLeadingSpace() {
        NoAnswerMarker[] m = new NoAnswerMarker[1];
        List<String> out = run(m, "[[NO_", "ANSWER]] OAuth", "에 대해서는 어려워요.");
        assertTrue(m[0].found());
        assertEquals("OAuth에 대해서는 어려워요.", String.join("", out));
        assertEquals("OAuth에 대해서는 어려워요.", m[0].text());
        assertFalse(String.join("", out).contains("["));
    }

    @Test
    void removesMarkerInTheMiddle() {
        NoAnswerMarker[] m = new NoAnswerMarker[1];
        List<String> out = run(m, "A는 이렇습니다 [1]. ", "[[NO_ANSWER]]", "B는 어려워요.");
        assertTrue(m[0].found());
        assertEquals("A는 이렇습니다 [1]. B는 어려워요.", String.join("", out));
    }

    @Test
    void citationBracketsAreNotHeldForever() {
        NoAnswerMarker[] m = new NoAnswerMarker[1];
        List<String> out = run(m, "답변 [", "1].");
        assertFalse(m[0].found());
        assertEquals(List.of("답변 ", "[1]."), out);
    }

    @Test
    void unfinishedMarkerPrefixIsEmittedAtTheEnd() {
        NoAnswerMarker[] m = new NoAnswerMarker[1];
        List<String> out = run(m, "끝 [[NO");
        assertFalse(m[0].found());
        assertEquals("끝 [[NO", String.join("", out));
    }
}
