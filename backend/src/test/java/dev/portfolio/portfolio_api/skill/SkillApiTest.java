package dev.portfolio.portfolio_api.skill;

import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest
@ActiveProfiles("local")
@Transactional // every test's rows are rolled back
class SkillApiTest {

    @Autowired WebApplicationContext context;
    @Autowired JdbcTemplate jdbc;

    MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        jdbc.update("delete from skill");
    }

    @Test
    void listsSkillsOrderedByCodeWithoutInternalFields() throws Exception {
        insert("react", "React", null);
        insert("java", "Java", "java");

        mockMvc.perform(get("/api/skills"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].code").value("java"))
                .andExpect(jsonPath("$[0].name").value("Java"))
                .andExpect(jsonPath("$[0].iconKey").value("java"))
                .andExpect(jsonPath("$[0].id").isNumber())
                .andExpect(jsonPath("$[0].createdAt").doesNotExist())
                .andExpect(jsonPath("$[1].code").value("react"))
                .andExpect(jsonPath("$[1].iconKey").value(nullValue()));
    }

    @Test
    void returnsEmptyArrayWhenNoSkills() throws Exception {
        mockMvc.perform(get("/api/skills"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    void rejectsDuplicateCode() {
        insert("java", "Java", null);
        assertThrows(DataIntegrityViolationException.class, () -> insert("java", "Java 21", null));
    }

    @Test
    void keepsOtherEndpointsClosedToAnonymousUsers() throws Exception {
        mockMvc.perform(get("/api/admin/skills"))
                .andExpect(status().is4xxClientError());
    }

    private void insert(String code, String name, String iconKey) {
        jdbc.update("insert into skill (code, name, icon_key) values (?, ?, ?)", code, name, iconKey);
    }
}
