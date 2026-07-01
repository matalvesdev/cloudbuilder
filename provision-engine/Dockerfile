# ═══════════════════════════════════════════════════════════════════════════
# CloudBuilder Provision Engine — Dockerfile (Multi-Stage)
# ═══════════════════════════════════════════════════════════════════════════
# Stage 1: Build  — golang:1.23-alpine (go build -o /app/provision-engine)
# Stage 2: Runtime — alpine:3.19 (binary only, no Go toolchain)
# ═══════════════════════════════════════════════════════════════════════════

# ─── Stage 1: Build ──────────────────────────────────────────────────────
FROM golang:1.23-alpine AS build

RUN apk add --no-cache gcc musl-dev

WORKDIR /build

# Copy dependency manifests first (layer caching)
COPY go.mod go.sum ./
RUN go mod download

# Copy sources and build static binary
# CGO_ENABLED=0 → pure Go static binary, no libc dependency
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /app/provision-engine ./cmd/provision-engine/

# ─── Stage 2: Runtime ────────────────────────────────────────────────────
FROM alpine:3.19

# Install ca-certificates for TLS, terraform/opentofu would be sidecars
RUN apk add --no-cache ca-certificates tzdata

# Create non-root user
RUN addgroup -S cloudbuilder && \
    adduser -S cloudbuilder -G cloudbuilder -u 1000

WORKDIR /app

COPY --from=build /app/provision-engine .

# Switch to non-root user
USER cloudbuilder

EXPOSE 50051

ENTRYPOINT ["/app/provision-engine"]
