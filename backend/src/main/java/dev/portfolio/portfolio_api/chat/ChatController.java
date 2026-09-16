package dev.portfolio.portfolio_api.chat;

import dev.portfolio.portfolio_api.chat.ChatEvents.Error;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.io.IOException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
public class ChatController {

    public record ChatRequest(@NotBlank @Size(max = 500) String question) {
    }

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);
    private static final long TIMEOUT_MS = 120_000;

    private final ChatService chat;
    private final ChatRateLimiter limiter;
    private final boolean async;
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

    public ChatController(ChatService chat, ChatRateLimiter limiter,
                          @Value("${app.chat.async:true}") boolean async) {
        this.chat = chat;
        this.limiter = limiter;
        this.async = async;
    }

    /** Validation, availability and limits are decided before the stream starts (400 / 503 / 429). */
    @PostMapping(path = "/api/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chat(@Valid @RequestBody ChatRequest request, HttpServletRequest http) {
        if (!chat.available()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "chat is not configured");
        }
        if (!limiter.tryAcquire(http.getRemoteAddr())) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "daily question limit reached");
        }
        SseEmitter emitter = new SseEmitter(TIMEOUT_MS);
        Runnable work = () -> run(request.question().strip(), emitter);
        if (async) {
            executor.execute(work);
        } else {
            work.run(); // tests: same thread, so test-transaction data is visible
        }
        return emitter;
    }

    private void run(String question, SseEmitter emitter) {
        try {
            chat.answer(question, (event, payload) -> {
                try {
                    emitter.send(SseEmitter.event().name(event).data(payload, MediaType.APPLICATION_JSON));
                } catch (IOException e) {
                    throw new ClientGoneException(e);
                }
            });
            emitter.complete();
        } catch (ClientGoneException e) {
            emitter.completeWithError(e.getCause());
        } catch (RuntimeException e) {
            log.warn("Chat failed", e);
            try {
                emitter.send(SseEmitter.event().name(ChatEvents.ERROR)
                        .data(new Error("답변을 만드는 중 문제가 발생했습니다."), MediaType.APPLICATION_JSON));
                emitter.complete();
            } catch (IOException | RuntimeException sendFailure) {
                emitter.completeWithError(e);
            }
        }
    }

    private static final class ClientGoneException extends RuntimeException {
        ClientGoneException(IOException cause) {
            super(cause);
        }
    }
}
