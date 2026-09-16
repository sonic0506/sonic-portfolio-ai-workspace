package dev.portfolio.portfolio_api.blog;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, Long id);

    List<Category> findAllByOrderByDisplayOrderAscCodeAsc();
}
