# ADR-031: CI/CD Deploy Pipeline and Database Migration Strategy

## Status
✅ Accepted (2026-06-23)

## Context
O CloudBuilder possui 3 componentes (backend Java, frontend React, Go engine) com CI existente (`.github/workflows/ci.yml`) que roda testes em push/PR. Para viabilizar o roadmap de produção, é necessário:

1. Pipeline de deploy automatizado com staging e produção
2. Estratégia de migração de banco de dados para produção
3. Varredura de segurança automatizada

**Stack atual:**
- CI: GitHub Actions (3 jobs paralelos em `.github/workflows/ci.yml`)
- Container registry: GHCR (GitHub Container Registry)
- Deploy: Docker Compose com 4 serviços (postgres, backend, frontend, opa)
- Gerenciamento de schema: 13 migration files SQL em `db/migration/` sem Flyway ativo
- Profiles: dev (H2 in-memory, `ddl-auto: create-drop`) e prod (PostgreSQL, `ddl-auto: validate`)

## Decision

### 1. Pipeline de Deploy (`deploy.yml`)
Criar workflow de 4 estágios sequenciais com proteções:

| Estágio | Gatilho | Ambiente | Ações |
|---------|---------|----------|-------|
| test | push → main | CI | Compilar + testar backend/frontend/Go |
| docker-build | após test | CI | Build & push imagens backend + frontend para GHCR |
| deploy-staging | após docker-build | staging | SSH deploy via docker-compose, smoke test |
| deploy-production | aprovação manual | production | SSH deploy, health check com retry, rollback em falha |

**Proteções:**
- `concurrency.cancel-in-progress: false` — deploys nunca são cancelados
- `environment: production` com `required reviewers` (GitHub Environments)
- Rollback automático via `if: failure()` — restaura imagem `latest` anterior

### 2. Container Registry
**Decisão:** GHCR (ghcr.io) sobre Docker Hub.
**Motivo:** GitHub Actions nativo — usa `GITHUB_TOKEN` em vez de secrets separados, sem taxa de pull rate limit, integração com pacotes do GitHub.

**Tags:**
- `:<sha-encurtado>` — versão imutável por commit
- `:latest` — última versão estável (usada em staging)

### 3. Database Migration — Flyway
**Decisão:** Ativar Flyway via `flyway-core` + `flyway-database-postgresql`, gerenciado pelo Spring Boot.

**Configuração:**
- **Prod:** `spring.flyway.enabled=true`, `validate-on-migrate=true`, `baseline-on-migrate=true`
- **Dev (H2):** `spring.flyway.enabled=false` — schema gerenciado por `ddl-auto: create-drop`
- **Default:** `spring.flyway.enabled=false` — evita erro com H2

**Motivos para Flyway vs alternativas:**
| Critério | Flyway | Liquibase | Manual SQL |
|----------|--------|-----------|------------|
| Spring Boot integração | Nativo | Nativo | N/A |
| Migration files existentes | 13 SQL files | XML/JSON/YAML | N/A |
| Validate-on-migrate | ✅ Nativo | ✅ | ❌ |
| Rollback | ❌ (requer pro) | ✅ | ❌ |
| Simplicidade | ✅ | ⚠️ Verboso | ❌ Frágil |

Flyway é a escolha certa pois: (a) temos 13 migration files SQL prontos, (b) Spring Boot auto-configura Flyway quando está no classpath, (c) `validate-on-migrate` previne drift de schema.

### 4. Security Scan (`security-scan.yml`)
**Ferramentas:**
- **OWASP Dependency Check** — Maven plugin para vulnerabilidades em dependências Java
- **npm audit** — vulnerabilidades em dependências frontend
- **Trivy** — filesystem scan para backend/frontend (CRITICAL/HIGH)
- **govulncheck** — vulnerabilidades em dependências Go
- **Upload SARIF** para GitHub Security Tab

**Trigger:** push a main (rápido), schedule semanal (completo), manual.

### 5. Padrões e Versões
As actions usadas seguem as mesmas versões do `ci.yml`:
- `actions/checkout@v4`, `actions/setup-java@v4`, `actions/setup-node@v4`, `actions/setup-go@v5`
- `docker/login-action@v3`, `docker/build-push-action@v6`
- `appleboy/ssh-action@v1.2.1`, `appleboy/scp-action@v0.1.7`
- `shimataro/ssh-key-action@v2`
- `aquasecurity/trivy-action@0.30.0`, `github/codeql-action/upload-sarif@v3`

