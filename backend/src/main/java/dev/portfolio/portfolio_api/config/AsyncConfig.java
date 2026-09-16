package dev.portfolio.portfolio_api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/** Background indexing after admin changes (rag.DocumentIndexListener). */
@Configuration
@EnableAsync
public class AsyncConfig {
}
