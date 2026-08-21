# ═══════════════════════════════════════════════════════════════════════════
# CloudBuilder Backend — Lean Dockerfile (Render Free Tier: 512MB)
# ═══════════════════════════════════════════════════════════════════════════
# Excludes: Kafka, Resilience4j, WebSocket, Mail, Prometheus
# Produces a ~60MB JAR vs ~90MB standard
# ═══════════════════════════════════════════════════════════════════════════

# ─── Stage 1: Build ──────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

ENV MAVEN_OPTS="-Xmx384m -Xms192m"

# Copy POM first for dependency caching
COPY pom.xml .
# Download all dependencies (but skip test ones)
RUN mvn dependency:resolve -B -DskipTests || true

# Copy sources
COPY src ./src

# Build with lean profile - excludes Kafka, Resilience4j, WebSocket, Mail, Prometheus
RUN mvn clean package -DskipTests -B \
    -Plean \
    -Dmaven.test.skip=true \
    -Dmaven.main.skip=false

# Verify JAR was created and show size
RUN ls -la /app/target/*.jar && \
    echo "=== JAR SIZE ===" && \
    du -sh /app/target/*.jar

# ─── Stage 2: Runtime ────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Minimal runtime - just curl for health checks
RUN apk add --no-cache curl && \
    addgroup -S cb && adduser -S cb -G cb && \
    mkdir -p /app/logs && chown cb:cb /app/logs

# Copy the lean JAR
COPY --from=build --chown=cb:cb /app/target/cloudbuilder-backend-*.jar /app/app.jar

USER cb

EXPOSE ${PORT:-8080}

# Ultra-minimal JVM settings for 512MB container
ENV JAVA_OPTS="-Xmx256m -Xms128m -XX:MaxMetaspaceSize=64m -XX:+UseSerialGC -XX:MaxRAMPercentage=40.0 -XX:+TieredCompilation -XX:TieredStopAtLevel=1 -noverify -Djava.security.egd=file:/dev/./urandom"

HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=5 \
    CMD curl -f http://localhost:${PORT:-8080}/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
