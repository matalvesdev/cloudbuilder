# ═══════════════════════════════════════════════════════════════════════════
# CloudBuilder Backend — Dockerfile (Render Free Tier: 512MB)
# ═══════════════════════════════════════════════════════════════════════════
# Default build excludes Kafka, Resilience4j, Modulith, Prometheus
# Use 'full' profile for local dev: mvn package -Pfull
# ═══════════════════════════════════════════════════════════════════════════

# ─── Stage 1: Build ──────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

ENV MAVEN_OPTS="-Xmx384m -Xms192m"

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:resolve -B -DskipTests || true

# Build lean JAR (default profile, no heavy deps)
COPY src ./src
RUN mvn clean package -DskipTests -B -Dmaven.test.skip=true

# Verify
RUN ls -la /app/target/*.jar

# ─── Stage 2: Runtime ────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN apk add --no-cache curl && \
    addgroup -S cb && adduser -S cb -G cb && \
    mkdir -p /app/logs && chown cb:cb /app/logs

COPY --from=build --chown=cb:cb /app/target/cloudbuilder-backend-*.jar /app/app.jar

USER cb

EXPOSE ${PORT:-8080}

ENV JAVA_OPTS="-Xmx256m -Xms128m -XX:MaxMetaspaceSize=64m -XX:+UseSerialGC -XX:MaxRAMPercentage=40.0 -XX:+TieredCompilation -XX:TieredStopAtLevel=1 -noverify"

HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=5 \
    CMD curl -f http://localhost:${PORT:-8080}/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
