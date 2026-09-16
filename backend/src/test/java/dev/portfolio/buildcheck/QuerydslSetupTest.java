package dev.portfolio.buildcheck;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class QuerydslSetupTest {
    @Test
    void generatedJakartaMetamodelBuildsPredicate() {
        assertEquals("dependencyProbe.title = Java", QDependencyProbe.dependencyProbe.title.eq("Java").toString());
    }
}

@Entity
class DependencyProbe {
    @Id Long id;
    String title;
}
