package dev.portfolio.portfolio_api.rag;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import dev.portfolio.portfolio_api.rag.Chunker.Chunk;
import java.util.List;
import org.junit.jupiter.api.Test;

class ChunkerTest {

    @Test
    void mergesShortSectionsAndKeepsAllTitles() {
        String longBody = "가".repeat(250);
        List<Chunk> chunks = Chunker.chunk("## 개요\n\n짧음\n\n## 배경\n\n" + longBody + "\n\n## 정리\n\n끝");
        // "개요" is short → the next section joins it; "정리" is short → joins the previous chunk
        assertEquals(1, chunks.size());
        assertEquals(List.of("개요", "배경", "정리"), chunks.get(0).sectionTitles());
        assertEquals("개요\n\n짧음\n\n배경\n\n" + longBody + "\n\n정리\n\n끝", chunks.get(0).text());
    }

    @Test
    void keepsLongSectionsSeparateAndSplitsOverTheLimitOnBlankLines() {
        String para = "나".repeat(700);
        List<Chunk> chunks = Chunker.chunk("## A\n\n" + "다".repeat(300) + "\n\n## B\n\n" + para + "\n\n" + para);
        assertEquals(3, chunks.size());
        assertEquals(List.of("B"), chunks.get(1).sectionTitles());
        assertEquals("B\n\n" + para, chunks.get(1).text());
        assertEquals("B\n\n" + para, chunks.get(2).text());
    }

    @Test
    void leadTextBecomesIntroSectionAndEmptySectionsAreSkipped() {
        List<Chunk> chunks = Chunker.chunk("머리말 " + "라".repeat(300) + "\n\n## 빈 섹션\n\n\n## 본문\n\n" + "마".repeat(300));
        assertEquals(2, chunks.size());
        assertEquals(List.of("(도입)"), chunks.get(0).sectionTitles());
        assertEquals(List.of("본문"), chunks.get(1).sectionTitles());
    }

    @Test
    void countsCodePointsLikePython() {
        assertEquals(3, Chunker.length("a😀b"));
        assertTrue(Chunker.chunk("").isEmpty());
    }
}
