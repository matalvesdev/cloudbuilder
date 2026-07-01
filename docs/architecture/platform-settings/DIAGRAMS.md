# CloudBuilder — Platform & User Settings Diagrams

**Versão**: 1.0.0
**Última atualização**: 2026-06-29
**ADR**: ADR-032 (Feature Flags) + ADR-035 (EDA)
**Framework**: FAANg (Future Autonomous AI Network for Engineering)

---

## 1. Platform Administration

Diagrama mostrando as configurações de administração da plataforma e seus sub-componentes.

```mermaid
flowchart TB
    subgraph PlatformAdministration["⚙️ Platform Administration"]
        direction TB
        Settings["System Settings"]
        FeatureFlags["Feature Flags"]
        Identity["Identity Providers"]
        CloudProviders["Cloud Providers"]
        Billing["Billing"]
        Notifications["Notifications"]
        Security["Security Policies"]
        Audit["Audit Settings"]
        Observability["Observability"]
        AI["AI Configuration"]
        Integrations["Integrations"]
    end

    Admin["Platform Administrator"]

    Admin --> Settings

    Settings --> FeatureFlags
    Settings --> Identity
    Settings --> CloudProviders
    Settings --> Billing
    Settings --> Notifications
    Settings --> Security
    Settings --> Audit
    Settings --> Observability
    Settings --> AI
    Settings --> Integrations
```

### Platform Administration Components

| Component | Description | Module |
|-----------|-------------|--------|
| **System Settings** | Configurações globais da plataforma | settings |
| **Feature Flags** | Feature flags para rollouts graduais (ADR-032) | settings |
| **Identity Providers** | SSO OAuth2, SAML, LDAP (ADR-025) | iam |
| **Cloud Providers** | AWS, Azure, GCP credentials | credential |
| **Billing** | Planos, faturas, assinaturas | billing |
| **Notifications** | Canais de notificação (email, Slack, webhook) | notification |
| **Security Policies** | Regras de segurança e compliance | security |
| **Audit Settings** | Configurações de auditoria | audit |
| **Observability** | Métricas, traces, logs, alertas | observe |
| **AI Configuration** | Configurações de LLM providers | aiops |
| **Integrations** | GitHub, GitLab, Docker Hub, Slack | integration |

---

## 2. Platform Modules Overview

Diagrama de visão geral dos módulos da plataforma.

```mermaid
flowchart LR
    Platform["CloudBuilder\nPlatform"]

    Platform --> Authentication["Authentication"]
    Platform --> Authorization["Authorization"]
    Platform --> Cloud["Cloud\nProviders"]
    Platform --> Events["Event\nBus"]
    Platform --> Observability["Observability"]
    Platform --> AI["AI\nEngine"]
    Platform --> Billing["Billing"]
    Platform --> Security["Security"]
    Platform --> Notifications["Notifications"]
    Platform --> Marketplace["Marketplace"]
    Platform --> Integrations["Integrations"]
```

### Module Descriptions

| Module | Responsibility | Key Features |
|--------|---------------|--------------|
| **Authentication** | Login, registro, recuperação de senha | JWT, OAuth2, SSO |
| **Authorization** | RBAC, permissões, roles | Owner, Admin, Developer, Viewer |
| **Cloud** | Provedores cloud e credenciais | AWS, Azure, GCP, Vercel, Supabase |
| **Events** | Event-driven architecture | Kafka, Outbox, Inbox, DLQ |
| **Observability** | Métricas, traces, logs | PostgreSQL time-series, SSE |
| **AI** | Assistente IA, RCA, recomendações | OpenAI, Anthropic, Rule-based |
| **Billing** | Faturamento e planos | Stripe integration (futuro) |
| **Security** | Políticas, compliance, MFA | OPA, OWASP, encryption |
| **Notifications** | Alertas e notificações | Email, Slack, Webhooks |
| **Marketplace** | Catálogo de templates | Templates, partners |
| **Integrations** | Provedores externos | GitHub, GitLab, Bitbucket |

---

## 3. User Settings

Diagrama mostrando as configurações pessoais do usuário.

