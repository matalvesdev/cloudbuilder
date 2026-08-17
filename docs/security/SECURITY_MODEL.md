# Security Model

> Status: Draft | Owner: Engineering | Last Updated: 2026-08-14

## Security Principles

1. **Least privilege** — Every component requests only the permissions it needs
2. **Defense in depth** — Multiple layers of security controls
3. **Secure by default** — Default configurations are safe
4. **Transparency** — Users can see what CloudBuilder accesses and why
5. **Auditability** — All significant actions are logged

## Threat Model

### Assets

| Asset | Sensitivity | Impact if Compromised |
|-------|------------|----------------------|
| Cloud provider credentials | Critical | Full access to customer infrastructure |
| JWT tokens | High | Session hijacking, unauthorized access |
| Canvas designs | Medium | Information disclosure, intellectual property |
| Audit logs | Medium | Compliance violation, investigation gap |
| Database | High | Data breach, cross-tenant access |
| Source code | Medium | Vulnerability discovery, IP theft |

### Attack Vectors

| Vector | Risk | Mitigation |
|--------|------|-----------|
| Credential theft | Critical | Encryption at rest, scoped permissions, rotation |
| Cross-tenant access | Critical | TenantFilter, tenantId scoping, row-level security |
| JWT token compromise | High | Short expiry, refresh tokens, revocation |
| SQL injection | High | Parameterized queries, JPA/Hibernate |
| XSS | Medium | React auto-escaping, CSP headers |
| CSRF | Medium | SameSite cookies, CSRF tokens |
| Supply chain | Medium | Dependency scanning, lockfiles, SBOM |
| Prompt injection (AI) | Medium | Structured outputs, policy enforcement, human approval |
| Insider threat | Low | Audit logs, access controls, code review |

## Authentication

### Current Implementation

- **JWT tokens** via jjwt 0.12.6
- **Spring Security** filter chain
- **Token lifecycle:** Access token (15 min) + Refresh token (7 days)
- **Login:** Email + password (bcrypt hashed)
- **Logout:** Token revocation + client-side cleanup

### Token Flow

```
User → POST /auth/login (email, password)
     → Validate credentials
     → Generate JWT (userId, tenantId, roles)
     → Return token + refreshToken

Client → Authorization: Bearer <token>
       → Spring Security Filter
       → Extract userId, tenantId, roles
       → Set TenantContext
       → @PreAuthorize check
```

### Future Enhancements

| Capability | Priority | Status |
|-----------|----------|--------|
| OAuth (GitHub, Google) | P1 | GitHub integration exists |
| SAML/OIDC SSO | P2 | Module exists (prototype) |
| Passkeys | P3 | Not planned |
| MFA | P2 | Not implemented |

## Authorization

### RBAC Model

| Role | Permissions |
|------|-----------|
| **OWNER** | Full access, billing, delete project |
| **ADMIN** | Manage members, settings, all resources |
| **EDITOR** | Create, modify, provision resources |
| **VIEWER** | Read-only access |

### Enforcement

```java
@PreAuthorize("hasRole('ADMIN') or hasRole('OWNER')")
public ResponseEntity<?> deleteResource(String id) { ... }
```

### Multi-Tenant Isolation

```java
// TenantFilter ensures all queries are scoped
@EntityFilter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class TenantFilter { ... }

// Every request sets tenant context
TenantContext.setTenantId(extractTenantId(jwt));
```

## Secrets Management

### Current Implementation

- **Cloud credentials** encrypted with AES-256 via `CLOUDBUILDER_ENCRYPTION_KEY`
- **JWT secret** stored in environment variable
- **Database credentials** in environment variables
- **No secrets in code** (enforced by .gitignore)

### Encryption Flow

```
User submits credential (e.g., GCP service account JSON)
  → Validate format
  → Encrypt with AES-256-GCM
  → Store encrypted blob in database
  → Decrypt only at provision time
  → Inject as environment variable to Go engine
  → Never logged, never exposed in API responses
```

### Rules

1. Never store credentials in plaintext
2. Never log secrets
3. Never send secrets to LLM without explicit need
4. Use scoped credentials (least privilege)
5. Prefer temporary credentials over permanent ones
6. Implement rotation strategy (future)

## Network Security

### Docker Network Isolation

```
frontend-net:  frontend, backend, nginx, opa, collab, provision-engine
db-net:        backend, postgres, provision-engine
```

### API Security

- CORS restricted to configured origins
- Rate limiting (100 req/s per IP)
- Request ID tracking
- Content-Type validation
- Input validation via Jakarta Bean Validation

## Audit Logging

### What's Logged

| Event | Data Captured |
|-------|-------------|
| Authentication | Login, logout, token refresh, failures |
| Resource changes | Create, update, delete with before/after |
| Provisioning | Start, plan, apply, destroy with outcome |
| Credential access | Access, decryption, injection |
| Policy decisions | Allow, deny with rule reference |
| Team changes | Member add/remove, role changes |

### Audit Log Schema

```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "userId": "uuid",
  "action": "RESOURCE_CREATED",
  "resourceType": "CanvasDesign",
  "resourceId": "uuid",
  "timestamp": "ISO-8601",
  "details": { "before": {}, "after": {} },
  "ipAddress": "string",
  "userAgent": "string"
}
```

## Compliance Considerations

### LGPD (Brazil)

- Data minimization: collect only what's needed
- Consent for analytics
- Right to deletion (account deletion flow)
- Data processing records

### SOC 2 (Future)

- Access controls
- Audit logging
- Encryption at rest and in transit
- Incident response procedures
- Change management

### GDPR (Future)

- Data minimization
- Right to erasure
- Data portability
- Privacy by design

## Security Roadmap

| Priority | Item | Status |
|----------|------|--------|
| P0 | Credential encryption | ✅ Implemented |
| P0 | Multi-tenant isolation | ✅ Implemented |
| P0 | RBAC enforcement | ✅ Implemented |
| P1 | Audit logging | ✅ Implemented |
| P1 | Rate limiting | ✅ Implemented |
| P1 | Input validation | ✅ Implemented |
| P2 | OAuth (GitHub, Google) | 🟡 Partial |
| P2 | SAML/OIDC SSO | 🟡 Prototype |
| P2 | MFA | 🔴 Not started |
| P2 | Credential rotation | 🔴 Not started |
| P3 | Secret scanning in CI | 🔴 Not started |
| P3 | Penetration testing | 🔴 Not started |
| P3 | SOC 2 readiness | 🔴 Not started |
