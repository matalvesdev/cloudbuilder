# ADR-028: Security Hardening & Secrets Management

**Status**: Proposed
**Date**: 2026-06-22
**Author**: Platform Engineering Team

## Context

CloudBuilder's current security posture:

| Area | Current State | Assessment |
|------|--------------|------------|
| **Authentication** | JWT (jjwt 0.12.6) + Spring Security | ✅ Sound |
| **Authorization** | Role-based `@PreAuthorize` (admin/editor/viewer) | ✅ Sound |
| **MFA** | TOTP via authenticator app (ADR-018) | ✅ Implemented |
| **SSO** | OAuth2 + PKCE flow (ADR-025) | ✅ Implemented |
| **Secret Storage** | Plaintext in database (cloud credentials, API keys) | ❌ **Critical gap** |
| **TLS** | No HTTPS in dev; self-signed certs only | ❌ **Gap** |
| **SAST/DAST** | No automated scanning | ❌ **Gap** |
| **Dependency scanning** | Not integrated in CI | ❌ **Gap** |
| **Session management** | JWT stored in localStorage | ⚠️ **Risk** |
| **Audit logging** | AuditEvent entity + AuditService | ✅ Implemented |
| **Rate limiting** | Not implemented | ⚠️ **Gap** |
| **Input validation** | `@Valid` on DTOs; some manual validation | ⚠️ Partial |

The roadmap calls for Sprint 21 (Security Hardening) in Q4 2026 with:
- SAST/DAST pipeline, dependency scanning
- Secrets management (Vault)
- TLS everywhere, MFA/2FA, session management, audit logging

As a platform engineering tool that handles cloud provider credentials, API keys, and infrastructure access, **secrets management is the highest-priority security gap**.

## Problem

How to harden CloudBuilder's security posture with a focus on:

1. **Secrets management**: Secure storage of cloud provider credentials, API keys, SCIM tokens, webhook secrets
2. **TLS everywhere**: HTTPS for all API communication, including frontend→backend and inter-service
3. **CI/CD security**: Automated SAST, dependency scanning, secret scanning
4. **Session security**: Move from localStorage to httpOnly cookies; implement refresh token rotation
5. **Rate limiting**: Protect API endpoints from abuse
6. **Compliance**: OWASP Top 10 coverage, audit trail completeness
7. **Cost**: Zero new external dependencies (consistent with $0 infra principle)

## Alternatives Considered

### Secrets Management

| Alternative | Pros | Cons |
|-------------|------|------|
| **HashiCorp Vault** | Industry standard; dynamic secrets; audit | Heavy operation; external dependency; contradicts $0 infra |
| **AWS Secrets Manager / Azure Key Vault** | Managed; cloud-integrated | Cloud vendor lock-in; cost per secret |
| **Database encryption at rest + column encryption (chosen)** | Zero new deps; Spring Crypto integrated; simple | Manual key rotation; no auto-unseal |
| **Environment variables only** | Simplest; no storage risk | No per-secret rotation; no audit; hard to manage at scale |
| **SOPS + Git** | Git-backed; key management via KMS | Requires external tooling; not API-accessible |

### TLS

| Alternative | Pros | Cons |
|-------------|------|------|
| **Let's Encrypt + cert-manager** | Free; automated renewal | Requires DNS validation; external dependency |
| **Self-signed in dev, Let's Encrypt in prod (chosen)** | Practical; zero cost in dev | Manual setup for self-signed |
| **mTLS everywhere** | Strongest security | Significant complexity; overkill for monolith |
| **Cloud load balancer TLS termination** | Managed; simple | Cloud vendor dependency; end-to-end not encrypted |

### SAST/DAST

| Alternative | Pros | Cons |
|-------------|------|------|
| **GitHub CodeQL (chosen)** | Free for public repos; integrated in GH Actions; Java + TypeScript | Requires public repo or GitHub Enterprise |
| **Semgrep** | Powerful rules; SAST + secrets | Additional CI step; rule maintenance |
| **SonarQube** | Rich dashboard; quality gate | Heavy infra (self-hosted) or cost (cloud) |
| **Manual code review** | Human intelligence | Not scalable; no automation |

**Rationale for chosen alternatives**:
- Database encryption aligns with $0 infra principle and uses existing Spring Crypto module
- Let's Encrypt + cert-manager is production-standard at zero cost
- GitHub CodeQL is integrated in our existing CI pipeline
- httpOnly cookies + refresh token rotation is a code change, no new deps

## Decision

### 1. Secrets Management — Database Encryption + Spring Crypto

Store all secrets encrypted at the column level using Spring's `TextEncryptor`:

