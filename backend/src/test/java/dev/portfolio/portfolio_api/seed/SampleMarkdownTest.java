package dev.portfolio.portfolio_api.seed;

import static org.assertj.core.api.Assertions.assertThat;

import dev.portfolio.portfolio_api.content.SectionRequest;
import java.util.List;
import org.junit.jupiter.api.Test;

class SampleMarkdownTest {

    @Test
    void headingLinesInsideCodeFencesStayInTheBody() {
        String body = """
                ## 계층형 청킹

                ```text
                ## 교통비
                KTX 일반실 기준
                ```

                ````markdown
                ```
                ## 예시 안의 예시
                ```
                ````

                ## 다음 섹션
                본문
                """;

        List<SectionRequest> sections = SampleMarkdown.sections(body);

        assertThat(sections).extracting(SectionRequest::title).containsExactly("계층형 청킹", "다음 섹션");
        assertThat(sections.get(0).bodyMarkdown()).contains("## 교통비", "## 예시 안의 예시");
    }
}
