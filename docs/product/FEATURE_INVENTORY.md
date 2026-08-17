# Feature Inventory

> Status: Active | Owner: Product | Last Updated: 2026-08-14

## Classification

- **Production Ready:** Fully functional, tested, deployed
- **Functional:** Working but may have gaps
- **Partial:** Partially implemented
- **Prototype:** Proof of concept
- **Dead:** No longer relevant
- **Proposed:** Planned but not built

## Canvas Module

| Feature | Status | Evidence |
|---------|--------|---------|
| Visual canvas (ReactFlow v12) | Production Ready | 312 tests, infinite background, snap grid |
| Drag-drop resource placement | Production Ready | Component palette with provider grouping |
| Node rendering (multi-provider) | Production Ready | AWS, GCP, Azure, K8s nodes |
| Edge connections | Production Ready | Typed edges with validation |
| Property editing | Production Ready | Schema-driven forms per resource type |
| Undo/redo | Production Ready | 100-entry history stack |
| Copy/paste | Production Ready | With edge preservation |
| Auto-layout | Production Ready | Web Worker for 500+ nodes |
| Canvas export/import | Production Ready | JSON, Terraform HCL, state files |
| Keyboard shortcuts | Production Ready | Full set including Cmd+K |
| Version history | Functional | Local + backend versioning |
| Collaboration cursors | Functional | Real-time cursor overlay |
| Comments on nodes | Functional | Collaboration panel |
| Cost estimation | Functional | Per-resource pricing |
| Validation panel | Functional | Node validation status |
| Metrics overlay | Functional | Live metrics on canvas |
| Auto-save | Functional | Debounced localStorage + backend |
| Template library | Proposed | Pre-built starter architectures |

## Provisioning Module

| Feature | Status | Evidence |
|---------|--------|---------|
| Terraform code generation | Production Ready | main.tf, variables.tf, outputs.tf, providers.tf, versions.tf |
| Multi-provider support | Production Ready | GCP, AWS, Azure, K8s |
| Provider-aware versions.tf | Production Ready | Only includes relevant provider |
| Provision preview | Production Ready | Shows generated files + resource count |
| Credential management | Production Ready | Encrypted storage, per-provider injection |
| Go provision engine | Production Ready | terraform init/plan/apply/destroy |
| Provision apply | Production Ready | Backend → Go engine execution |
| Canvas clear after provision | Functional | Clears canvas after successful provision |
| Drift detection | Functional | Compare desired vs actual state |
| Approval gates | Functional | Human-in-the-loop |
| Ephemeral environments | Functional | Temporary infrastructure with TTL |
| Multi-region deployment | Functional | Region deployment tracking |
| Import existing infrastructure | Proposed | Connect cloud, discover, import |

## Observability Module

| Feature | Status | Evidence |
|---------|--------|---------|
| Metrics dashboard | Functional | System and business metrics |
| Log viewer | Functional | Structured log display |
| Trace viewer | Functional | Distributed tracing |
| SLO definitions | Functional | Service level objectives |
| Alert rules | Functional | Alert configuration |
| Incident tracking | Functional | Incident management |

## AI Module

| Feature | Status | Evidence |
|---------|--------|---------|
| AIOps query | Functional | Natural language querying |
| Anomaly detection | Functional | Statistical methods |
| Log analysis | Functional | Pattern matching |
| Architecture recommendations | Proposed | Not implemented |
| Natural language → canvas | Proposed | Not implemented |

## Security Module

| Feature | Status | Evidence |
|---------|--------|---------|
| JWT authentication | Production Ready | jjwt 0.12.6 |
| RBAC | Production Ready | OWNER/ADMIN/EDITOR/VIEWER |
| Multi-tenant isolation | Production Ready | TenantFilter + tenantId |
| Credential encryption | Production Ready | AES-256-GCM |
| OPA policy engine | Production Ready | Rego policies |
| Audit logging | Functional | Activity feed |
| SSO (SAML/OIDC) | Prototype | Module exists, not production |
| MFA | Proposed | Not implemented |

## Summary

| Category | Production Ready | Functional | Partial | Prototype | Proposed |
|----------|-----------------|------------|---------|-----------|----------|
| Canvas | 10 | 8 | 0 | 0 | 1 |
| Provisioning | 7 | 5 | 0 | 0 | 1 |
| Observability | 0 | 6 | 0 | 0 | 0 |
| AI | 0 | 3 | 0 | 0 | 2 |
| Security | 5 | 1 | 0 | 1 | 1 |
| **Total** | **22** | **23** | **0** | **1** | **5** |
