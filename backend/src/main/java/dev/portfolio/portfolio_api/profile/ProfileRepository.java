package dev.portfolio.portfolio_api.profile;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfileRepository extends JpaRepository<Profile, Long> {

    /** MVP keeps a single profile row; the lowest id is the one used. */
    Optional<Profile> findFirstByOrderByIdAsc();
}
