# CloudBuilder

> **One-liner:** CloudBuilder helps platform teams design, provision, and operate cloud infrastructure visually — turning architecture diagrams into running infrastructure.

[![CI](https://github.com/cloudbuilder/cloudbuilder/actions/workflows/ci.yml/badge.svg)](https://github.com/cloudbuilder/cloudbuilder/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-1262%20✓-brightgreen)](docs/test-results/dashboard.html)
[![Backend](https://img.shields.io/badge/backend-938%20tests-d97706)](backend/)
[![Frontend](https://img.shields.io/badge/frontend-313%20tests-2563eb)](frontend/)
[![Go Engine](https://img.shields.io/badge/go%20engine-15%20packages-059669)](provision-engine/)
[![TypeScript](https://img.shields.io/badge/typescript-0%20errors-7c3aed)](frontend/)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Java](https://img.shields.io/badge/java-21-d97706)](backend/)
[![React](https://img.shields.io/badge/react-19-2563eb)](frontend/)
[![Go](https://img.shields.io/badge/go-1.24-059669)](provision-engine/)

## 🎯 What is CloudBuilder?

CloudBuilder is a web platform that helps platform engineers **design, provision, and operate cloud infrastructure visually**. It turns architecture diagrams into running infrastructure without stitching together disparate tools.

### Core Modules

| Module | Description |
|--------|-------------|
| **Canvas** | Visual architecture designer with ReactFlow infinite canvas |
| **Provision** | Translates designs into Terraform/OpenTofu code and executes |
| **Observe** | Metrics, logs, traces, SLOs, alerts, and incident tracking |
| **AIOps** | AI-powered anomaly detection and natural language querying |
| **FinOps** | Cost estimation, budgeting, and optimization |

## 🚀 Quick Start

### Local Development (Docker)

```bash
cd CloudBuilder
cp .env.example .env   # Edit JWT_SECRET and ENCRYPTION_KEY
docker compose up -d
# Open http://localhost:3000
# Login: admin@cloudbuilder.dev / Admin@123
```

### Deploy Free Tier

See [DEPLOY.md](DEPLOY.md) for complete instructions using Render + Vercel + Neon.

## 📊 Test Metrics

| Layer | Tests | Status |
|-------|-------|--------|
| ☕ Backend (Spring Boot) | 938 | ✅ Passing |
| ⚛ Frontend (React + TS) | 313 | ✅ Passing |
| 🐹 Go Engine | 15 packages | ✅ Passing |
| 🔷 TypeScript Check | 0 errors | ✅ Clean |
| **Total** | **1,262** | **✅ All Passing** |

→ [View Full Dashboard](docs/test-results/dashboard.html)

### Running Tests

```bash
# Backend
cd backend && mvn test

# Frontend
cd frontend && npm test

# Go Engine
cd provision-engine && go test ./...

# Collect all metrics
./scripts/collect-test-metrics.sh
```

## 🏗 Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend   │────▶│   Backend   │────▶│  Go Engine  │
│  React + TS  │     │  Spring Boot│     │  Provision  │
│  Port: 3000  │     │  Port: 8080 │     │  Port: 50052│
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                    ┌──────▼──────┐
                    │  PostgreSQL  │
                    │  Port: 5432  │
                    └─────────────┘
```

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, ReactFlow, Tailwind CSS, Vite, Zustand |
| Backend | Java 21, Spring Boot 3.4, Spring Modulith, Maven |
| Engine | Go 1.24, Cobra, gRPC, Kafka |
| Database | PostgreSQL 16 |
| Policy | OPA (Open Policy Agent) + Rego |
| Auth | JWT + Spring Security + RBAC |

## 📁 Project Structure

```
CloudBuilder/
├── frontend/          # React frontend (Vite + TypeScript)
├── backend/           # Spring Boot backend (Java 21)
├── provision-engine/  # Go provision engine
├── opa/               # OPA policies (Rego)
├── nginx/             # Reverse proxy config
├── tests/             # Load, contract, security, chaos tests
├── scripts/           # Setup and utility scripts
├── docs/              # Architecture, business, and engineering docs
├── docker-compose.yml # Full-stack local development
├── DEPLOY.md          # Free-tier deployment guide
└── TESTING_GUIDE.md   # Quick start for testers
```

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [CLOUDBUILDER_CONTEXT.md](CLOUDBUILDER_CONTEXT.md) | Master context — read first |
| [DEPLOY.md](DEPLOY.md) | Free-tier deployment guide |
| [TESTING_GUIDE.md](TESTING_GUIDE.md) | Quick start for testers |
| [docs/README.md](docs/README.md) | Full documentation map |
| [docs/test-results/dashboard.html](docs/test-results/dashboard.html) | Test metrics dashboard |

## 🔧 Development

### Prerequisites

- Java 21
- Node.js 22+
- Go 1.24+
- Docker & Docker Compose

### Commands

```bash
# Start everything
docker compose up -d

# Backend only
cd backend && ./mvnw spring-boot:run

# Frontend only
cd frontend && npm run dev

# Run all tests
cd backend && mvn test          # Backend
cd frontend && npm test         # Frontend
cd provision-engine && go test ./...  # Go Engine
```

## 🧪 Testing

CloudBuilder has **1,262 tests** across 4 layers:

- **Unit tests** — Backend (938), Frontend (313), Go Engine (15 packages)
- **Integration tests** — Provision flow, engine client
- **Security tests** — Rate limiting, idempotency, auth
- **E2E tests** — Playwright visual regression
- **Load tests** — k6 smoke and stress tests
- **Chaos tests** — Kafka kill, DB latency, OPA kill

→ [Test Metrics Dashboard](docs/test-results/dashboard.html)
→ [Manual Test Guide](docs/test-results/MANUAL_TEST_GUIDE.md)

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/my-feature`)
2. Make your changes
3. Run tests (`./scripts/collect-test-metrics.sh`)
4. Commit with a descriptive message
5. Open a Pull Request

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

*Built with ❤️ by the CloudBuilder team*
