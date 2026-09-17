package dev.portfolio.portfolio_api.faq;

import dev.portfolio.portfolio_api.faq.FaqAdmin.FaqRequest;
import dev.portfolio.portfolio_api.faq.FaqAdmin.FaqResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/faqs")
public class FaqAdminController {

    private final FaqAdminService service;

    public FaqAdminController(FaqAdminService service) {
        this.service = service;
    }

    @GetMapping
    public List<FaqResponse> list() {
        return service.list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FaqResponse create(@Valid @RequestBody FaqRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public FaqResponse update(@PathVariable long id, @Valid @RequestBody FaqRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id) {
        service.delete(id);
    }
}
