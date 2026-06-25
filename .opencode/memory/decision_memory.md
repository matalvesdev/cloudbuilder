# Decision Memory

## Historico de Decisoes

### 2026-06-23 -- ADR-031: Production Deployment Architecture
Decisao: Single-region AWS deployment via Elastic Beanstalk + RDS PostgreSQL + S3/CloudFront + SSM Parameter Store.
Razao: Simplicidade operacional (managed EC2), baixo custo (~0/mes), caminho de migracao para K8s em Q1 2027.
Alternativas: K8s/EKS (muito caro para MVP), Lambda (cold starts incompativeis com Terraform), Fargate (mais caro).
Impacto: gRPC bridge entre Java e Go engine permanece como gap conhecido. Code generation roda in-process no Java.

### 2026-06-23 -- ADR-032: Public Beta Feature Flags
Decisao: Feature flags via JPA entity + uiStore.isEnabled() instead of LaunchDarkly or config files.
Razao: Zero novas dependencias externas; per-tenant targeting via tenant_id column; integrado com RBAC existente (AND logico).
Alternativas: LaunchDarkly (00+/mes), application.yml (sem per-tenant), Unleash (container extra).
Impacto: Nova entidade FeatureFlag, V14 migration, admin UI page, modificacao em uiStore e App.tsx.

## Regras Imutaveis
- SEM Lombok (incompativel com JDK 25)
- SEM as any / @ts-ignore / @ts-expect-error
- UI sempre em PT-BR
- Icones sempre lucide-react
- String (UUID v4) para chaves primarias no backend (crypto.randomUUID().toString())
- @NullMarked em todos os pacotes Java
- Feature flags sao AND com RBAC (nao override)