```mermaid
flowchart TB
    User["👤 User"]

    subgraph UserSettings["⚙️ User Settings"]
        direction TB
        Profile["Profile"]
        Preferences["Preferences"]
        Notifications["Notifications"]
        APIKeys["API Keys"]
        Tokens["Tokens"]
        SSHKeys["SSH Keys"]
        MFA["MFA"]
        Sessions["Sessions"]
        PersonalAccessTokens["Personal Access Tokens"]
        Theme["Theme"]
        Language["Language"]
    end

    User --> Profile
    User --> Preferences
    User --> Notifications
    User --> APIKeys
    User --> Tokens
    User --> SSHKeys
    User --> MFA
    User --> Sessions
    User --> PersonalAccessTokens
    User --> Theme
    User --> Language
```

### User Settings Details

| Setting | Description | Storage |
|---------|-------------|---------|
| **Profile** | Nome, email, avatar, bio | User entity |
| **Preferences** | Notificações, dashboard layout | UserPreferences entity |
| **Notifications** | Canais preferidos, frequência | NotificationPreference entity |
| **API Keys** | Chaves de API para automação | ApiKey entity (encrypted) |
| **Tokens** | Tokens de acesso | Token entity |
| **SSH Keys** | Chaves SSH para Git | SshKey entity (encrypted) |
| **MFA** | Autenticação de dois fatores TOTP | MfaSettings entity |
| **Sessions** | Sessões ativas, logout remoto | Session entity |
| **Personal Access Tokens** | PATs para acesso programático | Pat entity |
| **Theme** | Tema visual (light/dark) | UserPreferences |
| **Language** | Idioma da interface (PT-BR/EN) | UserPreferences |

---

## 4. Organization Settings

Diagrama mostrando as configurações de organização.

```mermaid
flowchart TB
    Organization["🏢 Organization"]

    Organization --> General["General"]
    Organization --> Members["Members"]
    Organization --> Teams["Teams"]
    Organization --> Roles["Roles"]
    Organization --> Permissions["Permissions"]
    Organization --> Projects["Projects"]
    Organization --> Environments["Environments"]
    Organization --> CloudAccounts["Cloud Accounts"]
    Organization --> Billing["Billing"]
    Organization --> Audit["Audit"]
    Organization --> Policies["Policies"]
```

### Organization Settings Details

| Setting | Description | RBAC Required |
|---------|-------------|---------------|
| **General** | Nome, slug, logo, configurações | Admin |
| **Members** | Convite, remoção, alteração de role | Admin |
| **Teams** | Squads, departamentos | Admin |
| **Roles** | Papéis customizados | Owner |
| **Permissions** | Permissões por role | Owner |
| **Projects** | Projetos da organização | Admin |
| **Environments** | Ambientes (dev, staging, prod) | Admin |
| **Cloud Accounts** | Credenciais cloud compartilhadas | Admin |
| **Billing** | Planos, faturas, uso | Owner |
| **Audit** | Logs de auditoria | Admin |
| **Policies** | Políticas de segurança | Owner |

---

## 5. Organization Teams

Diagrama mostrando a estrutura de times da organização.

```mermaid
flowchart LR
    Organization["🏢 Organization"]

    Organization --> Team["Team"]

    Team --> Developers["Developers"]
    Team --> DevOps["DevOps"]
    Team --> Architects["Architects"]
    Team --> QA["QA"]
    Team --> Viewers["Viewers"]

    Developers --> Projects["Projects"]
    DevOps --> Environments["Environments"]
    Architects --> Canvas["Canvas"]
    QA --> Deployments["Deployments"]
    Viewers --> Dashboards["Dashboards"]
```

### Team Responsibilities

| Team | Access | Primary Focus |
|------|--------|---------------|
| **Developers** | Projects, Canvas | Design e desenvolvimento |
| **DevOps** | Environments, Deployments | Provisionamento e deploy |
| **Architects** | Canvas, Code Generation | Arquitetura e design |
| **QA** | Deployments, Tests | Qualidade e testes |
| **Viewers** | Dashboards, Reports | Visualização e relatórios |

---

## 6. RBAC Roles

Diagrama mostrando os papéis de acesso (Role-Based Access Control).

```mermaid
flowchart TB
    RBAC["🔐 RBAC"]

    RBAC --> Owner["Owner"]
    RBAC --> Admin["Admin"]
    RBAC --> PlatformAdmin["Platform Admin"]
    RBAC --> BillingAdmin["Billing Admin"]
    RBAC --> SecurityAdmin["Security Admin"]
    RBAC --> Developer["Developer"]
    RBAC --> DevOps["DevOps"]
    RBAC --> QA["QA"]
    RBAC --> Viewer["Viewer"]
```

### RBAC Role Matrix

