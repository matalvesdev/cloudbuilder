# CloudBuilder — Operações

## Infraestrutura

### Ambientes

| Ambiente  | Stack                                          |
| --------- | ---------------------------------------------- |
| Dev       | H2 + Docker Compose local                      |
| Beta      | PostgreSQL + Docker Compose                    |
| Prod      | PostgreSQL + Kubernetes (planejado)            |

### Serviços

| Serviço          | Porta  | Dependências           |
| ---------------- | ------ | ---------------------- |
| Backend (Java)   | 8080   | PostgreSQL             |
| Frontend (Vite)  | 3000   | Backend                |
| PostgreSQL       | 5432   | -                      |
| OPA              | 8181   | -                      |

### Deploy

```bash
# Local
docker-compose up -d

# Com rebuild
docker-compose up -d --build

# Logs
docker-compose logs -f backend
```

## Monitoring

### Health Checks
- Backend: `/actuator/health/liveness`
- Backend: `/actuator/health/readiness`
- PostgreSQL: `pg_isready`

### Métricas
- Micrometer (Spring Boot)
- Custom metrics via PostgreSQL time-series
- Recharts dashboards no frontend

### Alertas
- Service Health: OPEN → ACKNOWLEDGED → RESOLVED
- Budget alerts: 80% (warning), 100% (critical)
- Drift detection: automático via webhook

## CI/CD

### Pipelines
- `ci.yml`: Backend (Java), Frontend (React), Go Engine
- `test-pyramid.yml`: Mutation testing, E2E, visual regression
- `security-scan.yml`: SAST, dependency audit

### Branch Strategy
- `main` → production
- `develop` → integration
- `feature/*` → features
- `hotfix/*` → fixes urgentes
