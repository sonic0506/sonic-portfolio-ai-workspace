# Runs the jar built on the developer machine (./gradlew bootJar); nothing is compiled here.
# Build for the x86 Lightsail server: docker build --platform linux/amd64 -t portfolio-api backend
FROM eclipse-temurin:21-jre
RUN useradd --system --uid 10001 app
USER app
COPY build/libs/portfolio-api-0.0.1-SNAPSHOT.jar /app/app.jar
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=60", "-jar", "/app/app.jar"]
