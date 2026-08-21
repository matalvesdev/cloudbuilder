# ═══════════════════════════════════════════════════════════════════════════
# CloudBuilder Backend — Dockerfile (Render Free Tier: 512MB)
# Uses jlink to create minimal JRE (~40MB vs ~180MB default)
# ═══════════════════════════════════════════════════════════════════════════

# ─── Stage 1: Build ──────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

ENV MAVEN_OPTS="-Xmx384m -Xms192m"

COPY pom.xml .
RUN mvn dependency:resolve -B -DskipTests || true

COPY src ./src
RUN mvn clean package -DskipTests -B -Dmaven.test.skip=true

RUN ls -la /app/target/*.jar

# ─── Stage 2: Custom JRE ────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk AS jre-build

# Create minimal JRE with only needed modules
RUN jlink \
    --add-modules java.base,java.desktop,java.instrument,java.logging,java.management,java.naming,java.prefs,java.security.jgss,java.sql,java.transaction.xa,java.xml \
    --strip-debug \
    --no-man-pages \
    --no-header-files \
    --compress=zip-6 \
    --output /custom-jre

# ─── Stage 3: Runtime ────────────────────────────────────────────────────
FROM debian:bookworm-slim
WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends curl ca-certificates && \
    rm -rf /var/lib/apt/lists/* && \
    groupadd --system cb && useradd --system --gid cb cb && \
    mkdir -p /app/logs && chown cb:cb /app/logs

# Copy custom JRE from jlink stage
COPY --from=jre-build /custom-jre /opt/java

# Copy the application JAR
COPY --from=build --chown=cb:cb /app/target/cloudbuilder-backend-*.jar /app/app.jar

ENV PATH="/opt/java/bin:$PATH"
ENV JAVA_HOME="/opt/java"

USER cb

EXPOSE ${PORT:-8080}

# Ultra-minimal JVM settings — no heap overhead from unused modules
ENV JAVA_OPTS="-Xmx256m -Xms128m -XX:+UseSerialGC -XX:MaxRAMPercentage=45.0 -XX:+TieredCompilation -XX:TieredStopAtLevel=1 -noverify -Djava.security.egd=file:/dev/./urandom"

HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=5 \
    CMD curl -f http://localhost:${PORT:-8080}/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