| Role | Permissions | Scope |
|------|-------------|-------|
| **Owner** | Full access, delete org, manage billing | Organization |
| **Admin** | Manage members, teams, projects, settings | Organization |
| **Platform Admin** | Feature flags, system settings, integrations | Platform |
| **Billing Admin** | Manage plans, invoices, payment methods | Organization |
| **Security Admin** | Security policies, MFA enforcement, audit | Organization |
| **Developer** | Create/edit canvases, generate code, deploy | Projects |
| **DevOps** | Manage environments, deployments, drift | Environments |
| **QA** | View deployments, run tests, approve | Projects |
| **Viewer** | Read-only access to dashboards and reports | Organization |

---

## 7. Cloud Accounts

Diagrama mostrando as contas cloud e métodos de autenticação.

```mermaid
flowchart TB
    CloudAccounts["☁️ Cloud Accounts"]

    CloudAccounts --> AWS["AWS"]
    CloudAccounts --> Azure["Azure"]
    CloudAccounts --> GCP["GCP"]

    AWS --> IAMRole["IAM Role"]
    AWS --> OIDC["OIDC"]
    AWS --> AccessKey["Access Key"]

    Azure --> ServicePrincipal["Service Principal"]

    GCP --> ServiceAccount["Service Account"]

    IAMRole --> SecretsManager["Secrets Manager"]
    OIDC --> SecretsManager
    AccessKey --> SecretsManager
    ServicePrincipal --> SecretsManager
    ServiceAccount --> SecretsManager
```

### Cloud Authentication Methods

| Provider | Method | Security Level | Use Case |
|----------|--------|----------------|----------|
| **AWS** | IAM Role (OIDC) | ⭐⭐⭐⭐⭐ | Production (recommended) |
| **AWS** | OIDC Federation | ⭐⭐⭐⭐ | Cross-account access |
| **AWS** | Access Key | ⭐⭐⭐ | Development/testing |
| **Azure** | Service Principal | ⭐⭐⭐⭐ | All environments |
| **GCP** | Service Account | ⭐⭐⭐⭐ | All environments |

### Secrets Storage

All cloud credentials are encrypted using `SecretEncryptionConverter` (AES-256-GCM) and stored in PostgreSQL. External Secrets Manager integration available for production.

---

## 8. Integrations

Diagrama mostrando as integrações externas disponíveis.

```mermaid
flowchart LR
    Integrations["🔗 Integrations"]

    Integrations --> GitHub["GitHub"]
    Integrations --> GitLab["GitLab"]
    Integrations --> Bitbucket["Bitbucket"]
    Integrations --> DockerHub["Docker Hub"]
    Integrations --> ECR["AWS ECR"]
    Integrations --> GCR["Google GCR"]
    Integrations --> ACR["Azure ACR"]
    Integrations --> Slack["Slack"]
    Integrations --> MicrosoftTeams["Microsoft Teams"]
    Integrations --> Discord["Discord"]
    Integrations --> Jira["Jira"]
    Integrations --> AzureDevOps["Azure DevOps"]
```

### Integration Categories

| Category | Integrations | Purpose |
|----------|-------------|---------|
| **Source Control** | GitHub, GitLab, Bitbucket | Git repositories, webhooks |
| **Container Registry** | Docker Hub, ECR, GCR, ACR | Container images |
| **Communication** | Slack, MS Teams, Discord | Notifications, alerts |
| **Project Management** | Jira, Azure DevOps | Issue tracking, pipelines |

---

## 9. User Journey Flow

Diagrama de sequência mostrando o fluxo completo do usuário na plataforma.

```mermaid
flowchart TB
    User["👤 User"]

    User --> Login["Login"]
    Login --> Organization["🏢 Organization"]
    Organization --> Team["👥 Team"]
    Team --> Permissions["🔐 Permissions"]
    Permissions --> Project["📁 Project"]
    Project --> Environment["🌍 Environment"]
    Environment --> CloudAccount["☁️ Cloud Account"]
    CloudAccount --> Secrets["🔑 Secrets"]
    Secrets --> Provisioning["⚙️ Provisioning"]
    Provisioning --> Deployment["🚀 Deployment"]
    Deployment --> Observability["📊 Observability"]
    Observability --> FinOps["💰 FinOps"]
    FinOps --> AIAdvisor["🤖 AI Advisor"]
```

### User Journey Steps

