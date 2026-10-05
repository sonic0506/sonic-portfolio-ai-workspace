package dev.portfolio.portfolio_api.blog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "category")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    /** "#RRGGBB", uppercase (V5 check constraint). */
    @Column(nullable = false)
    private String color;

    /** Whether posts in this category are chat evidence (ADR-0018). */
    @Column(name = "rag_enabled", nullable = false)
    private boolean ragEnabled;

    protected Category() {
    }

    Category(String code, String name, int displayOrder, String color, boolean ragEnabled) {
        update(code, name, displayOrder, color, ragEnabled);
    }

    void update(String code, String name, int displayOrder, String color, boolean ragEnabled) {
        this.code = code;
        this.name = name;
        this.displayOrder = displayOrder;
        this.color = color.toUpperCase(java.util.Locale.ROOT);
        this.ragEnabled = ragEnabled;
    }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public int getDisplayOrder() { return displayOrder; }
    public String getColor() { return color; }
    public boolean isRagEnabled() { return ragEnabled; }
}
