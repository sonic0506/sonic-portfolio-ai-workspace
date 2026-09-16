package dev.portfolio.portfolio_api.profile;

import dev.portfolio.portfolio_api.profile.ProfileAdminResponses.AdminProfileDetail;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/profile")
public class ProfileAdminController {

    private final ProfileAdminService service;

    public ProfileAdminController(ProfileAdminService service) {
        this.service = service;
    }

    /** 404 until the first PUT creates the profile. */
    @GetMapping
    public AdminProfileDetail get() {
        return service.get();
    }

    @PutMapping
    public AdminProfileDetail save(@Valid @RequestBody ProfileAdminRequest request) {
        return service.save(request);
    }
}
