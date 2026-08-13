# Arquitetura do Sistema

## Visão Geral

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                  │
│  Design │ Provision │ Observe │ Cost │ AIOps │ IAM  │
└────────────────────────┬────────────────────────────┘
                         │ REST API (JWT)
┌────────────────────────┴────────────────────────────┐
│                   Backend (Spring Boot)              │
│  Design │ Provision │ Observe │ Cost │ AIOps │ IAM  │
│  Git │ Audit │ Metrics │ Docs │ Platform │ Tenant  │
│  ──────────────────────────────────────────────────  │
│  shared/ (Security, Events, Kernel, Monitoring)     │
└────┬──────────┬──────────┬──────────────────────────┘
     │          │          │
┌────┴───┐ ┌───┴────┐ ┌───┴──────┐
│Postgres│ │Caffeine│ │   Kafka  │
│  (JPA) │ │ (Cache)│ │(optional)│
└────────┘ └────────┘ └──────────┘

┌─────────────────────────────────────────────────────┐
│               Provision Engine (Go)                 │
│  gRPC Server │ Drift │ Executor │ Generator │ Kafka │
└─────────────────────────────────────────────────────┘
```

## Módulos Backend (Hexagonal Architecture)

Cada módulo segue:
```
module/
├── domain/
│   ├── model/      Entidades JPA
│   ├── port/       Repositórios (interfaces)
│   ├── service/    Lógica de negócio
│   └── validator/  Regras de validação
├── application/
│   └── dto/        Data Transfer Objects
└── infrastructure/
    └── web/        Controllers REST
```

## Event-Driven Architecture

- Spring Modulith events (in-process)
- Kafka EDA (dual-mode, optional)
- Outbox Pattern para publishing confiável
- Inbox Pattern para consumo idempotente
- DLQ para eventos com falha

## Multi-Tenant

- Tenant ID em todas as tabelas
- `TenantFilter` automático via JPA
- Isolamento por tenant em queries
- RBAC: admin, editor, viewer

## Segurança

- JWT (jjwt 0.12.6) com refresh tokens
- Spring Security + `@PreAuthorize`
- SSO OAuth2 + PKCE
- MFA TOTP
- AES-256-GCM para secrets
- JWKS para verificação de tokens

## Infraestrutura

- Docker Compose (dev/beta)
- PostgreSQL 16 (prod)
- Kafka 3.7 KRaft (opcional)
- OPA para policy evaluation
- GitHub Actions CI/CD
