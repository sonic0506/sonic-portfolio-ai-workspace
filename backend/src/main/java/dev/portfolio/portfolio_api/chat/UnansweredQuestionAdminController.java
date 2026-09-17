package dev.portfolio.portfolio_api.chat;

import dev.portfolio.portfolio_api.chat.UnansweredQuestionService.Item;
import dev.portfolio.portfolio_api.chat.UnansweredQuestionService.Page;
import dev.portfolio.portfolio_api.chat.UnansweredQuestionService.Status;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/chat/unanswered")
public class UnansweredQuestionAdminController {

    public record UpdateRequest(@NotNull Status status, @Size(max = 2000) String adminNote) {
    }

    private final UnansweredQuestionService service;

    public UnansweredQuestionAdminController(UnansweredQuestionService service) {
        this.service = service;
    }

    /** Newest first; status filters when given. */
    @GetMapping
    public Page list(@RequestParam(required = false) Status status,
                     @RequestParam(defaultValue = "0") int page,
                     @RequestParam(defaultValue = "20") int size) {
        return service.list(status, page, size);
    }

    @PutMapping("/{id}")
    public Item update(@PathVariable long id, @Valid @RequestBody UpdateRequest request) {
        return service.update(id, request.status(), request.adminNote());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id) {
        service.delete(id);
    }
}
