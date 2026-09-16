package dev.portfolio.portfolio_api.chat;

import java.util.List;
import java.util.function.Consumer;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;

/** Uses the Spring AI ChatModel when configured (CHAT_PROVIDER=openai); otherwise disabled. */
@Component
public class SpringAiChatGenerator implements ChatGenerator {

    private final ObjectProvider<ChatModel> models;

    public SpringAiChatGenerator(ObjectProvider<ChatModel> models) {
        this.models = models;
    }

    @Override
    public boolean enabled() {
        return models.getIfAvailable() != null;
    }

    @Override
    public void stream(String systemPrompt, String userPrompt, Consumer<String> onDelta) {
        ChatModel model = models.getIfAvailable();
        if (model == null) {
            throw new IllegalStateException("chat model is not configured");
        }
        Prompt prompt = new Prompt(List.of(new SystemMessage(systemPrompt), new UserMessage(userPrompt)));
        for (ChatResponse response : model.stream(prompt).toIterable()) {
            if (response == null || response.getResult() == null || response.getResult().getOutput() == null) {
                continue;
            }
            String text = response.getResult().getOutput().getText();
            if (text != null && !text.isEmpty()) {
                onDelta.accept(text);
            }
        }
    }
}
