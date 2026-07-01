# CloudBuilder — Competitive Security Analysis & Recommendations

> **Documento**: Análise de segurança competitiva  
> **Data**: 2026-06-24  
> **Autoria**: Security Agent (FAANg)  
> **Status**: 🟢 Completo  
> **Versão**: 1.0

---

## Sumário Executivo

Esta análise examina as práticas de segurança de 6 competidores do CloudBuilder —
**Datadog**, **Grafana Labs**, **Dynatrace**, **New Relic**, **Miro** e **Excalidraw** —
mais padrões de integração com **HashiCorp Vault**, **OAuth2 BCP (RFC 9700)**
e post-mortems de incidentes públicos.

**Conclusão principal**: CloudBuilder já possui base sólida (JWT, Spring Security, BCrypt,
@PreAuthorize, TenantFilter, AuditEvent), mas está **atrasado em 6 áreas críticas**:

1. **SSO/SAML/OIDC** — Nenhum suporte (todos os 6 competidores têm)
2. **SCIM Provisioning** — Zero (padrão enterprise para lifecycle)
3. **API Key Management** — Inexistente (rotação, scopes, one-time-read)
4. **SOC 2 / ISO 27001** — Sem certificação (todos os competidores têm)
5. **Agent/Deployment Security** — Sem mTLS ou workload identity
6. **Zero Trust Architecture** — Sem JIT/JEA, sem micro-segmentação
---

## 1. Authentication & Authorization

### 1.1 SSO/SAML/OIDC — Comparativo

| Plataforma | SAML 2.0 | OIDC | LDAP | Google OAuth | Azure AD | Okta | MFA |
|---|---|---|---|---|---|---|---|
| **Datadog** | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Grafana** | ✅ (Enterprise) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Dynatrace** | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **New Relic** | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Miro** | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Excalidraw** | ✅ (Enterprise) | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| **CloudBuilder** | ❌ | ❌ | ❌ | ✅ (DevAuth) | ❌ | ❌ | ❌ |

### 1.2 RBAC — Comparativo de Granularidade

| Plataforma | Roles Built-in | Custom Roles | Resource-level Scopes | Env-level Permissions |
|---|---|---|---|---|
| **Datadog** | 3 (Admin/Standard/Read) | ✅ | ✅ (per API endpoint) | ❌ |
| **Grafana** | 4 (Admin/Editor/Viewer/None) | ✅ | ✅ (dashboard, datasource) | ❌ |
| **Dynatrace** | 4 (Admin/Manage/View/Monitor) | ✅ | ✅ (environment, service) | ✅ (dev/prod) |
| **New Relic** | 5 (Admin/User/Restricted/Read/Manage) | ✅ | ✅ (account, app, dashboard) | ✅ |
| **Miro** | 3 (Owner/Admin/Member) | ❌ | ✅ (board-level) | ❌ |
| **Excalidraw** | 2 (Admin/Member) | ❌ | ✅ (workspace, board) | ❌ |
| **CloudBuilder** | 3 (ADMIN/EDITOR/VIEWER) | ❌ | ✅ (module-level) | ❌ |

### 1.3 API Key Management

| Plataforma | API Keys | Scoped Keys | Auto-rotation | One-Time Read | Key Expiry | Audit |
|---|---|---|---|---|---|---|
| **Datadog** | ✅ Dual (API+App) | ✅ (since 2025) | ❌ | ✅ (OTR mode) | ❌ | ✅ |
| **Grafana** | ✅ (SA tokens) | ✅ | ✅ (configurable) | ❌ | ✅ | ✅ |
| **Dynatrace** | ✅ (Tokens) | ✅ | ✅ (30d default) | ❌ | ✅ | ✅ |
| **New Relic** | ✅ (Ingest/Query/User) | ✅ (NRQL scoped) | ❌ | ❌ | ✅ | ✅ |
| **Miro** | ✅ (REST API tokens) | ✅ (board scope) | ❌ | ❌ | ❌ | ✅ |
| **Excalidraw** | ✅ (Bearer sk-...) | ✅ (read/full) | ❌ | ❌ | ✅ | ❌ |
| **CloudBuilder** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 1.4 SCIM Provisioning

