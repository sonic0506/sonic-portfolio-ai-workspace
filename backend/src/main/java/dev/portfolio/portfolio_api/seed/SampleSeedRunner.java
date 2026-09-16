package dev.portfolio.portfolio_api.seed;

import java.nio.file.Files;
import java.nio.file.Path;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Local only: ./gradlew bootRun --args='--spring.profiles.active=local --app.seed.samples-dir=../samples'
 * Seeds once at startup; the server keeps running afterwards.
 */
@Component
@Profile("local")
@ConditionalOnProperty("app.seed.samples-dir")
public class SampleSeedRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SampleSeedRunner.class);

    private final SampleSeeder seeder;
    private final Path dir;

    public SampleSeedRunner(SampleSeeder seeder, @Value("${app.seed.samples-dir}") String dir) {
        this.seeder = seeder;
        this.dir = Path.of(dir).toAbsolutePath().normalize();
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!Files.isDirectory(dir)) {
            throw new IllegalStateException("samples dir not found: " + dir);
        }
        SampleSeeder.Result result = seeder.seed(dir);
        log.info("Seeded samples from {}: {}", dir, result);
    }
}
