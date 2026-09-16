package dev.portfolio.portfolio_api.chat;

import dev.portfolio.portfolio_api.chat.ChatEvents.Error;
import dev.portfolio.portfolio_api.chat.ChatEvents.Sink;
import java.io.IOException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Consumer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/** Runs a chat pipeline and adapts its events to SSE; failures end the stream with an error event. */
@Component
public class ChatStreams {

    private static final Logger log = LoggerFactory.getLogger(ChatStreams.class);
    private static final long TIMEOUT_MS = 120_000;

    private final boolean async;
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

    public ChatStreams(@Value("${app.chat.async:true}") boolean async) {
        this.async = async;
    }

    public SseEmitter start(Consumer<Sink> pipeline) {
        SseEmitter emitter = new SseEmitter(TIMEOUT_MS);
        Runnable work = () -> run(pipeline, emitter);
        if (async) {
            executor.execute(work);
        } else {
            work.run(); // tests: same thread, so test-transaction data is visible
        }
        return emitter;
    }

    private void run(Consumer<Sink> pipeline, SseEmitter emitter) {
        try {
            pipeline.accept((event, payload) -> {
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
