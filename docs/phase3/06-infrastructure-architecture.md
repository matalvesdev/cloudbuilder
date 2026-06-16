# CloudBuilder — Infrastructure Architecture

## Deployment Architecture (Kubernetes)

```
┌─────────────────────────────────────────────────────────────────┐
│                     Kubernetes Cluster                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   Namespace: cloudbuilder                   │ │
│  │                                                             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │ │
│  │  │  Frontend    │  │  API Gateway │  │  Modulith    │     │ │
│  │  │  (React)     │  │  (Spring)    │  │  (Java 21)   │     │ │
│  │  │  HPA: 2-10   │  │  HPA: 2-5    │  │  HPA: 3-10   │     │ │
│  │  │  CPU: 128m   │  │  CPU: 256m   │  │  CPU: 512m   │     │ │
│  │  │  Mem: 256Mi  │  │  Mem: 512Mi  │  │  Mem: 1Gi    │     │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │ │
│  │                                                             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │ │
│  │  │  Provision   │  │  Kafka       │  │  PostgreSQL  │     │ │
│  │  │  Engine (Go) │  │  (Strimzi)   │  │  (Cloud SQL/ │     │ │
│  │  │  HPA: 2-20   │  │  Broker: 3   │  │   Zalando)   │     │ │
│  │  │  CPU: 256m   │  │  Mem: 2Gi    │  │  HA: Primary │     │ │
│  │  │  Mem: 512Mi  │  │              │  │  + Replica   │     │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │ │
│  │                                                             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │ │
│  │  │  Redis       │  │  OpenTele.   │  │  Prometheus  │     │ │
│  │  │  (Sentinel)  │  │  Collector   │  │  + Grafana   │     │ │
│  │  │  HA: 3 pods  │  │  HPA: 2-5    │  │              │     │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Container Registry & CI/CD

```
                     ┌──────────────────┐
                     │  GitHub / GitLab │
                     └────────┬─────────┘
                              │ push
                              ▼
                     ┌──────────────────┐
                     │  CI Pipeline     │
                     │  - lint          │
                     │  - test          │
                     │  - build         │
                     │  - containerize  │
                     └────────┬─────────┘
                              │ push image
                              ▼
                     ┌──────────────────┐
                     │  Container       │
                     │  Registry        │
                     │  (Harbor/ECR/GCR)│
                     └────────┬─────────┘
                              │ deploy
                              ▼
                     ┌──────────────────┐
                     │  CD Pipeline     │
                     │  (ArgoCD)        │
                     │  GitOps          │
                     │  Sync to Cluster │
                     └──────────────────┘
```

## Infrastructure as Code (CloudBuilder managing its own infra)

CloudBuilder's own infrastructure is designed and managed through CloudBuilder itself (dogfooding).

```hcl
# Conceptual representation of CloudBuilder's own infrastructure
module "cloudbuilder" {
  source = "cloudbuilder/self"

  environment = "production"

  frontend = {
    replicas = 3
    cpu      = "128m"
    memory   = "256Mi"
  }

  backend = {
    replicas = 5
    cpu      = "512m"
    memory   = "1Gi"
  }

  database = {
    instance_class = "db.r6g.large"
    storage_gb     = 500
    replicas       = 1
  }

  kafka = {
    brokers    = 3
    storage_gb = 100
  }

  redis = {
    instance_type = "cache.r6g.large"
    shards        = 1
    replicas      = 2
  }
}
```

## Non-Production Environments

| Environment | Purpose | Configuration |
|-------------|---------|--------------|
| **dev** | Developer testing | Single replica, shared DB |
| **staging** | Pre-production | Full stack, reduced replicas |
| **production** | Live | HA, auto-scaling, DR |

## Disaster Recovery

| Scenario | RTO | RPO | Strategy |
|----------|-----|-----|----------|
| Pod failure | <1min | N/A | Kubernetes auto-restart |
| Node failure | <5min | N/A | Pod rescheduling |
| AZ failure | <30min | <15min | Multi-AZ deployment, DB replica |
| Region failure | <4hrs | <1hr | Cross-region backup, DR plan |
| Data corruption | <1hr | <15min | Point-in-time recovery |
| Full DR | <4hrs | <1hr | Active-passive cross-region |

## Monitoring & Alerts (CloudBuilder monitoring itself)

- **SLOs**: API latency <100ms p95, uptime 99.9%, error rate <0.1%
- **Alerts**: CPU >80%, memory >85%, error rate >1%, disk >90%
- **Dashboards**: Grafana dashboards for each module
- **Tracing**: OpenTelemetry distributed tracing across all services

## Network Architecture

```
Internet
    │
    ▼
┌──────────────┐
│  CloudFront  │
│  / ALB       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Kubernetes  │
│  Ingress     │
│  (nginx/traefik)│
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐
│  API Gateway │────►│  Backend     │
│  (Internal)  │     │  Services    │
└──────────────┘     └──────────────┘
                            │
                    ┌───────┴───────┐
                    │               │
                    ▼               ▼
            ┌────────────┐  ┌────────────┐
            │ Database   │  │ Kafka      │
            │ (Internal) │  │ (Internal) │
            └────────────┘  └────────────┘
```

All internal services communicate over a private network (Kubernetes ClusterIP/services). External access is only through the Ingress Controller.
