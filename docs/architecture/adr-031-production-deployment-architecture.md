# ADR-031: Production Deployment Architecture

**Status**: Proposed
**Date**: 2026-06-23
**Author**: Principal Architect Agent

## Context

CloudBuilder is preparing for MVP launch (Phase 1 -- Internal, per ADR-030). The current deployment uses Docker Compose with 4 services (PostgreSQL, Backend, Frontend, OPA). The architecture docs describe the deployment topology as Docker Compose on a single VM, but several production considerations are not yet addressed:

1. **Single JAR deployment** -- all 15+ Modulith modules deploy as one Spring Boot JAR
2. **gRPC bridge** -- the Go provision-engine exists as a standalone binary with gRPC server but no Java gRPC client exists
3. **OPA sidecar** -- ADR-020 (OPA Policy-as-Code) is marked "Not Implemented" but the OPA container is already in docker-compose.yml
4. **Terraform state** -- no remote state backend defined; currently generated code returned as HTTP response, not executed
5. **Static assets** -- frontend served via Vite/nginx in Docker; no CDN
6. **Secret management** -- JWT_SECRET and DB_PASSWORD via env vars; no vault
7. **No DNS/TLS** -- current deployment is HTTP on localhost
8. **Backup** -- ADR-030 defines backup strategy but not yet implemented

## Problem

What is the production deployment topology for CloudBuilder MVP (Phase 1 -- Internal), balancing simplicity, cost, and operational maturity?

## Decision

### 1. Topology: Single EC2 Instance with Docker Compose (via Elastic Beanstalk)

**Chosen**: Deploy as a single AWS EC2 instance running Docker Compose, managed via AWS Elastic Beanstalk (single-instance environment).

**Rationale**: Elastic Beanstalk provides managed EC2, health checks, log rotation, and easy updates without Kubernetes overhead. Single-instance keeps costs minimal (~$30/month for t3.medium). OPA sidecar runs as a container within the same stack.

**Not chosen**:
- **Kubernetes/EKS**: Adds $73/month minimum for control plane + node costs. Overhead for MVP.
- **AWS Fargate/ECS**: More expensive for equivalent resources. No benefit for single-instance.
- **Lambda + API Gateway**: Cold starts incompatible with long-running Terraform operations.
- **Bare metal / manual EC2**: Elastic Beanstalk provides managed updates without additional cost.

### 2. Database: AWS RDS PostgreSQL (separate from EC2)

**Chosen**: AWS RDS PostgreSQL 16 (db.t3.micro, single-AZ, 20GB GP3) for production.

**Rationale**: Automated backups (snapshot + 5-min log retention), Multi-AZ failover path, managed patches, database survives instance replacement.

**Cost**: ~$18/month (db.t3.micro, single-AZ, reserved 1yr)

### 3. Terraform State: S3 + DynamoDB Locking

**Chosen**: S3 bucket for state files (one per environment), DynamoDB table for state locking.

**Rationale**: Currently CodeGeneratorService generates code in-memory without executing terraform apply. Remote state in S3 prepares for automated execution in Phase 2.

### 4. Frontend: S3 + CloudFront CDN

**Chosen**: Frontend built as static assets, uploaded to S3, served via CloudFront CDN.

**Rationale**: Eliminates serving React app from EC2, provides global CDN + HTTPS, cheaper bandwidth, decouples frontend from backend deployment.

### 5. DNS and TLS

**Chosen**: Route 53 for DNS, ACM for TLS.
- Frontend: https://app.cloudbuilder.io -> CloudFront -> S3
- API: https://api.cloudbuilder.io -> ALB -> EC2:8080

### 6. gRPC Bridge -- Known Gap

**Chosen**: For MVP, code generation runs in-process via CodeGeneratorService (Java template engine). Generated code returned to frontend for manual download. Go engine available as standalone binary but not integrated.

**Migration path**: Phase 2 (Q3 2026) -- implement gRPC Java client, add Go engine container to stack.

### 7. Secrets Management

**Chosen**: AWS SSM Parameter Store (Standard tier, free):
- /cloudbuilder/{env}/jwt-secret
- /cloudbuilder/{env}/db-password
- /cloudbuilder/{env}/master-encryption-key

### 8. CI/CD

**Chosen**: GitHub Actions extended with deployment steps (based on ADR-030).

## Alternatives Considered

| Alternative | Monthly Cost | Complexity | Ops Maturity | Roadmap Alignment |
|-------------|-------------|------------|-------------|-------------------|
| Single EC2 + Docker Compose (chosen) | ~$60 | Low | Medium | Q2-Q3 2026 |
| Kubernetes/EKS | ~$150+ | High | High | Q1 2027 |
| ECS Fargate | ~$100 | Medium | High | Future |
| Lambda + API Gateway | ~$40 | High (refactor) | Medium | N/A |
| Heroku/PaaS | ~$100 | Low | Low | Not in roadmap |

## Trade-offs

- **Cost vs. scalability**: Single-instance EC2 is cheapest but requires downtime for scaling. Acceptable for MVP.
- **RDS vs. embedded PostgreSQL**: RDS adds ~$18/month but provides managed backups, monitoring, and failover.
- **gRPC gap**: Go engine is architecturally correct but not integrated. Drift detection and deploy execution unavailable until bridge implemented.
- **EB vs. Terraform**: EB provides deployment automation without learning Terraform for app deployment.
- **S3 frontend vs. EC2-served**: S3+CloudFront adds CDN complexity but reduces EC2 load.

## Consequences

1. **New**: CloudFormation/Terraform template for infrastructure (VPC, RDS, S3, CloudFront, ACM, Route 53)
2. **New**: Elastic Beanstalk multi-container Docker configuration
3. **New**: AWS SSM parameter creation for secrets in CI/CD pipeline
4. **New**: Frontend build -> S3 sync -> CloudFront invalidation step in CI/CD
5. **New**: S3 bucket for Terraform state per environment
6. **New**: DynamoDB table for Terraform state locking
7. **New**: gRPC bridge issue tracked as tech debt (Phase 2)
8. **Modified**: CI/CD pipeline -- add deployment to EB and S3
9. **Modified**: Frontend VITE_API_URL points to https://api.cloudbuilder.io in production
10. **Known limitation**: Go provision-engine not integrated; drift detection and deploy execution blocked

## References

- ADR-008: Native Observability Subsystem (platform monitoring)
- ADR-020: OPA Policy-as-Code (OPA container in stack)
- ADR-022: API Versioning Strategy
- ADR-028: Security Hardening & Secrets Management
- ADR-030: Production Readiness & Stabilization
- AWS Elastic Beanstalk: https://aws.amazon.com/elasticbeanstalk/
- AWS RDS PostgreSQL: https://aws.amazon.com/rds/postgresql/
- Terraform S3 Backend: https://developer.hashicorp.com/terraform/language/settings/backends/s3
