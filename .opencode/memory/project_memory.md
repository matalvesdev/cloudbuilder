# Project Memory

## CloudBuilder — Platform Engineering Platform
Última atualização: 2026-06-15

## Stack
- **Frontend**: React 19 + TypeScript + ReactFlow v12 (@xyflow/react) + Tailwind CSS + Vite + Zustand + shadcn/ui
- **Backend**: Java 21 + Spring Boot 3.4.4 + Spring Modulith + Maven + H2 (test) + PostgreSQL 16 (prod)
- **Engine**: Go 1.22 + Cobra CLI + gRPC
- **Streaming**: Kafka 7.9 + Zookeeper
- **Cache**: Redis 7
- **Observability**: OpenTelemetry Collector + Prometheus + Grafana
- **Container**: Docker (full stack docker-compose, 9 services)

## Módulos Backend (completos)
- **design** — canvas CRUD, validação, versões, componentes (hexagonal completo)
- **iam** — auth (login/register/refresh/password-reset), users, roles, permissions, tenants
- **provision** — geração código Terraform, drift detection, state management
- **audit** — eventos de auditoria
- **shared/** — security (JWT filter, TenantFilter, rate limiting), event bus, monitoring

## Módulos Backend (skeleton)
- aiops, cost, observe, platform, git, github, apm, tenant, multiregion, codeanalysis, metrics

## Módulos Frontend
- **design** ✅ — Canvas ReactFlow, Palette, Properties, AI Chat, Code Preview
- **auth** ✅ — Login, Register (com verificação email), Forgot/Reset Password
- **settings** ✅ — Profile, System (público) + Credentials, Environments, Repositories, Multitenancy (admin)
- **dashboard** ✅ — Métricas reais (sem mock data)
- **provision** ⚠️ — Parcial (mock data)
- **cost** ⚠️ — Stub (mock data)
- **observe** ⚠️ — Stub (mock data)
- **platform** ⚠️ — Stub (mock data)
- **aiops** ⚠️ — Stub (mock data)

## Feature Flags & Config
- Rate limiting: auth 10 req/min/IP, global 500 req/min/IP (configurável via application.yml)
- H2 console: apenas dev (via `cloudbuilder.security.h2-console-enabled`)
- CORS: configurável via `cloudbuilder.security.cors-allowed-origins` (default `http://localhost:3000,http://localhost:5173`)
- JWT secret: obrigatório via env var `JWT_SECRET`

## Próximas Entregas (Roadmap)
- Q2 2026: Design v1 + Provision v1 (MVP)
- Q3 2026: Observe v1 + Cost v1 (Operations)
- Q4 2026: AI v1 + Platform v1 (Intelligence)
- Q1 2027: Multi-Region + Enterprise (Scale)
