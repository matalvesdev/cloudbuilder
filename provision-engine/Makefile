# ═══════════════════════════════════════════════════════════════════════════
# CloudBuilder Provision Engine — Makefile
# ═══════════════════════════════════════════════════════════════════════════
# Stack: Go 1.24 · gRPC · PostgreSQL · Redis · Kafka · OTel
# ═══════════════════════════════════════════════════════════════════════════

APP_NAME    := provision-engine
MODULE      := github.com/cloudbuilder/provision-engine
BUILD_DIR   := ./bin
BINARY      := $(BUILD_DIR)/$(APP_NAME)

# Version info (overridden in CI via: make build VERSION=1.0.0)
VERSION     ?= $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
GIT_COMMIT  ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_DATE  ?= $(shell date -u +"%Y-%m-%dT%H:%M:%SZ")

# Go settings
GOFLAGS     := -trimpath
LDFLAGS     := -s -w \
               -X main.version=$(VERSION) \
               -X main.gitCommit=$(GIT_COMMIT) \
               -X main.buildDate=$(BUILD_DATE)

# Services (for docker-compose)
SERVICES    := postgres redis kafka backend worker scheduler

.PHONY: all build build-api build-worker build-scheduler test test-unit \
        test-integration test-e2e test-coverage bench lint fmt vet \
        docker-build docker-up docker-down docker-logs proto \
        migrate migrate-up migrate-down seed run run-worker run-scheduler \
        clean tidy verify help

all: verify build

# ═══════════════════════════════════════════════════════════════════════════
# BUILD
# ═══════════════════════════════════════════════════════════════════════════

build: build-api build-worker build-scheduler
	@echo "All binaries built in $(BUILD_DIR)/"

build-api:
	@echo "→ Building api ($(VERSION))..."
	@mkdir -p $(BUILD_DIR)
	CGO_ENABLED=0 go build $(GOFLAGS) -ldflags "$(LDFLAGS)" -o $(BUILD_DIR)/api$(shell go env GOOS | sed 's/darwin//;s/linux//;s/windows/.exe/') ./cmd/api/

build-worker:
	@echo "→ Building worker..."
	@mkdir -p $(BUILD_DIR)
	CGO_ENABLED=0 go build $(GOFLAGS) -ldflags "$(LDFLAGS)" -o $(BUILD_DIR)/worker$(shell go env GOOS | sed 's/darwin//;s/linux//;s/windows/.exe/') ./cmd/worker/

build-scheduler:
	@echo "→ Building scheduler..."
	@mkdir -p $(BUILD_DIR)
	CGO_ENABLED=0 go build $(GOFLAGS) -ldflags "$(LDFLAGS)" -o $(BUILD_DIR)/scheduler$(shell go env GOOS | sed 's/darwin//;s/linux//;s/windows/.exe/') ./cmd/scheduler/

# ═══════════════════════════════════════════════════════════════════════════
# TEST
# ═══════════════════════════════════════════════════════════════════════════

test: test-unit
	@echo "All tests passed"

test-unit:
	@echo "→ Running unit tests..."
	go test -v -count=1 -short ./...

test-integration:
	@echo "→ Running integration tests (requires docker-compose)..."
	go test -v -count=1 -tags=integration ./test/integration/...

test-e2e:
	@echo "→ Running end-to-end tests..."
	go test -v -count=1 -tags=e2e ./test/e2e/...

test-coverage:
	@echo "→ Running tests with coverage..."
	go test -v -coverprofile=coverage.out -covermode=atomic ./...
	go tool cover -func=coverage.out | tail -1
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report: coverage.html"

bench:
	@echo "→ Running benchmarks..."
	go test -bench=. -benchmem ./...

# ═══════════════════════════════════════════════════════════════════════════
# LINT / FORMAT
# ═══════════════════════════════════════════════════════════════════════════

lint: vet fmt
	@echo "Lint passed"

vet:
	@echo "→ go vet..."
	go vet ./...

fmt:
	@echo "→ gofmt..."
	gofmt -s -w .

