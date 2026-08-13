# ═══════════════════════════════════════════════════════════════════════════
# CloudBuilder Provision Engine — Multi-Stage Dockerfile
# ═══════════════════════════════════════════════════════════════════════════

# ─── Stage 1: Build ──────────────────────────────────────────────────────
FROM golang:1.24-alpine AS build

RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /build

# Cache dependency downloads
COPY go.mod go.sum ./
RUN go mod download && go mod verify

# Copy source and build all binaries
COPY . .

ARG VERSION=dev
ARG GIT_COMMIT=unknown
ARG BUILD_DATE=unknown

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -trimpath \
    -ldflags="-s -w \
      -X main.version=${VERSION} \
      -X main.gitCommit=${GIT_COMMIT} \
      -X main.buildDate=${BUILD_DATE}" \
    -o /app/api ./cmd/api/ && \
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -trimpath \
    -ldflags="-s -w" \
    -o /app/worker ./cmd/worker/ && \
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -trimpath \
    -ldflags="-s -w" \
    -o /app/scheduler ./cmd/scheduler/ && \
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -trimpath \
    -ldflags="-s -w" \
    -o /app/collab ./cmd/provision-engine/

# ─── Stage 2: API Runtime ────────────────────────────────────────────────
FROM alpine:3.21 AS api-runtime

RUN apk add --no-cache ca-certificates tzdata curl && \
    addgroup -S pe && adduser -S pe -G pe -u 1000

WORKDIR /app
COPY --from=build /app/api /app/api
COPY configs/config.yaml /app/configs/config.yaml

USER pe
EXPOSE 8080 9090

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
    CMD curl -fs http://localhost:8080/healthz || exit 1

ENTRYPOINT ["/app/api"]
CMD ["api", "--config", "/app/configs/config.yaml"]

# ─── Stage 3: Worker Runtime ─────────────────────────────────────────────
FROM alpine:3.21 AS worker-runtime

RUN apk add --no-cache ca-certificates tzdata curl && \
    addgroup -S pe && adduser -S pe -G pe -u 1000

WORKDIR /app
COPY --from=build /app/worker /app/worker
COPY configs/config.yaml /app/configs/config.yaml

USER pe

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
    CMD curl -fs http://localhost:8081/healthz || exit 1

ENTRYPOINT ["/app/worker"]
CMD ["--config", "/app/configs/config.yaml"]

# ─── Stage 4: Scheduler Runtime ──────────────────────────────────────────
FROM alpine:3.21 AS scheduler-runtime

RUN apk add --no-cache ca-certificates tzdata curl && \
    addgroup -S pe && adduser -S pe -G pe -u 1000

WORKDIR /app
COPY --from=build /app/scheduler /app/scheduler
COPY configs/config.yaml /app/configs/config.yaml

USER pe

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
    CMD curl -fs http://localhost:8082/healthz || exit 1

ENTRYPOINT ["/app/scheduler"]
CMD ["--config", "/app/configs/config.yaml"]

# ─── Stage 5: Collaboration Runtime ────────────────────────────────────
FROM alpine:3.21 AS collab-runtime

RUN apk add --no-cache ca-certificates tzdata curl && \
    addgroup -S pe && adduser -S pe -G pe -u 1000

WORKDIR /app
COPY --from=build /app/collab /app/collab

USER pe
EXPOSE 8765

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
    CMD curl -fs http://localhost:8765/health || exit 1

ENTRYPOINT ["/app/collab"]
CMD ["collab-server"]
