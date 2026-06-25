# ADR-022: API Versioning Strategy — Sunset/Deprecation Headers + Accept Header

**Status**: Proposed
**Date**: 2026-06-21
**Author**: Backend Agent

## Context

CloudBuilder currently exposes all APIs under the `/api/v1/` prefix. However, there is:

1. **No sunset/deprecation policy** — no mechanism to communicate upcoming breaking changes to API consumers
2. **No graceful deprecation** — removing or changing an endpoint would break all connected clients immediately
3. **Multiple consumers** — the frontend SPA, Go provision-engine (via gRPC-to-REST bridge), and potentially third-party integrations all consume the REST API

As the platform grows (Phase 3 and beyond per the roadmap), API stability becomes critical for:
- Third-party marketplace integrations (ADR-015)
- GitOps webhooks (ADR-016)
- Multi-region deployments (ADR-019)
- Future SDK and CLI tooling

## Problem

How to evolve the REST API without breaking existing consumers, communicate changes proactively, and maintain a clean versioning contract?

## Decision

### 1. Accept Header Versioning (not URL path)

**Chosen**: Clients specify API version via the `Accept` header:
```
Accept: application/vnd.cloudbuilder.v2+json
```

**Not chosen**:
- **URL path versioning** (`/api/v2/canvases`): Creates URL proliferation, complicates route definitions, and encourages version sprawl. Widely considered an anti-pattern by the API community (Stripe, GitHub, and Shopify all use header-based versioning).
- **Query parameter versioning** (`?version=2`): Easy to forget; not cache-friendly; pollutes query string semantics.
- **Custom header versioning** (`X-API-Version: 2`): Non-standard; not supported by HTTP caching intermediaries.

**Rationale**:
- `Accept` header is part of HTTP content negotiation (RFC 7231) — a standards-compliant approach
- Separates the *resource identifier* (URL) from the *representation* (version)
- Single URL structure simplifies documentation, monitoring, and tooling
- `Content-Type` in responses indicates which version was used

### 2. Sunset and Deprecation Headers

Every deprecated endpoint **MUST** include:

```http
Deprecated: true
Sunset: Sat, 21 Jun 2027 00:00:00 GMT
Link: </api/v1/canvases>; rel="successor-version"
```

| Header | Purpose | Example |
|--------|---------|---------|
| `Deprecated` | RFC 8594 — signals the endpoint is deprecated | `true` |
| `Sunset` | RFC 8594 — when support ends | ISO 8601 date |
| `Link` | RFC 8288 — points to the replacement | `<url>; rel="successor-version"` |

### 3. Two-Version Overlap Window

Each major version has a **minimum 6-month overlap window**:
- `v1` and `v2` coexist for ≥ 6 months from the `v2` GA date
- `v1` returns `Deprecated: true` header starting at `v2` GA
- `v1` returns `Sunset` header set to 6 months from `v2` GA
- Logging/warning in backend logs for deprecated version usage

**Timeline example**:
```
Month 0: v2 GA → v1 gets Deprecated header
Month 1-5: Migration period → warnings in logs, dashboard banner
Month 6: v1 Sunset → v1 returns 410 Gone
```

### 4. Version Resolution Logic

```
Client Request → Check Accept header
  ├─ No Accept header → Default to latest stable version (currently v1)
  ├─ Accept: application/vnd.cloudbuilder.v2+json → Route to v2 handlers
  └─ Unsupported version → 406 Not Acceptable + supported versions list
```

### 5. Implementation Pattern

Each controller checks version via `@RequestHeader` or a `VersionInterceptor`:

```java
// Option A: Interceptor (preferred for cross-cutting)
@Component
public class ApiVersionInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String accept = request.getHeader("Accept");
        ApiVersion version = ApiVersionResolver.resolve(accept);
        request.setAttribute("apiVersion", version);
        
        if (version.isDeprecated()) {
            response.setHeader("Deprecated", "true");
            response.setHeader("Sunset", version.sunsetDate());
        }
        return true;
    }
}

// Option B: Per-controller version check
@GetMapping("/canvases")
public ResponseEntity<List<CanvasDTO>> listCanvases(
        @RequestHeader(value = "Accept", defaultValue = "application/vnd.cloudbuilder.v1+json") String accept) {
    var version = ApiVersionResolver.resolve(accept);
    // version-specific logic or delegation
}
```

## Alternatives Considered

| Alternative | Pros | Cons |
|-------------|------|------|
| **URL path versioning** (`/api/v2/`) | Visible, easy to test | URL proliferation, route duplication, anti-pattern per industry leaders |
| **Query parameter versioning** | Simple to implement | Not cache-friendly, easy to omit, non-standard |
| **No versioning (evolve in-place)** | Simplest | Breaks clients on every change; not viable for third-party APIs |
| **GraphQL** | No versioning needed | Over-engineered for current REST needs; new client library required |

## Trade-offs

- **Standards compliance vs. simplicity**: Accept header versioning is more complex to implement than URL path versioning but follows HTTP standards and is more maintainable long-term.
- **6-month overlap vs. shorter windows**: Longer overlap means maintaining more code but gives consumers adequate migration time. For internal-only APIs (current state), a shorter 3-month window could be considered.
- **Backend complexity**: The interceptor pattern adds a filter to every request. This is negligible overhead compared to the flexibility gained.

## Consequences

1. **New**: `ApiVersion` enum in `shared/` package
2. **New**: `ApiVersionResolver` utility to parse Accept header and map to version
3. **New**: `ApiVersionInterceptor` or `ApiVersionFilter` to set request attributes and response headers
4. **New**: `ApiVersionControllerAdvice` to handle unsupported versions (406 response)
5. **Modified**: Controllers may check `request.getAttribute("apiVersion")` for version-specific behavior
6. **Documentation**: API docs must include supported Accept header values
7. **Frontend**: Update `HttpClient` to send `Accept: application/vnd.cloudbuilder.v1+json` header
8. **No changes needed** for current `/api/v1/` prefixed routes — they continue to work as v1 handlers

## References

- RFC 7231 — HTTP/1.1 Semantics and Content Negotiation
- RFC 8594 — The Sunset HTTP Header Field
- RFC 8288 — Web Linking
- Stripe API Versioning: https://stripe.com/docs/api/versioning
- GitHub API Versioning: https://docs.github.com/en/rest/overview/api-versions
- Shopify API Versioning: https://shopify.dev/api/usage/versioning
- ADR-008: Native Observability (first ADR to establish conventions)
