# ADR-025: SSO Authentication Flow — OAuth2 Authorization Code + PKCE

**Status**: Implemented (with bugs)
**Date**: 2026-06-21
**Author**: Backend Agent

## Context

CloudBuilder has a complete IAM module with:

- `SsoProviderConfig` entity — stores provider configuration (provider type, client ID, encrypted client secret, allowed domains, enabled flag)
- `SsoProviderConfigRepository` — CRUD repository
- `SsoProviderService` — CRUD service for managing SSO provider configurations
- `SsoProviderController` — REST endpoints for SSO config management
- `AuthService` — username/password authentication with JWT
- `TenantFilter` / `TenantContext` — multi-tenant isolation

However, **the actual SSO login flow is not implemented**. While `SsoProviderConfig` stores the provider configuration (Google Workspace, Azure AD, Okta, etc.), there is no:

1. OAuth2 Authorization Code flow initiation (`/oauth2/authorize`)
2. Callback endpoint (`/oauth2/callback`)
3. State parameter validation (CSRF protection)
4. PKCE (Proof Key for Code Exchange) for public clients
5. ID token validation and user provisioning

## Problem

How to implement SSO login using existing `SsoProviderConfig` configurations, following OAuth2 best practices, without forcing all tenants to use SSO and without breaking the existing username/password authentication flow?

## Decision

### 1. OAuth2 Authorization Code Flow + PKCE

**Chosen**: Standard OAuth2 Authorization Code flow with PKCE (RFC 7636) for all SSO providers.

**Flow**:

```
Browser                          Backend                          SSO Provider
  |                                 |                                  |
  |  GET /api/v1/auth/oauth2/{tenant}/{provider}                       |
  |  (redirect)                     |                                  |
  |                                 ├─ Validate tenant + provider exist|
  |                                 ├─ Generate state param (CSRF)     |
  |                                 ├─ Generate code_verifier (PKCE)   |
  |                                 ├─ Hash code_challenge (S256)      |
  |                                 ├─ Store state + verifier in cache |
  |                                 └─ Redirect to provider authorize  |
  |══════════════════════════════════════════════════════════════════>  |
  |                                 |  User authenticates with SSO     |
  |<══════════════════════════════════════════════════════════════════  |
  |  ?code=AUTHORIZATION_CODE&state=XYZ                                |
  |  GET /api/v1/auth/oauth2/callback?code=...&state=...               |
  |                                 ├─ Validate state parameter        |
  |                                 ├─ Retrieve code_verifier from cache|
  |                                 ├─ POST /token with code + verifier|
  |                                 |════════════════════════════════>  |
  |                                 |<══ { access_token, id_token }    |
  |                                 ├─ Validate id_token (JWT decode)  |
  |                                 ├─ Extract email, name, sub        |
  |                                 ├─ Auto-create or match user       |
  |                                 ├─ Generate CloudBuilder JWT       |
  |                                 └─ Redirect to frontend with token |
  |<══════════════════════════════════════════════════════════════════  |
  |  Frontend: parse token from URL, store in authStore                |
```

### 2. State Parameter (CSRF Protection)

Every authorization request generates a cryptographically random `state` parameter:

```java
private String generateState() {
    var bytes = new byte[32];
    secureRandom.nextBytes(bytes);
    var sb = new StringBuilder();
    for (byte b : bytes) sb.append(String.format("%02x", b));
    return sb.toString();
}
```

The state is stored in Caffeine cache with 10-minute TTL:
```java
cache.put("oauth2:state:" + state, new StateData(providerConfigId, codeVerifier, tenantId));
```

On callback, the state is validated against the cache entry before the token exchange proceeds.

### 3. PKCE (Code Verifier + Challenge)

For public clients (browser-based frontend), PKCE prevents authorization code interception:

```java
// Generate code_verifier (random 43-128 char string)
private String generateCodeVerifier() {
    var bytes = new byte[32];
    secureRandom.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
}

// Generate code_challenge = BASE64URL(SHA256(code_verifier))
private String generateCodeChallenge(String codeVerifier) throws Exception {
    var sha256 = MessageDigest.getInstance("SHA-256");
    var hash = sha256.digest(codeVerifier.getBytes(StandardCharsets.US_ASCII));
    return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
}
```

### 4. @ConditionalOnProperty for SSO Disable

SSO authentication is disabled by default:

```yaml
cloudbuilder:
  sso:
    enabled: false  # SSO disabled by default
```

```java
@Configuration
@ConditionalOnProperty(name = "cloudbuilder.sso.enabled", havingValue = "true")
public class SsoAuthConfiguration {
    // SSO controllers and services are only loaded when enabled
}
```

