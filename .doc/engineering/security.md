# Segurança e Compliance — CloudBuilder

## Postura de Segurança

A CloudBuilder adota **Security by Default** — todas as features são seguras por padrão, não opt-in.

## Autenticação

### JWT
- **Algoritmo**: HS256 (jjwt 0.12.6)
- **Expiração**: 24h access token, 7d refresh token
- **Claims**: sub (userId), tenantId, roles, iat, exp

### SSO (OAuth2 + PKCE)
- Google, GitHub, Okta
- PKCE flow para SPA security
- JWKS para verificação de tokens

### MFA (TOTP)
- RFC 6238 compliant
- Google Authenticator, Authy compatível
- Backup codes

## Autorização (RBAC)

### Roles
| Role    | Permissões                           |
| ------- | ------------------------------------ |
| admin   | CREATE, READ, UPDATE, DELETE, DEPLOY, MANAGE |
| editor  | CREATE, READ, UPDATE, DEPLOY         |
| viewer  | READ                                |

### Permission Gates
- **Module-level**: ProtectedContent component
- **Button-level**: ProtectedAction component
- **API-level**: @PreAuthorize annotations

## Multi-Tenant

- Tenant ID em todas as tabelas (VARCHAR(36))
- TenantFilter automático via JPA
- Isolamento por tenant em queries
- Cross-tenant access proibido

## Secrets Management

- AES-256-GCM encryption (SecretEncryptionConverter)
- PBKDF2 600K iterations para key derivation
- Env var `CLOUDBUILDER_ENCRYPTION_KEY` para master key
- Nunca hardcoded em código

## API Security

- CORS configurado para domínios permitidos
- Rate limiting (a implementar)
- Input validation em todos os endpoints
- SQL injection prevention (JPA parameterized queries)
- XSS prevention (React auto-escaping)

## Audit Trail

- Todas as ações registradas em `audit_events`
- IP address, user agent, timestamp
- Tenant-scoped audit logs
- Compliance reporting ready

## LGPD Compliance

- Dados pessoais: nome, email
- Consentimento explícito no registro
- Direito ao esquecimento (a implementar)
- Dados não compartilhados com terceiros
- Encryption at rest e in transit

## Vulnerability Management

- OWASP Dependency Check (CI)
- npm audit (CI)
- Snyk (configurado)
- No known critical vulnerabilities
