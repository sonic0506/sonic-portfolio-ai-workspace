package dev.portfolio.portfolio_api.profile;

import dev.portfolio.portfolio_api.profile.ProfileResponses.ProfileDetail;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProfileController {

    private final ProfileQueryService profiles;

    public ProfileController(ProfileQueryService profiles) {
        this.profiles = profiles;
    }

    @GetMapping("/api/profile")
    public ProfileDetail get() {
        return profiles.get();
    }
}
