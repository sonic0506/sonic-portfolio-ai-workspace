package dev.portfolio.portfolio_api.chat;

import dev.portfolio.portfolio_api.chat.ChatController.ChatRequest;
import dev.portfolio.portfolio_api.chat.ChatSessionService.Created;
import dev.portfolio.portfolio_api.chat.ChatSessionService.Session;
import dev.portfolio.portfolio_api.chat.ChatSessionService.Transcript;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/** Visitor chat sessions (ADR-0011). The secret key travels in X-Chat-Session-Key. */
@RestController
@RequestMapping("/api/chat/sessions")
public class ChatSessionController {

    public static final String KEY_HEADER = "X-Chat-Session-Key";

    private final ChatSessionService sessions;
    private final ChatService chat;
    private final ChatRateLimiter limiter;
    private final ChatStreams streams;
    private final UnansweredQuestionService unanswered;

    public ChatSessionController(ChatSessionService sessions, ChatService chat, ChatRateLimiter limiter,
                                 ChatStreams streams, UnansweredQuestionService unanswered) {
        this.sessions = sessions;
        this.chat = chat;
        this.limiter = limiter;
        this.streams = streams;
        this.unanswered = unanswered;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Created create() {
        return sessions.create();
    }

    @GetMapping("/{sessionId}")
    public Transcript get(@PathVariable UUID sessionId,
                          @RequestHeader(name = KEY_HEADER, required = false) String key) {
        return sessions.transcript(sessions.find(sessionId, key));
    }

    @DeleteMapping("/{sessionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID sessionId,
                       @RequestHeader(name = KEY_HEADER, required = false) String key) {
        sessions.delete(sessions.find(sessionId, key));
    }

    /** 400 → 503 → 404 → 409 (30 questions) → 429, all before the stream starts. */
    @PostMapping(path = "/{sessionId}/messages", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter ask(@PathVariable UUID sessionId,
                          @RequestHeader(name = KEY_HEADER, required = false) String key,
                          @Valid @RequestBody ChatRequest request, HttpServletRequest http,
                          HttpServletResponse response) {
        if (!chat.available()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "chat is not configured");
        }
        Session session = sessions.find(sessionId, key);
        if (sessions.questionCount(session.id()) >= ChatSessionService.MAX_QUESTIONS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "session question limit reached; start a new chat");
        }
        if (!limiter.tryAcquire(http.getRemoteAddr())) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "daily question limit reached");
        }
        String question = request.question().strip();
        var history = sessions.recentTurns(session.id());
        ChatStreams.disableBuffering(response);
        return streams.start(sink -> {
            ChatService.Answer answer = chat.answer(question, history, sink);
            sessions.saveTurn(session.id(), question, answer);
            unanswered.recordQuietly(question, answer, session.id());
            ChatService.done(sink, answer);
        });
    }
}