| Plataforma | SCIM 2.0 | JIT Provisioning | Auto-offboarding | Group Sync |
|---|---|---|---|---|
| **Datadog** | ✅ | ✅ | ✅ | ✅ |
| **Grafana** | ✅ (Cloud) | ✅ | ✅ | ✅ (Team Sync) |
| **Dynatrace** | ✅ | ✅ | ✅ | ✅ |
| **New Relic** | ✅ | ✅ | ✅ | ✅ |
| **Miro** | ✅ (Enterprise) | ✅ | ✅ | ❌ |
| **Excalidraw** | ❌ | ❌ | ❌ | ❌ |
| **CloudBuilder** | ❌ | ❌ | ❌ | ❌ |
---

## 2. Data Security

### 2.1 Encryption

| Plataforma | At-rest | In-transit | Key Management | BYOK | Per-tenant Keys |
|---|---|---|---|---|---|
| **Datadog** | AES-256 | TLS 1.2+ | AWS KMS | ✅ | ❌ |
| **Grafana** | AES-256 (Cloud) | TLS 1.3 (Cloud) | Cloud Provider | ❌ | ❌ |
| **Dynatrace** | AES-256 | TLS 1.2/1.3 | AWS/Azure KMS | ❌ | ✅ (dedicated S3) |
| **New Relic** | AES-256 | TLS 1.2+ | AWS KMS | ✅ | ❌ |
| **Miro** | AES-256 | TLS 1.2+ | AWS KMS | ❌ | ❌ |
| **Excalidraw** | AES-256 | TLS | Vanta-managed | ❌ | ❌ |
| **CloudBuilder** | ✅ (H2 dev) | ✅ (TLS nginx) | N/A | ❌ | ❌ |

### 2.2 Data Residency

| Plataforma | US | EU | APAC | GovCloud | Custom Region |
|---|---|---|---|---|---|
| **Datadog** | ✅ US1/3/5 | ✅ EU1 | ✅ AP1 | ✅ US1-FED | ❌ |
| **Grafana** | ✅ US | ✅ EU | ✅ | ❌ | ❌ |
| **Dynatrace** | ✅ (6 regions) | ✅ (3 regions) | ✅ (3 regions) | ❌ | ✅ |
| **New Relic** | ✅ US | ✅ EU | ✅ APAC | ✅ FedRAMP | ❌ |
| **Miro** | ✅ US | ✅ EU | ❌ | ❌ | ❌ |
| **Excalidraw** | ✅ US | ❌ | ❌ | ❌ | ❌ |
| **CloudBuilder** | ❌ | ❌ | ❌ | ❌ | ❌ |

### 2.3 Audit Logging

| Plataforma | Event Types | Retention | SIEM Export | Actor Tracking | IP | Immutable |
|---|---|---|---|---|---|---|---|
| **Datadog** | 100+ | 90d (default) | ✅ (Splunk, SIEM) | ✅ | ✅ | ✅ |
| **Grafana** | 30+ | 90d (default) | ✅ (webhook, Loki) | ✅ | ✅ | ✅ |
| **Dynatrace** | 100+ | 400d (default) | ✅ (Splunk, Elastic) | ✅ | ✅ | ✅ |
| **New Relic** | 50+ | 90d (default) | ✅ (NRQL export) | ✅ | ✅ | ✅ |
| **Miro** | 30+ | 90d (Enterprise) | ✅ (CSV, SIEM) | ✅ | ✅ | ✅ |
| **Excalidraw** | 20+ | 30d | ❌ | ✅ | ✅ | ❌ |
| **CloudBuilder** | ✅ (AuditEvent) | N/A (dev) | ❌ | ✅ | ✅ | ❌ |
---

