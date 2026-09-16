package dev.portfolio.portfolio_api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Background indexing after admin changes (rag.DocumentIndexListener) and chat session cleanup. */
@Configuration
@EnableAsync
@EnableScheduling
public class AsyncConfig {
}
