# ═══════════════════════════════════════════════════════════════════════════
# CloudBuilder Backend — Dockerfile (Simplified for Render Free Tier)
# ═══════════════════════════════════════════════════════════════════════════

# ─── Stage 1: Build ──────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Increase Maven memory for constrained build environments
ENV MAVEN_OPTS="-Xmx512m -Xms256m"

# Copy POM first for dependency caching
COPY pom.xml .
RUN mvn dependency:go-offline -B -q 2>/dev/null || mvn dependency:resolve -B -q

# Copy sources and build
COPY src ./src
RUN mvn package -DskipTests -B -q

# ─── Stage 2: Runtime ────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre

# Install curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/* && \
    groupadd -r cloudbuilder && useradd -r -g cloudbuilder cloudbuilder

WORKDIR /app

# Copy the fat JAR
COPY --from=build /app/target/*.jar app.jar

# Create logs directory
RUN mkdir -p /app/logs && chown cloudbuilder:cloudbuilder /app/logs

# Switch to non-root
USER cloudbuilder

# Port is controlled by PORT env var (Render default: 10000)
EXPOSE 8080

# JVM tuning for Render Free Tier (512MB RAM limit)
ENV JAVA_OPTS="-Xmx300m -Xms200m -XX:MaxMetaspaceSize=128m -XX:+UseG1GC -XX:+UseStringDeduplication"

# Run the fat JAR directly (simpler than layered extraction)
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