# ═══════════════════════════════════════════════════════════════════════════
# VERIFY (full gate before build)
# ═══════════════════════════════════════════════════════════════════════════

verify: tidy vet test-unit
	@echo "Verify passed"

# ═══════════════════════════════════════════════════════════════════════════
# PROTO
# ═══════════════════════════════════════════════════════════════════════════

proto:
	@echo "→ Generating protobuf code..."
	bash scripts/proto-gen.sh

# ═══════════════════════════════════════════════════════════════════════════
# DOCKER
# ═══════════════════════════════════════════════════════════════════════════

docker-build:
	@echo "→ Building Docker image..."
	docker build -t cloudbuilder/$(APP_NAME):$(VERSION) -t cloudbuilder/$(APP_NAME):latest .
	@echo "Built: cloudbuilder/$(APP_NAME):$(VERSION)"

docker-up:
	@echo "→ Starting services..."
	docker compose up -d $(SERVICES)

docker-down:
	@echo "→ Stopping services..."
	docker compose down -v

docker-logs:
	docker compose logs -f

# ═══════════════════════════════════════════════════════════════════════════
# DATABASE
# ═══════════════════════════════════════════════════════════════════════════

migrate: migrate-up

migrate-up:
	@echo "→ Running migrations..."
	migrate -path migrations -database "$(DATABASE_URL)" up

migrate-down:
	@echo "→ Rolling back migrations..."
	migrate -path migrations -database "$(DATABASE_URL)" down 1

seed:
	@echo "→ Seeding database..."
	go run cmd/migrate/main.go seed

# ═══════════════════════════════════════════════════════════════════════════
# RUN
# ═══════════════════════════════════════════════════════════════════════════

run: build-api
	@echo "→ Starting API server..."
	$(BUILD_DIR)/api --config configs/config.yaml

run-worker: build-worker
	@echo "→ Starting worker..."
	$(BUILD_DIR)/worker --config configs/config.yaml

run-scheduler: build-scheduler
	@echo "→ Starting scheduler..."
	$(BUILD_DIR)/scheduler --config configs/config.yaml

# ═══════════════════════════════════════════════════════════════════════════
# UTILITIES
# ═══════════════════════════════════════════════════════════════════════════

tidy:
	@echo "→ go mod tidy..."
	go mod tidy

clean:
	@echo "→ Cleaning..."
	rm -rf $(BUILD_DIR) coverage.out coverage.html
	@echo "Clean"

# ═══════════════════════════════════════════════════════════════════════════
# HELP
# ═══════════════════════════════════════════════════════════════════════════

help:
	@echo "CloudBuilder Provision Engine — Makefile"
	@echo ""
	@echo "Build:"
	@echo "  make build              Build all binaries"
	@echo "  make build-api          Build API server"
	@echo "  make build-worker       Build worker"
	@echo "  make build-scheduler    Build scheduler"
	@echo ""
	@echo "Test:"
	@echo "  make test               Run all tests"
	@echo "  make test-unit          Unit tests only"
	@echo "  make test-integration   Integration tests (needs docker-compose)"
	@echo "  make test-e2e           End-to-end tests"
	@echo "  make test-coverage      Tests with coverage report"
	@echo "  make bench              Benchmarks"
	@echo ""
	@echo "Quality:"
	@echo "  make lint               Run go vet + gofmt"
	@echo "  make verify             Full gate: tidy + vet + test"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build       Build Docker image"
	@echo "  make docker-up          Start services (docker-compose)"
	@echo "  make docker-down        Stop services"
	@echo "  make docker-logs        Tail logs"
	@echo ""
	@echo "Run:"
	@echo "  make run                Run API server"
	@echo "  make run-worker         Run worker"
	@echo "  make run-scheduler      Run scheduler"
	@echo ""
	@echo "Other:"
	@echo "  make proto              Generate protobuf code"
	@echo "  make migrate            Run DB migrations"
	@echo "  make tidy               go mod tidy"
	@echo "  make clean              Remove build artifacts"