When disabled:
- `/api/v1/auth/oauth2/*` endpoints return 404
- The SSO login button is hidden in the frontend
- Only username/password authentication is available

Per-tenant granularity:
Each tenant can have multiple SSO providers configured via `SsoProviderConfig`. The flow checks `enabled` flag per provider before initiating.

### 5. User Provisioning

On successful SSO callback:

1. Extract claims from the ID token (email, name, sub)
2. Look up user by email in the tenant context
3. **If user exists**: Validate they belong to the tenant; log them in
4. **If user does not exist**: Auto-create a new user with `viewer` role (configurable) and link to tenant
5. **If email domain matches allowed_domains**: Auto-provision; otherwise reject

```java
private User provisionUser(String email, String name, String tenantId, String providerId) {
    return userRepository.findByEmail(email)
        .orElseGet(() -> {
            var user = new User(email, null, name);  // No password for SSO users
            user.setSsoOnly(true);
            user.setEnabled(true);
            user = userRepository.save(user);
            // Link to tenant with default role
            var tenantUser = new TenantUser(tenantId, user.getId(), defaultRoleId);
            tenantUserRepository.save(tenantUser);
            return user;
        });
}
```

## Alternatives Considered

| Alternative | Pros | Cons |
|-------------|------|------|
| **Implicit flow** (no code exchange) | Fewer round trips | Access token in URL fragment; no refresh token; deprecated by OAuth2 Security BCP |
| **Authorization Code without PKCE** | Simpler server-side | Vulnerable to authorization code interception on public clients |
| **OIDC Discovery URL** | Auto-configuration | Requires OIDC-compliant provider; extra HTTP call on every login |
| **Third-party library (Spring Security OAuth2)** | Battle-tested | Heavy dependency; opinionated auto-config; harder to customize |
| **Manual implementation** | Full control, no deps | More code to maintain; but we already have the SSO config entities |

**Rationale for manual implementation**:
- We already have `SsoProviderConfig`, `SsoProviderService`, and JWT infrastructure
- Spring Security OAuth2 Client auto-configuration would duplicate our existing tenant-aware SSO config
- Manual implementation is ~200 lines of well-tested code vs. pulling in a large framework
- PKCE and state validation are well-documented standards

## Trade-offs

- **Security vs. convenience**: PKCE adds complexity (verifier generation, challenge hashing) but prevents authorization code interception — a well-known attack vector for public clients. The added code is ~20 lines and well-documented.
- **Auto-provisioning vs. manual approval**: Auto-provisioning is convenient but allows anyone with a matching email domain to create an account. The `allowed_domains` filter on `SsoProviderConfig` mitigates this — only email addresses matching configured domains are auto-provisioned.
- **Manual vs. framework implementation**: Manual implementation is ~200 lines vs. using Spring Security OAuth2 Client. The manual approach gives us full control over the tenant-aware provisioning flow, which would be difficult to achieve with auto-configuration.

## Consequences

1. **New**: `SsoAuthController.java` in `iam/infrastructure/web/` — `/api/v1/auth/oauth2/{tenantId}/{providerType}` and `/api/v1/auth/oauth2/callback`
2. **New**: `SsoAuthService.java` in `iam/domain/service/` — state generation, PKCE, token exchange, user provisioning
3. **New**: `SsoAuthConfiguration.java` — `@ConditionalOnProperty(name = "cloudbuilder.sso.enabled", havingValue = "true")`
4. **Modified**: `AuthService.java` — support SSO-provisioned users (no password, ssoOnly flag)
5. **Modified**: `User.java` — add `ssoOnly` and `ssoProvider` fields
6. **New**: Caffeine cache entry `oauth2:state:{state}` for state PKCE validation (10 min TTL)
7. **Frontend**: SSO login button on login page; callback URL handler (`window.location.search` parsing)
8. **Configuration**: `cloudbuilder.sso.enabled=false` by default in `application.yml`
9. **Testing**: Unit tests for state generation, PKCE, token exchange, user provisioning; integration tests for callback flow

## References

- SsoProviderConfig.java: Existing SSO provider configuration entity
- SsoProviderService.java: Existing CRUD service for SSO configs
- RFC 6749 — The OAuth 2.0 Authorization Framework
- RFC 7636 — Proof Key for Code Exchange (PKCE)
- OAuth 2.0 Security Best Current Practice: https://tools.ietf.org/html/draft-ietf-oauth-security-topics
- Spring Security OAuth2 (reference): https://docs.spring.io/spring-security/reference/servlet/oauth2/index.html
- Auth0 — Authorization Code Flow with PKCE: https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow-with-pkce
- ADR-018: TOTP MFA + JWT Refresh Rotation (existing auth infrastructure)