```java
// Encrypted column type for credentials
@Converter
public class SecretEncryptionConverter implements AttributeConverter<String, String> {
    private final TextEncryptor encryptor = Encryptors.text(
        masterKey,  // 256-bit key from environment variable
        "deadbeef"  // hex-encoded salt (16 chars)
    );
    
    @Override
    public String convertToDatabaseColumn(String plaintext) {
        return plaintext == null ? null : encryptor.encrypt(plaintext);
    }
    
    @Override
    public String convertToEntityAttribute(String ciphertext) {
        return ciphertext == null ? null : encryptor.decrypt(ciphertext);
    }
}
```

**Entities requiring secret encryption**:

| Entity | Field | Encryption |
|--------|-------|------------|
| `SsoProviderConfig` | `clientSecret` | AES-256-GCM |
| `SsoProviderConfig` | `encryptedClientSecret` | AES-256-GCM |
| `Credential` (credentialStore) | `accessKey` | AES-256-GCM |
| `Credential` | `secretKey` | AES-256-GCM |
| `ScimConfig` (new, ADR-026) | `bearerToken` | AES-256-GCM |
| `NotificationChannel` | `config` (webhook URL, secret) | AES-256-GCM |

**Master key management**:
```yaml
# application.yml — master key from environment
cloudbuilder:
  security:
    master-key: ${CLOUDBUILDER_MASTER_KEY}  # 256-bit hex key, never in config file
    master-salt: ${CLOUDBUILDER_MASTER_SALT}  # hex salt
```

**Key rotation**:
```java
// Key rotation service — re-encrypts all secrets with new key
@Service
public class KeyRotationService {
    public void rotateKey(String newMasterKey, String newSalt) {
        // 1. Configure new encryptor with new key
        // 2. Read all encrypted fields using old encryptor
        // 3. Write back using new encryptor
        // 4. Update application config
        // This is an offline maintenance operation
    }
}
```

### 2. TLS — Let's Encrypt via Certbot

**Development** (docker-compose):
```yaml
# docker-compose.yml — optional TLS sidecar
services:
  nginx-tls:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./dev/certs:/etc/nginx/certs:ro
      - ./dev/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend
      - frontend
```

**Production**:
```
Frontend (Nginx) → Let's Encrypt cert-manager → Auto-renewal
Backend (Spring Boot) → TLS termination at Nginx or embedded via:
  server.ssl.key-store=/etc/certs/keystore.p12
  server.ssl.key-store-password=${SSL_KEYSTORE_PASSWORD}
```

### 3. SAST — GitHub CodeQL

```yaml
# .github/workflows/codeql.yml
name: "CodeQL Security Scan"
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 6 * * 1'  # Weekly Monday 6 AM

jobs:
  analyze:
    name: Analyze (${{ matrix.language }})
    runs-on: ubuntu-latest
    strategy:
      matrix:
        language: ['java-kotlin', 'javascript-typescript']
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with:
          languages: ${{ matrix.language }}
          queries: security-extended,security-and-quality
      - uses: github/codeql-action/analyze@v3
```

### 4. Session Security — httpOnly Cookies + Refresh Rotation

Replace localStorage JWT with httpOnly, Secure, SameSite=Strict cookies:

```java
// JwtTokenProvider — new cookie-based token delivery
public void addTokenToResponse(HttpServletResponse response, String token) {
    var cookie = new Cookie("cloudbuilder_token", token);
    cookie.setHttpOnly(true);
    cookie.setSecure(true);       // HTTPS only
    cookie.setPath("/");
    cookie.setMaxAge(3600);       // 1 hour
    cookie.setAttribute("SameSite", "Strict");
    response.addCookie(cookie);
}
```

Frontend consumes token via cookie (auto-sent by browser):
```typescript
// api/HttpClient.ts — no manual token management
// Token sent automatically via httpOnly cookie
// No localStorage access needed
```

Refresh token rotation (existing ADR-018):
```typescript
authStore.refreshToken = async () => {
    const response = await api.post('/api/v1/auth/refresh');
    if (response.ok) {
        // Cookie auto-updated by backend
        return true;
    }
    // Redirect to login
};
```

### 5. Rate Limiting

```java
// Rate limiting via Spring Boot + Caffeine cache
@Component
public class RateLimitingInterceptor implements HandlerInterceptor {
    private final Cache<String, Integer> requestCounts = Caffeine.newBuilder()
        .expireAfterWrite(1, TimeUnit.MINUTES)
        .build();
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String key = request.getRemoteAddr() + ":" + request.getRequestURI();
        int count = requestCounts.get(key, k -> 0) + 1;
        requestCounts.put(key, count);
        
        if (count > 100) {  // 100 requests/minute/IP
            response.setStatus(429);
            return false;
        }
        return true;
    }
}
```

