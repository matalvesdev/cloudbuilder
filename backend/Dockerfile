# ═══════════════════════════════════════════════════════════════════════════
# CloudBuilder Backend — Dockerfile (Render-optimized)
# ═══════════════════════════════════════════════════════════════════════════

# ─── Stage 1: Build ──────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Increase Maven memory
ENV MAVEN_OPTS="-Xmx512m -Xms256m"

# Copy POM first for dependency caching
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy sources and build fat JAR
COPY src ./src
RUN mvn clean package -DskipTests -B -Dmaven.test.skip=true

# Verify JAR was created
RUN ls -la /app/target/*.jar

# ─── Stage 2: Runtime ────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre
WORKDIR /app

# Install curl for health checks
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/* && \
    groupadd -r cb && useradd -r -g cb cb && \
    mkdir -p /app/logs && chown cb:cb /app/logs

# Copy the fat JAR - explicitly find it
COPY --from=build --chown=cb:cb /app/target/cloudbuilder-backend-*.jar /app/app.jar

USER cb

# Port via env var (Render uses PORT)
EXPOSE 8080

ENV JAVA_OPTS="-Xmx300m -Xms200m -XX:MaxMetaspaceSize=128m -XX:+UseG1GC -XX:+UseStringDeduplication"

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
