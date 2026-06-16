# CloudBuilder — Security Architecture

## Security Principles

1. **Defense in Depth**: Multiple layers of security controls
2. **Least Privilege**: Minimum access required for each role
3. **Zero Trust**: Verify every request, regardless of source
4. **Secure by Default**: All features ship with secure defaults
5. **OWASP ASVS Level 2**: Compliance as minimum standard

## Authentication

```
┌─────────┐      ┌──────────┐      ┌──────────┐
│ Browser │─────►│ API      │─────►│ Identity │
│         │ JWT  │ Gateway  │ JWT  │ Provider │
│         │◄─────│          │◄─────│ (OIDC)   │
└─────────┘      └──────────┘      └──────────┘
                       │
                       ▼
              ┌──────────────────┐
              │   Backend        │
              │   (JWT Filter)   │
              └──────────────────┘
```

- **OIDC/OAuth 2.0**: GitHub, Google, Azure AD, Okta
- **JWT Tokens**: RS256 signed, 15min expiry (access), 7d (refresh)
- **API Keys**: For service-to-service and CI/CD integration
- **Session**: Redis-backed for WebSocket connections

## Authorization (RBAC)

### Roles

| Role | Scope | Permissions |
|------|-------|-------------|
| **Admin** | Tenant-wide | Full access, policy management, user management |
| **Platform Engineer** | Tenant-wide | Design, provision, observe, cost (read/write) |
| **Developer** | Self-service | View catalog, instantiate golden paths, view own resources |
| **Viewer** | Read-only | View designs, dashboards, reports |
| **FinOps** | Cost scope | Full cost access, budget management |
| **Auditor** | Audit scope | Read audit trail, read-only access |

### Permission Model

```yaml
permissions:
  design:create, read, update, delete, validate, export
  provision:deploy, approve, rollback, view_plan
  observe:read_metrics, read_logs, read_traces, create_alerts
  cost:read_costs, create_budgets, manage_forecasts
  platform:create_catalog, publish_templates, manage_policies
  aiops:run_rca, view_recommendations, manage_incidents
  admin:manage_users, manage_roles, manage_tenants
  audit:read_audit, export_audit
```

## Data Security

### At Rest
- PostgreSQL: Encrypted at rest (AES-256 via cloud provider)
- Sensitive fields encrypted using column-level encryption (pgcrypto)
- Secrets stored in Vault/HashiCorp Vault or cloud KMS
- S3/MinIO: Server-side encryption with KMS

### In Transit
- TLS 1.3 for all HTTP/gRPC traffic
- mTLS for service-to-service within Kubernetes
- Kafka TLS encryption + SASL/SCRAM authentication

## Multi-Tenancy Isolation

```
┌──────────────────────────────┐
│      API Gateway             │
│  ┌──────────────────────────┐│
│  │ Tenant Resolution Filter ││
│  └──────────┬───────────────┘│
└─────────────┼────────────────┘
              │
              ▼
┌──────────────────────────────────┐
│  TenantContext (ThreadLocal)     │
│  ┌─────────┐ ┌─────────────────┐│
│  │tenantId│ │    UserId       ││
│  ├─────────┤ ├─────────────────┤│
│  │  Role   │ │  Permissions    ││
│  └─────────┘ └─────────────────┘│
└──────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────────┐
│  Data Access Layer                                  │
│  - PostgreSQL: schema-per-tenant (tenant_{id})      │
│  - Row-level security for shared tables            │
│  - Redis: key prefix per tenant (tenant:{id}:*)    │
│  - Kafka: topic per tenant or topic with tenant    │
│    header for filtering                           │
└────────────────────────────────────────────────────┘
```

## Audit Trail

### Audit Events Captured

| Category | Events |
|----------|--------|
| Authentication | Login, Logout, LoginFailed, TokenRefreshed |
| Design | CanvasCreated, CanvasModified, CanvasDeleted, CanvasExported |
| Provision | DeploymentStarted, DeploymentApproved, DeploymentRejected, DeploymentCompleted |
| Configuration | ComponentModified, PolicyChanged, RoleModified |
| Security | PermissionChanged, UserInvited, UserRemoved, APIKeyCreated |
| Cost | BudgetModified, BudgetExceeded, CostReportExported |

### Audit Event Schema

```json
{
  "audit_id": "UUID",
  "timestamp": "ISO8601",
  "actor_id": "UUID",
  "actor_type": "USER | API_KEY | SYSTEM",
  "tenant_id": "UUID",
  "action": "string",
  "resource_type": "string",
  "resource_id": "UUID",
  "details": "JSON",
  "ip_address": "string",
  "user_agent": "string",
  "correlation_id": "UUID"
}
```

## Secrets Management

- **HashiCorp Vault** or cloud-native KMS for secrets storage
- **Never** store secrets in database, code, or configuration files
- **Dynamic secrets**: Short-lived credentials for cloud providers
- **Encryption at application layer**: Sensitive properties encrypted before storage
- **Secret rotation**: Automated rotation via Vault or cloud provider

## API Security

| Measure | Implementation |
|---------|---------------|
| Rate Limiting | Token bucket per tenant/IP |
| CORS | Strict origin validation |
| CSRF | SameSite cookies + CSRF tokens |
| SQL Injection | Parameterized queries (JPA) |
| XSS | Content-Security-Policy headers |
| Request Validation | Bean Validation + JSON Schema |
| Sensitive Data | Masked in logs (credit cards, tokens) |

## Compliance

- **OWASP ASVS Level 2**: Full coverage
- **SOC 2**: Audit trail, access control, encryption
- **GDPR**: Data deletion, portability, consent management
- **HIPAA** (future): BAA support, PHI controls
