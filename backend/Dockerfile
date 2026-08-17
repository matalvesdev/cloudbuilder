# ═══════════════════════════════════════════════════════════════════════════
# CloudBuilder Backend — Dockerfile (Multi-Stage)
# ═══════════════════════════════════════════════════════════════════════════
# Stage 1: Build      — maven:3.9-eclipse-temurin-21-alpine
# Stage 2: JAR Layers — eclipse-temurin:21-jre-alpine (layered extraction)
# Stage 3: Runtime    — eclipse-temurin:21-jre-alpine (non-root, JRE only)
# ═══════════════════════════════════════════════════════════════════════════

# ─── Stage 1: Build with Maven ───────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy dependency descriptors first (layer caching)
COPY pom.xml ./
COPY .mvn .mvn

# Download dependencies offline (docker layer cache)
RUN \
    mvn dependency:go-offline -q

# Copy sources and build
COPY src src
RUN \
    mvn package -DskipTests -Dmaven.test.skip=true -q

# ─── Stage 2: Extract Layered JAR ────────────────────────────────────────
# Spring Boot fat-jar → extracted layers for efficient Docker caching.
# Dependencies change less often than application code.
FROM eclipse-temurin:21-jre-alpine AS layers
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
RUN java -Djarmode=layertools -jar app.jar extract

# ─── Stage 3: Runtime ────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

# Create non-root user
RUN addgroup -S cloudbuilder && \
    adduser -S cloudbuilder -G cloudbuilder -u 1000 && \
    apk add --no-cache curl

WORKDIR /app

# Create logs directory for Logback file appender (owned by cloudbuilder user)
RUN mkdir -p /app/logs && chown cloudbuilder:cloudbuilder /app/logs

# Copy extracted layers in dependency order (maximises layer caching)
COPY --from=layers /app/dependencies/ ./
COPY --from=layers /app/spring-boot-loader/ ./
COPY --from=layers /app/snapshot-dependencies/ ./
COPY --from=layers /app/application/ ./

# Switch to non-root user
USER cloudbuilder

# Port controlled by SERVER_PORT env var (default 8080)
EXPOSE 8080

# JVM tuning for Render Free Tier (512MB RAM limit)
# Use -Xmx300m to leave room for OS overhead (512MB total)
ENV JAVA_OPTS="-Xmx300m -Xms200m -XX:MaxMetaspaceSize=128m -XX:+UseG1GC -XX:+UseStringDeduplication"

# Healthcheck disabled — Render provides its own health checks
# HEALTHCHECK is configured via Render dashboard/API

# Use Spring Boot's JarLauncher for extracted layers
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS org.springframework.boot.loader.launch.JarLauncher"]