| Endpoint Group | Rate Limit | Rationale |
|---------------|------------|-----------|
| `/api/v1/auth/**` | 10/min/IP | Brute force protection |
| `/api/v1/scim/v2/**` | 100/min/IP | Enterprise provisioning |
| `/api/v1/canvases` | 60/min/IP | Normal API usage |
| `/api/v1/aiops/query` | 30/min/IP | LLM API cost protection |
| All others | 100/min/IP | Default |

### 6. OWASP Top 10 Coverage

| OWASP Category | Current Coverage | Gap Addressed By |
|----------------|-----------------|------------------|
| A01: Broken Access Control | `@PreAuthorize` + RBAC | ✅ Complete |
| A02: Cryptographic Failures | JWT signed; no secret encryption | 🔒 Secret encryption (this ADR) |
| A03: Injection | `@Valid` DTOs; parameterized queries | ✅ Complete |
| A04: Insecure Design | MFA (ADR-018); SSO (ADR-025) | ✅ Complete |
| A05: Security Misconfiguration | No TLS in dev | 🔒 TLS (this ADR) |
| A06: Vulnerable Components | No dependency scanning | 🔒 CodeQL + Dependabot (this ADR) |
| A07: ID/Auth Failures | JWT in localStorage | 🔒 httpOnly cookies (this ADR) |
| A08: Software/Data Integrity | No CI/CD security scan | 🔒 CodeQL + secret scanning (this ADR) |
| A09: Security Logging/Monitoring | Audit events exist | ⚠️ Enhance with security-specific events |
| A10: SSRF | No outbound request validation | ⚠️ Future work |

## Trade-offs

- **Encryption vs. performance**: Column-level encryption adds ~1-5ms per read/write of secret fields. Acceptable for credential entities (low-frequency access). Not applied to high-frequency entities (canvases, nodes).

- **httpOnly cookies vs. localStorage**: Cookies are more secure (no XSS access) but require backend changes for token delivery and CSRF protection. CSRF is mitigated by SameSite=Strict and the existing SPA→API same-origin architecture.

- **Rate limiting at application vs. infrastructure level**: Application-level (Caffeine in-process) is simpler but resets on restart. Infrastructure-level (Nginx/API Gateway) survives restarts but adds deployment complexity. Start with application-level; add Nginx rate limiting in production.

- **Master key in environment variable**: Environment variables can leak in process dumps. More secure than config file; less secure than Vault. Acceptable for current scale; revisit when handling production secrets for 50+ tenants.

## Consequences

1. **New**: `SecretEncryptionConverter.java` — JPA `AttributeConverter` for AES-256-GCM column encryption
2. **New**: `KeyRotationService.java` — offline key rotation utility
3. **Modified**: `SsoProviderConfig.java`, `Credential.java`, `NotificationChannel.java` — add `@Convert(SecretEncryptionConverter.class)` to secret fields
4. **New**: `ScimConfig.java` — per-tenant SCIM secret storage
5. **New**: `.github/workflows/codeql.yml` — CodeQL SAST scan
6. **Modified**: `.github/dependabot.yml` — dependency vulnerability scanning
7. **New**: `JwtCookieFilter.java` — extract JWT from cookie instead of Authorization header
8. **Modified**: `JwtTokenProvider.java` — add cookie-writing method
9. **Modified**: `HttpClient.ts` — remove manual token header management (use cookies)
10. **New**: `RateLimitingInterceptor.java` — per-IP rate limiting via Caffeine
11. **Modified**: `SecurityConfig.java` — register rate limiting interceptor
12. **New**: Certificate management for TLS (Let's Encrypt cert-manager or embedded keystore)
13. **Configuration**: `CLOUDBUILDER_MASTER_KEY` and `CLOUDBUILDER_MASTER_SALT` environment variables
14. **Testing**: Encryption round-trip tests; rate limiter tests; cookie-based auth integration tests

## References

- OWASP Top 10 (2021): https://owasp.org/Top10/
- Spring Security Crypto: https://docs.spring.io/spring-security/reference/servlet/exploits/crypto.html
- GitHub CodeQL: https://codeql.github.com/
- Let's Encrypt: https://letsencrypt.org/
- RFC 6265 — HTTP Cookies: https://tools.ietf.org/html/rfc6265
- ADR-018: TOTP MFA + JWT Refresh Rotation
- ADR-025: SSO Authentication Flow
- CloudBuilder Roadmap — Sprint 21 (Security Hardening)