## 3. Agent/Deployment Security

### 3.1 Agent Authentication

| Plataforma | Auth Method | mTLS | Token Rotation | Agent Identity | Workload Identity |
|---|---|---|---|---|---|
| **Datadog** | API Key + App Key | ❌ | Manual | Hostname + tags | ❌ |
| **Dynatrace** | OneAgent token + ActiveGate | ❌ | ✅ (30d) | Host + process | ❌ |
| **New Relic** | License Key + API Key | ✅ (FedRAMP) | Manual | Hostname | ❌ |
| **CloudBuilder** | N/A (provision-engine gRPC) | ❌ | ❌ | ❌ | ❌ |

### 3.2 Secret Management

| Plataforma | Vault Integration | Secrets Encryption | Dynamic Secrets | Rotation Policy |
|---|---|---|---|---|
| **Datadog** | ❌ (env vars) | AES-256 | ❌ | Manual |
| **Grafana** | ✅ (Vault + K8s Secret) | AES-256 | ❌ | Manual |
| **Dynatrace** | ✅ (Credential Vault) | AES-256 per-tenant | ❌ | Manual |
| **New Relic** | ❌ | AES-256 | ❌ | Manual |
| **CloudBuilder** | ❌ (credenciais inline) | ✅ BCrypt | ❌ | ❌ |

---

## 4. Compliance & Certifications

| Plataforma | SOC 2 Type II | ISO 27001 | HIPAA | FedRAMP | GDPR | PCI DSS |
|---|---|---|---|---|---|---|
| **Datadog** | ✅ | ✅ | ✅ | ✅ (Moderate) | ✅ | ✅ |
| **Grafana** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Dynatrace** | ✅ | ✅ | ✅ | ✅ (Moderate) | ✅ | ❌ |
| **New Relic** | ✅ | ✅ | ❌ | ✅ (Moderate) | ✅ | ❌ |
| **Miro** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Excalidraw** | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **CloudBuilder** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 5. Vulnerability Management

### 5.1 Bug Bounty & Disclosure

| Plataforma | Bug Bounty | Platform | Security.txt | CVE Tracking | Hall of Fame |
|---|---|---|---|---|---|
| **Datadog** | ✅ | HackerOne (private) | ✅ | ✅ | ✅ |
| **Grafana** | ✅ | HackerOne (public) | ✅ | ✅ | ✅ |
| **Dynatrace** | ✅ | HackerOne (private) | ✅ | ✅ | ✅ |
| **New Relic** | ✅ | HackerOne (private) | ✅ | ✅ | ✅ |
| **Miro** | ✅ | Intigriti | ✅ | ❌ | ✅ |
| **Excalidraw** | ✅ | Internal | ✅ | ❌ | ❌ |
| **CloudBuilder** | ❌ | ❌ | ❌ | ❌ | ❌ |

### 5.2 Known Security Incidents (Public Post-Mortems)

| Plataforma | Incidente | Causa Raiz | Data | Impacto |
|---|---|---|---|---|
| **Datadog** | Outage multi-region (M) | systemd-networkd OS update | Mar 2023 | M, 24h |
| **Datadog** | CVE-2025-61667 | Permissões diretorio Agent Linux | Nov 2025 | LPE local |
| **New Relic** | Breach staging env | Social engineering | Out 2023 | Acesso staging |
| **Dynatrace** | Breach Salesforce CRM | Third-party via Salesloft | Set 2025 | Business contact data |
| **Dynatrace** | GitHub repos stolen | PAT developer comprometido | Jun 2026 | 246 repos, 8.46GB |

**Principais aprendizados para CloudBuilder:**

