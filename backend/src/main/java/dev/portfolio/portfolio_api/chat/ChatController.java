package dev.portfolio.portfolio_api.chat;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/** Single question without a session. */
@RestController
public class ChatController {

    /** focus: the one document the question is about (ADR-0023); null for an ordinary question. */
    public record ChatRequest(@NotBlank @Size(max = 500) String question, @Valid Focus focus) {
    }

    public record Focus(@NotBlank @Pattern(regexp = "BLOG|PROJECT") String type,
                        @NotBlank @Size(max = 200) String slug) {
    }

    private final ChatService chat;
    private final ChatRateLimiter limiter;
    private final ChatStreams streams;
    private final UnansweredQuestionService unanswered;

    public ChatController(ChatService chat, ChatRateLimiter limiter, ChatStreams streams,
                          UnansweredQuestionService unanswered) {
        this.chat = chat;
        this.limiter = limiter;
        this.streams = streams;
        this.unanswered = unanswered;
    }

    /** Validation, availability and limits are decided before the stream starts (400 / 503 / 429). */
    @PostMapping(path = "/api/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chat(@Valid @RequestBody ChatRequest request, HttpServletRequest http,
                          HttpServletResponse response) {
        if (!chat.available()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "chat is not configured");
        }
        if (!limiter.tryAcquire(http.getRemoteAddr())) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "daily question limit reached");
        }
        String question = request.question().strip();
        ChatStreams.disableBuffering(response);
        return streams.start(sink -> {
            ChatService.Answer answer = chat.answer(question, List.of(), request.focus(), sink);
            unanswered.recordQuietly(question, answer, null);
            ChatService.done(sink, answer);
        });
    }
}
