package dev.portfolio.portfolio_api.media;

import dev.portfolio.portfolio_api.media.MediaAdminService.MediaItem;
import dev.portfolio.portfolio_api.media.MediaAdminService.UploadRequest;
import dev.portfolio.portfolio_api.media.MediaAdminService.UploadTicket;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Image uploads (ADR-0020): the browser sends the file straight to S3 with the returned ticket. */
@RestController
@RequestMapping("/api/admin/media")
public class MediaAdminController {

    private final MediaAdminService service;

    public MediaAdminController(MediaAdminService service) {
        this.service = service;
    }

    @PostMapping("/uploads")
    @ResponseStatus(HttpStatus.CREATED)
    public UploadTicket createUpload(@Valid @RequestBody UploadRequest request) {
        return service.createUpload(request);
    }

    /** Latest first; purpose narrows it to one kind (e.g. SKILL_ICON). */
    @GetMapping
    public List<MediaItem> list(@RequestParam(required = false) MediaPurpose purpose) {
        return service.list(purpose);
    }
}