1. **Patches automáticos de OS são perigosos** — Datadog desabilitou auto-updates após o outage 2023.
2. **PAT tokens são vetor crítico** — Dynatrace 2026: token dev expôs 246 repos. Usar OIDC short-lived.
3. **Supply chain third-party é elo fraco** — Dynatrace 2025: breach via Salesforce/Salesloft.
4. **Staging não é seguro** — New Relic 2023: acesso staging com credenciais roubadas.
---

## 6. Zero Trust Architecture Patterns

### 6.1 Comparativo Zero Trust

| Plataforma | ZTA Model | JIT Access | Just-Enough-Access | Micro-segmentação | Session Mgmt |
|---|---|---|---|---|---|
| **Datadog** | Identity-centric | ❌ | ✅ (scoped API keys) | ❌ | ✅ |
| **Grafana** | Identity-centric | ❌ | ✅ (dashboard-scoped) | ❌ | ✅ |
| **Dynatrace** | Identity + Network | ❌ | ✅ (env-level scopes) | ❌ | ✅ |
| **New Relic** | Identity-centric | ❌ | ✅ (NRQL-scoped) | ❌ | ✅ |
| **Miro** | Zero Trust by design | ❌ | ✅ (board-level) | ❌ | ✅ |
| **Excalidraw** | E2E encryption (free) | ❌ | ❌ | ❌ | ✅ |
| **CloudBuilder** | ❌ (perimeter-based) | ❌ | ❌ | ❌ | ❌ |

### 6.2 NIST SP 1800-35 Relevant Patterns

O NIST publicou (Jun 2025) o guia final SP 1800-35 com 19 implementações de ZTA.

| Padrão | Descrição | Aplicação CloudBuilder |
|---|---|---|
| **EIG-1** | Enhanced Identity Governance + SSO obrigatório | IAM + SSO |
| **EIG-2** | Just-in-Time (JIT) elevation p/ admin | Break-glass para operações |
| **EIG-3** | Continuous verification (não só login) | Re-verify a cada request |
| **MSG-1** | Micro-segmentação por workload | Isolar provision-engine por tenant |
| **SDP-1** | Software-Defined Perimeter | API Gateway com validação |

---

## 7. HashiCorp Vault Integration Patterns

| Padrão | Descrição | Uso no CloudBuilder |
|---|---|---|
| **Dynamic Secrets** | Credenciais on-demand com lease (ex: DB password 1h) | Provision Engine DB |
| **Vault Agent Injector** | Sidecar injection em pods K8s | Agentes de monitoração |
| **Secrets Operator** | CSI driver monta secrets como volumes K8s | Secrets estáticos |
| **Encryption-as-a-Service** (/transit) | Criptografar sem expor keys | Encrypt de planos TF |
| **Multi-tenant namespaces** | Namespaces Vault com policies isoladas | Isolamento multi-tenant |
| **Auth Methods** | K8s auth (JWT), OIDC, LDAP, AppRole | Service-to-service auth |
| **Control Groups** | Approvals M-of-N p/ operações sensíveis | Break-glass approvals |
| **PKI Secrets Engine** | Certificados TLS short-lived p/ mTLS | gRPC seguro |

---

## 8. OAuth2 Best Practices (RFC 9700 — Janeiro 2025)

O RFC 9700 (Best Current Practice for OAuth 2.0 Security) atualiza o RFC 6819.

### 8.1 Práticas Obrigatórias (do BCP)

| # | Prática | Status CloudBuilder |
|---|---|---|
| 1 | **PKCE obrigatório** — Auth Code sem PKCE é inseguro | ❌ |
| 2 | **redirect_uri validation** — Matching exato, sem wildcards | ❌ |
| 3 | **Sender Constraint** — Tokens vinculados ao client (cnf claim) | ❌ |
| 4 | **Short-lived tokens** — Access tokens <= 15 min | ✅ |
| 5 | **Refresh rotation** — Refresh token de uso único | ✅ |
| 6 | **Proibir ROPG** — Resource Owner Password Grant deprecated | ✅ |
| 7 | **Proibir Implicit Grant** — Implicit deprecated | ✅ |
| 8 | **scope validation** — Validar scopes em toda request | ❌ |
| 9 | **alg=none rejeitado** — JWTs sem assinatura | ❌ |
| 10 | **key rotation** — Chaves rotacionadas periodicamente | ❌ |

