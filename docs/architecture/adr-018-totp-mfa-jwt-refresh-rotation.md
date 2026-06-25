# ADR-018: TOTP MFA + JWT Refresh Token Rotation

**Status**: Implemented
**Date**: 2026-06-21
**Author**: Principal Architect Agent

## Context

CloudBuilder IAM module has a complete RBAC system (User, Role, Permission, Tenant entities; JWT with jjwt 0.12.6; Spring Security with `@PreAuthorize`; TenantFilter for multi-tenancy). However:

1. **No multi-factor authentication** — password-only login
2. **No session management** — JWT is stateless with no revocation mechanism
3. **No SAST/DAST pipeline** in CI/CD

As we enter Sprint 21 (Security Hardening) of Q4 2026, these gaps need to be addressed.

## Problem

How to add MFA and session management without external dependencies (no Twilio, no Auth0, no Redis) and minimal UX friction?

## Decision

### 1. TOTP (RFC 6238) — not SMS, not WebAuthn

**Chosen**: Time-based One-Time Password (TOTP) via `javax.crypto.Mac` (native JDK).

**Alternatives considered**:
- **SMS OTP**: ~R$0.10/message; Twilio/Amazon SNS dependency; phishing vulnerability; unreliable delivery in Brazil
- **WebAuthn/passkeys**: Most secure (phishing-resistant) but browser support still fragmented; complex UX setup
- **Email OTP No**: email delivery latency; inbox clutter; phishing vector

**Rationale**:
1. Zero cost — no SMS provider, no external API
2. RFC 6238 reference implementation fits in 40 lines of Java using `javax.crypto.Mac` with HmacSHA1
3. Works with Google Authenticator, Authy, Microsoft Authenticator, 1Password — no app to build
4. TOTP is the market standard (Google, GitHub, AWS, all use it)

**Implementation**:
```java
// Secret generation
byte[] secret = new byte[20];
new SecureRandom().nextBytes(secret);
String base32Secret = Base32.encode(secret);

// TOTP verification (30-second window, 1 step tolerance)
Totp totp = new Totp(base32Secret);
boolean valid = totp.verify(code);
```

**Consequences**: `java-base32` dependency (or inline Base32 encoding). TOTP secret encrypted at rest in `User.totpSecret`.

### 2. Backup Codes (not recovery email)

**Chosen**: 8 single-use backup codes, SHA-256 hashed in database.

**Rationale**: Recovery email adds dependency on email delivery infrastructure. Backup codes are standard (GitHub, Google all use them). 8 codes = 8 opportunities to regain access before admin override needed.

**Consequences**: `User` entity gains `backupCodes TEXT` column (JSON array of SHA-256 hashes). Codes shown once during MFA setup.

### 3. JWT Refresh Token Rotation

**Chosen**: Short-lived access tokens (15 min) + longer-lived refresh tokens (7 days) with rotation.

**Alternatives considered**:
- Stateless JWT only (no revocation possible until token expiry — 15 min window)
- OAuth2 opaque tokens (requires authorization server — Keycloak/Auth0, too heavy)
- Session cookies (stateful, doesn't work with SPA + API separation)

**Architecture**:
```
Access Token: 15 min, stateless (HMAC-SHA256)
  Claims: sub, roles, tenantId, mfaVerified

Refresh Token: 7 days, stored in refresh_tokens table
  Fields: id, tokenHash (SHA-256), userId, expiresAt, revoked, createdAt

Login Flow:
  1. Password → access token (15 min) + refresh token (7 days)
  2. If MFA enabled: returns mfaRequired=true, temporary token (5 min)
  3. TOTP + temp token → real access + refresh tokens

Refresh Flow:
  1. POST /api/v1/auth/refresh { refreshToken }
  2. Verify token hash in DB, check not revoked, check expiry
  3. Revoke old refresh token
  4. Issue new access token + new refresh token
  5. Return 401 if refresh token is revoked (theft detected)

Logout Flow:
  1. POST /api/v1/auth/logout { refreshToken }
  2. Revoke specific refresh token
  3. Client discards access token

Force Revoke All:
  1. POST /api/v1/auth/revoke-all (admin)
  2. Increment jwtSecret version in app_config
  3. All existing tokens become invalid
```

**Consequences**: New `refresh_tokens` table. 7-day cleanup via `@Scheduled` (daily). Rotation prevents token theft (revoked token reuse is detected).

### 4. SAST/DAST Pipeline (CI/CD)

**Chosen**: GitHub Actions workflow with free tools — Semgrep, OWASP Dependency Check, Gitleaks.

```yaml
sast:
  - Semgrep (ruleset: p/java, p/javascript)
  - OWASP Dependency Check (pom.xml audit)

secrets:
  - Gitleaks (commits + files)

dast:  # nightly
  - ZAP Baseline Scan against staging
```

**Alternatives considered**:
- Snyk (paid, $200+/month for team)
- Checkmarx (enterprise, $50K+/year)
- GitHub CodeQL (free for public repos, limited for private)

**Rationale**: Semgrep + Dependency Check + Gitleaks cover OWASP Top 10 categories at zero cost. All three run in GitHub Actions without additional infrastructure.

**Consequences**: Security scan adds ~3 minutes to CI pipeline. Scheduled DAST scan requires staging environment.

## Consequences

1. **Backend**: UserMfa entity + MfaService + MfaController + refresh_tokens table + Session entity
2. **Backend**: JwtTokenProvider — add refresh token generation and rotation
3. **Backend**: SecurityConfig — add MFA challenge route (unauthenticated with temp token)
4. **Frontend**: IAMModule — MFA setup dialog, session management table
5. **Frontend**: LoginPage — TOTP challenge step (conditional)
6. **CI**: `.github/workflows/security-scan.yml` — Semgrep + Dependency Check + Gitleaks
7. **New dependencies**: `java-base32` (or inline), Semgrep (GHA), Gitleaks (GHA)

## References

- JwtTokenProvider.java: Existing JWT implementation (jjwt 0.12.6)
- SecurityConfig.java: Existing Spring Security config
- AuthController.java: Existing auth endpoints
- User.java: Existing IAM entity
- ADR-012: Q3 Operations Architecture (session management considerations)
