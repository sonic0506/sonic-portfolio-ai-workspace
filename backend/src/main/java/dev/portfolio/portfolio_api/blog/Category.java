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

    protected Category() {
    }

    Category(String code, String name, int displayOrder, String color) {
        update(code, name, displayOrder, color);
    }

    void update(String code, String name, int displayOrder, String color) {
        this.code = code;
        this.name = name;
        this.displayOrder = displayOrder;
        this.color = color.toUpperCase(java.util.Locale.ROOT);
    }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public String getName() { return name; }
    public int getDisplayOrder() { return displayOrder; }
    public String getColor() { return color; }
}
