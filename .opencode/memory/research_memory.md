# Research Memory

## Pesquisas Realizadas

### 2026-06-15 — FAANg Framework
**Tópico**: Metodologia de agentes autônomos de engenharia
**Fontes**: FAANg specification (prompt engineering), engenharia de plataforma, SotA agent architectures
**Conclusão**: Framework híbrido combinando hierarchical planning (Harness Engineering), context compression (Headroom Engine), persistent memory, e multi-agent orquestração. Cada especialista FAANg opera de forma autônoma dentro de seu domínio, seguindo o pipeline: Research → Planning → Architecture → Implementation → Review → Testing → Security → Performance → Deployment → Evaluation → Memory.

### 2026-06-14 — Rate Limiting Patterns
**Tópico**: Implementação de rate limiting em Spring Boot sem dependências externas
**Fontes**: Spring Security docs, IETF RFC 6585 (HTTP 429), sliding window algorithm
**Conclusão**: ConcurrentHashMap + sliding window (timestamps + count) é suficiente para dev. Bucket4j para prod multi-instância com Redis.

### 2026-06-14 — Password Reset Flow Security
**Tópico**: Fluxo seguro de reset de senha
**Fontes**: OWASP Forgot Password Cheat Sheet, Spring Security docs
**Conclusão**: Token 64 hex, expiry 1h, used flag, BCrypt hashing, sem revelar se email existe

## Tópicos Pendentes de Pesquisa
- Kafka multi-node com TLS para prod
- Redis Sentinel/Cluster para rate limiting distribuído
- Flyway migrations vs Hibernate ddl-auto em produção
- OpenTelemetry sampling strategies para alta throughput