### 8.2 Recomendações Específicas para CloudBuilder

1. **Migrar de HMAC-SHA256 para RSA256 ou ECDSA** — HMAC usa segredo compartilhado.
   RSA/ECDSA permite verificação sem capacidade de assinatura.
2. **Implementar JWKS endpoint** — Rotação de chaves sem downtime (já parcial na merge 6B-9).
3. **Adicionar cnf (confirmation) claim** — Binding do token ao client (mTLS ou DPoP).
4. **Refresh token rotation com family identifier** — Revogar família inteira se comprometido.
5. **JWT ID (jti) com blacklist** — Revogação imediata em caso de vazamento.
---

## 9. Recomendações para CloudBuilder IAM Module

### CRÍTICAS (Devem ser implementadas antes do MVP)

| # | Recomendação | Prioridade | Esforço | Impacto |
|---|---|---|---|---|
| R1 | **SSO (SAML + OIDC)** — Okta, Azure AD, Google Workspace | 🔴 P0 | 2-3 sprints | Desbloqueia enterprise sales |
| R2 | **SCIM 2.0** — Provisionamento automático via IdP | 🔴 P0 | 1-2 sprints | Lifecycle management |
| R3 | **API Key Management** — Scopes, expiração, OTR, rotação | 🔴 P0 | 2 sprints | Automação CI/CD |
| R4 | **SOC 2 Type II readiness** — Controles CC1-CC7 | 🔴 P0 | 3-4 sprints | Compliance enterprise |
| R5 | **JWT Key Rotation** — RSA256/ECDSA + JWKS, rotação 90d | 🔴 P0 | 1 sprint | Security hardening |

### ALTAS (Próximo ciclo)

| # | Recomendação | Prioridade | Esforço | Impacto |
|---|---|---|---|---|
| R6 | **Refresh token rotation com family ID** | 🟡 P1 | 1 sprint | Auth security |
| R7 | **Session management** — Timeout, revogação remota, device tracking | 🟡 P1 | 1 sprint | Zero Trust |
| R8 | **Brute-force protection** — Lockout, rate limiting, delays | 🟡 P1 | 1 sprint | Auth hardening |
| R9 | **Audit logging expansivo** — 50+ eventos, SIEM export, immutable | 🟡 P1 | 1-2 sprints | Compliance |
| R10 | **Data residency controls** — Regiões US, EU, BR | 🟡 P1 | 2-3 sprints | LGPD/GDPR |

### MÉDIAS (Roadmap Q3-Q4)

| # | Recomendação | Prioridade | Esforço | Impacto |
|---|---|---|---|---|
| R11 | **HashiCorp Vault integration** — Dynamic secrets, PKI, transit | 🟠 P2 | 2-3 sprints | Secret management |
| R12 | **mTLS para gRPC (provision-engine)** — Certificados via Vault PKI | 🟠 P2 | 1 sprint | Service identity |
| R13 | **JIT admin access** — Elevação temporária com approval + expiry | 🟠 P2 | 2 sprints | Zero Trust |
| R14 | **Bug bounty program** — Security.txt, HackerOne, disclosure policy | 🟠 P2 | 1 sprint | Vulnerability mgmt |
| R15 | **Custom roles** — CRUD de roles com permissões granulares | 🟠 P2 | 2 sprints | RBAC flexibility |

---

## 10. Security Roadmap (Proposto)

### Fase 1 — Foundation (Q3 2026, Sprints 11-16)

- R1: SSO (SAML + OIDC) — 2 sprints
- R2: SCIM 2.0 — 1 sprint
- R5: JWT Key Rotation (RSA256 + JWKS) — 1 sprint
- R6: Refresh Token Rotation — 0.5 sprint
- R8: Brute-force protection — 0.5 sprint

