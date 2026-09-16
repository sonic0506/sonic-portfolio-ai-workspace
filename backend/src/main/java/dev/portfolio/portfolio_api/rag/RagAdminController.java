package dev.portfolio.portfolio_api.rag;

import dev.portfolio.portfolio_api.rag.RagAdminService.DocumentStatus;
import dev.portfolio.portfolio_api.rag.RagAdminService.ReindexResult;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/rag")
public class RagAdminController {

    private final RagAdminService service;

    public RagAdminController(RagAdminService service) {
        this.service = service;
    }

    @GetMapping("/documents")
    public List<DocumentStatus> documents() {
        return service.documents();
    }

    /** Runs synchronously; fine for the current content size (tens of documents). */
    @PostMapping("/reindex")
    public ReindexResult reindex(@RequestParam(defaultValue = "false") boolean rebuild) {
        return service.reindex(rebuild);
    }
}