## Consequences

### Positivas
1. **Pipeline completo de CI/CD** — do commit à produção com aprovação manual
2. **Deploys seguros** — rollback automático, health check com retry, smoke tests
3. **Database migrations versionadas** — Flyway garante consistência entre staging/prod
4. **Segurança contínua** — OWASP, Trivy, govulncheck, npm audit toda semana
5. **Sem lock-in** — placeholders para host/IP; deploy SSH-based permite migração futura para K8s/ArgoCD
6. **Custo zero** — GHCR incluso no GitHub, sem necessidade de registry externo

### Negativas
1. **Flyway Community sem undo** — rollback de migration requer nova migration SQL (não automático)
2. **SSH deploy frágil em escala** — adequado para MVP, mas futuro requer GitOps (ArgoCD)
3. **Deploy staging não separa** — staging + produção no mesmo workflow; ideal seria workflow separado

### Mitigações
1. Toda migration deve ter uma migration de reversão correspondente (V*__undo_*.sql)
2. Plano de migração para ArgoCD no roadmap Q3 2026
3. CI (`.github/workflows/ci.yml`) continua separado para feedback rápido em PRs

## Implementation

### Files Created/Modified

| File | Action | Description |
|------|--------|-------------|
| `.github/workflows/deploy.yml` | ✅ Created | 4-stage deploy pipeline |
| `.github/workflows/security-scan.yml` | ✅ Created | OWASP + Trivy + govulncheck |
| `backend/pom.xml` | ✅ Modified | Added flyway-core + flyway-database-postgresql |
| `backend/src/main/resources/application.yml` | ✅ Modified | Added `spring.flyway.enabled: false` (default) |
| `backend/src/main/resources/application-prod.yml` | ✅ Modified | Added Flyway config (enable, validate, baseline) |

### Required GitHub Secrets (for fork/deploy)

| Secret | Used In | Description |
|--------|---------|-------------|
| `STAGING_SSH_KEY` | deploy.yml | SSH private key for staging host |
| `STAGING_KNOWN_HOSTS` | deploy.yml | Staging host fingerprint |
| `STAGING_DB_PASSWORD` | deploy.yml | PostgreSQL password on staging |
| `STAGING_JWT_SECRET` | deploy.yml | JWT signing secret on staging |
| `PRODUCTION_SSH_KEY` | deploy.yml | SSH private key for production host |
| `PRODUCTION_KNOWN_HOSTS` | deploy.yml | Production host fingerprint |
| `PRODUCTION_DB_PASSWORD` | deploy.yml | PostgreSQL password on production |
| `PRODUCTION_JWT_SECRET` | deploy.yml | JWT signing secret on production |

### Required GitHub Variables (for fork/deploy)

| Variable | Used In | Default | Description |
|----------|---------|---------|-------------|
| `STAGING_HOST` | deploy.yml | `staging.cloudbuilder.io` | Staging server hostname/IP |
| `STAGING_USER` | deploy.yml | `deploy` | SSH user for staging |
| `STAGING_PORT` | deploy.yml | `22` | SSH port for staging |
| `PRODUCTION_HOST` | deploy.yml | `prod.cloudbuilder.io` | Production server hostname/IP |
| `PRODUCTION_USER` | deploy.yml | `deploy` | SSH user for production |
| `PRODUCTION_PORT` | deploy.yml | `22` | SSH port for production |

### Required GitHub Environment (production)

- **Environment name:** `production`
- **Required reviewers:** 1+ (configurar no repositório: Settings → Environments → production)
- **Wait timer:** 0 minutos (deploy imediato após aprovação)

## References
- [GitHub Actions: Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Flyway Documentation](https://documentation.red-gate.com/flyway)
- [Spring Boot Flyway Integration](https://docs.spring.io/spring-boot/reference/data/sql.html#data.sql.flyway)
- [Trivy GitHub Action](https://github.com/aquasecurity/trivy-action)
- [appleboy/ssh-action](https://github.com/appleboy/ssh-action)
