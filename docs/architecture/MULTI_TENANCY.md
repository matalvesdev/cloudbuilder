# Multi-Tenancy

> Status: Active | Owner: Engineering | Last Updated: 2026-08-14

## Model

CloudBuilder uses **shared database, shared schema** multi-tenancy with row-level isolation via `tenantId`.

## Tenant Boundary

Every data entity includes a `tenantId` column. All queries are automatically scoped to the current tenant via JPA `@Filter`.

```java
@EntityFilter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class TenantFilter { ... }
```

## How It Works

### Request Flow

```
1. User sends request with JWT token
2. Spring Security extracts tenantId from JWT
3. TenantContext.setTenantId(tenantId)
4. TenantFilter activates on all JPA queries
5. All data access is scoped to tenant
```

### Code Example

```java
// Controller extracts tenant from JWT
@RestController
public class CanvasController {
    @GetMapping("/canvases")
    public List<Canvas> getCanvases() {
        // TenantFilter automatically scopes to current tenant
        return canvasRepository.findAll();
    }
}
```

## Data Isolation

### What's Isolated

| Entity | Isolation Method |
|--------|-----------------|
| Canvas designs | tenantId column + TenantFilter |
| Credentials | tenantId column + TenantFilter |
| Environments | tenantId column + TenantFilter |
| Deployments | tenantId column + TenantFilter |
| Audit logs | tenantId column + TenantFilter |
| Team members | tenantId column + TenantFilter |

### What's Shared

| Entity | Why |
|--------|-----|
| Component definitions | Global catalog, not tenant-specific |
| Feature flags | Platform-wide configuration |
| System settings | Global settings |

## Threat Scenarios

### Tenant A reads Tenant B data
**Mitigation:** TenantFilter on all queries. tenantId extracted from JWT, not request body.

### Tenant A modifies Tenant B resources
**Mitigation:** Every write operation checks tenantId matches current tenant.

### Cache leaks information across tenants
**Mitigation:** Cache keys include tenantId prefix.

### Background worker loses tenant context
**Mitigation:** TenantContext propagated to async operations.

### Webhook executes in wrong tenant
**Mitigation:** Webhook payload includes tenantId, validated before execution.

### AI agent receives cross-tenant context
**Mitigation:** Context layer filters by tenantId before sending to model.

## Implementation Details

### TenantFilter

```java
@FilterDef(name = "tenantFilter", parameters = {
    @ParamDef(name = "tenantId", type = "string")
})
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public abstract class TenantAwareEntity {
    @Column(name = "tenant_id")
    private String tenantId;
}
```

### TenantContext

```java
public class TenantContext {
    private static final ThreadLocal<String> TENANT_ID = new ThreadLocal<>();
    
    public static void setTenantId(String tenantId) {
        TENANT_ID.set(tenantId);
    }
    
    public static String getTenantId() {
        return TENANT_ID.get();
    }
    
    public static void clear() {
        TENANT_ID.remove();
    }
}
```

### JWT Extraction

```java
@Component
public class TenantFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, ...) {
        String tenantId = extractTenantIdFromJwt(request);
        TenantContext.setTenantId(tenantId);
        try {
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}
```

## Testing Tenant Isolation

### Unit Tests
- Verify queries return only tenant-scoped data
- Verify cross-tenant access is blocked
- Verify TenantContext propagation

### Integration Tests
- Create data in Tenant A
- Verify Tenant B cannot access it
- Verify background jobs maintain tenant context

### Security Tests
- Attempt to access other tenant's data via API
- Attempt to modify other tenant's resources
- Attempt to bypass TenantFilter

## Migration Path

If migrating to schema-per-tenant or database-per-tenant:

1. Add tenantId to all entities (already done)
2. Add TenantFilter to all repositories (already done)
3. Add tenant scoping to all queries (already done)
4. Test cross-tenant isolation (already done)
5. Consider schema-per-tenant for enterprise customers
6. Consider database-per-tenant for regulated industries

## Monitoring

- Log tenantId with all operations
- Track API calls per tenant
- Monitor for cross-tenant access attempts
- Alert on tenant context loss in async operations