| Step | Action | Output |
|------|--------|--------|
| 1. **Login** | Autenticação (email/password, SSO) | JWT token |
| 2. **Organization** | Selecionar/criar organização | Tenant context |
| 3. **Team** | Selecionar time | Team permissions |
| 4. **Permissions** | Verificar RBAC | Allowed actions |
| 5. **Project** | Selecionar/criar projeto | Project context |
| 6. **Environment** | Selecionar ambiente | Environment config |
| 7. **Cloud Account** | Conectar conta cloud | Credentials |
| 8. **Secrets** | Gerenciar segredos | Encrypted secrets |
| 9. **Provisioning** | Provisionar infraestrutura | IaC code |
| 10. **Deployment** | Deploy da aplicação | Running infra |
| 11. **Observability** | Monitorar | Metrics, logs, traces |
| 12. **FinOps** | Otimizar custos | Cost analysis |
| 13. **AI Advisor** | Obter insights | Recommendations |

---

## 10. Platform Foundation Overview

Diagrama de visão geral da fundação da plataforma com hierarquia de configurações.

```mermaid
flowchart TB
    subgraph PlatformFoundation["🏗️ Platform Foundation"]
        direction TB
        subgraph Identity["Identity"]
            Authentication["Authentication"]
            Authorization["Authorization"]
            MFA["MFA"]
            Sessions["Sessions"]
            APITokens["API Tokens"]
        end

        subgraph UserModule["User"]
            Profile["Profile"]
            Preferences["Preferences"]
            Notifications["Notifications"]
            SSHKeys["SSH Keys"]
            APIKeys["API Keys"]
        end

        subgraph OrganizationModule["Organization"]
            Tenant["Tenant"]
            Members["Members"]
            Teams["Teams"]
            Roles["Roles"]
            Policies["Policies"]
            OrgBilling["Billing"]
        end

        subgraph PlatformSettings["Platform Settings"]
            FeatureFlags["Feature Flags"]
            AIConfig["AI"]
            SecurityConfig["Security"]
            CloudProviders["Cloud Providers"]
            IntegrationsConfig["Integrations"]
            NotificationsConfig["Notifications"]
            AuditConfig["Audit"]
            ObservabilityConfig["Observability"]
        end

        subgraph CloudAccountsModule["Cloud Accounts"]
            AWS["AWS"]
            Azure["Azure"]
            GCP["GCP"]
            Credentials["Credentials"]
            Secrets["Secrets"]
        end
    end
```

### Platform Foundation Layers

| Layer | Components | Description |
|-------|-----------|-------------|
| **Identity** | Authentication, Authorization, MFA, Sessions, API Tokens | Controle de acesso e identidade |
| **User** | Profile, Preferences, Notifications, SSH Keys, API Keys | Configurações pessoais do usuário |
| **Organization** | Tenant, Members, Teams, Roles, Policies, Billing | Gestão organizacional |
| **Platform Settings** | Feature Flags, AI, Security, Cloud, Integrations, Notifications, Audit, Observability | Configurações globais da plataforma |
| **Cloud Accounts** | AWS, Azure, GCP, Credentials, Secrets | Contas e credenciais cloud |

---

## Appendix A: Settings Hierarchy

```
Platform (Global)
├── Identity (SSO, MFA, Sessions)
├── User (Profile, Preferences, Keys)
├── Organization (Tenant, Members, Teams)
│   ├── Teams (Developers, DevOps, Architects, QA, Viewers)
│   ├── Projects (Canvases, Code, Deployments)
│   ├── Environments (Dev, Staging, Prod)
│   └── Cloud Accounts (AWS, Azure, GCP)
├── Platform Settings (Feature Flags, AI, Security, Integrations)
└── Cloud Accounts (Credentials, Secrets)
```

## Appendix B: RBAC Permission Matrix

| Action | Owner | Admin | PlatformAdmin | Developer | DevOps | QA | Viewer |
|--------|-------|-------|---------------|-----------|--------|----|----|
| Manage Org | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Members | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Teams | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Feature Flags | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Security Policies | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Canvas | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Generate Code | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Deploy | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Manage Billing | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## References

- [ADR-032: Feature Flags](../adr-032-feature-flags-public-beta.md)
- [ADR-035: Production Event-Driven Architecture](../adr-035-production-event-driven-architecture.md)
- [ADR-025: SSO Authentication Flow](../adr-025-sso-authentication-flow.md)
- [ADR-028: Security Hardening & Secrets](../adr-028-security-hardening-secrets-management.md)
- [EDA Diagrams](../eda/DIAGRAMS.md)
- [Architecture README](../README.md)