### Fase 2 — Enterprise (Q3-Q4 2026, Sprints 17-22)

- R3: API Key Management — 2 sprints
- R4: SOC 2 Type II readiness — 3 sprints
- R7: Session Management — 1 sprint
- R9: Audit Logging expansivo — 1-2 sprints

### Fase 3 — Zero Trust (Q4 2026, Sprints 23-26)

- R10: Data Residency Controls — 2-3 sprints
- R11: HashiCorp Vault Integration — 2-3 sprints
- R12: mTLS for gRPC — 1 sprint
- R13: JIT Admin Access — 2 sprints

### Fase 4 — Maturity (Q1 2027, Sprints 27-30)

- R14: Bug Bounty Program — 1 sprint
- R15: Custom Roles — 2 sprints
- HIPAA Readiness — 2 sprints
- FedRAMP Moderate (opcional) — 4-6 sprints
---

## 11. Lições Aprendidas de Incidentes Reais

### Incidente #1: Datadog Outage 2023 (M)

**Causa**: systemd-networkd update aplicado simultaneamente a 30k+ VMs em 3 clouds, 5 regiões.

**Lição**: A uniformidade da infra (mesmo OS image) eliminou a diversidade que deveria
proteger contra falhas em cascata.

**Ação CloudBuilder**: Rollouts graduais com canary, diverse base images, chaos engineering.

### Incidente #2: New Relic Breach 2023

**Causa**: Social engineering + credenciais roubadas de employee -> acesso a staging.

**Lição**: Staging não pode ser tratado como seguro. MFA obrigatório, tenant
isolation em todos os ambientes.

**Ação CloudBuilder**: MFA obrigatório, staging com dados sintéticos,
credenciais rotacionadas automaticamente.

### Incidente #3: Dynatrace GitHub Leak 2026

**Causa**: Developer PAT comprometido -> 246 repos expostos.

**Lição**: PATs são um risco enorme. Substituir por OAuth2/OIDC machine-to-machine
com short-lived tokens.

**Ação CloudBuilder**: Proibir PATs long-lived, usar GitHub App ou OIDC para CI/CD,
token expiry <= 1h.

### Incidente #4: Datadog CVE-2025-61667 (LPE)

**Causa**: Permissões insuficientes em diretório do Agent Linux.

**Lição**: Least privilege em instalação de agentes. Verificar permissões
pós-instalação.

**Ação CloudBuilder**: Verificação automática de permissões pós-deploy
do provision-engine.

---

## 12. Referências

1. **Datadog Trust Center**: https://trust.datadoghq.com
2. **Grafana Labs Trust Center**: https://trust.grafana.com
3. **Dynatrace Trust Center**: https://trust.dynatrace.com
4. **New Relic FedRAMP**: https://docs.newrelic.com/docs/security/security-privacy/compliance/fedramp-compliant-endpoints
5. **Miro Security**: https://miro.com/team-collaboration-tools/security
6. **Excalidraw Security**: https://plus.excalidraw.com/security-and-compliance
7. **RFC 9700 — OAuth 2.0 Security BCP**: https://www.rfc-editor.org/rfc/rfc9700
8. **NIST SP 1800-35 — Zero Trust Architecture**: https://csrc.nist.gov/pubs/sp/1800/35/final
9. **HashiCorp Vault K8s Guide**: https://developer.hashicorp.com/vault/docs/platform/k8s
10. **Datadog Outage Postmortem**: https://www.datadoghq.com/blog/2023-03-08-multiregion-infrastructure-connectivity-issue
11. **New Relic Security Incident**: https://www.securityweek.com/new-relic-says-hackers-accessed-internal-environment-using-stolen-credentials
12. **Dynatrace GitHub Leak**: https://cybernews.com/security/dynatrace-github-source-code-leak