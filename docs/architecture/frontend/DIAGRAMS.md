# CloudBuilder — Frontend Architecture Diagrams

Documentação completa da arquitetura frontend com diagramas Mermaid, jornada do usuário e estrutura de diretórios.

---

## 1. CloudBuilder Frontend — High-Level Architecture

```mermaid
flowchart TB
    User(["👤 User"])

    subgraph CloudBuilderFrontend["CloudBuilder Frontend"]
        direction TB
        Authentication["Authentication"]
        Onboarding["Onboarding"]
        Dashboard["Dashboard"]
        Workspace["Workspace"]
        Projects["Projects"]
        Canvas["Canvas"]
        AI["AI"]
        Environments["Environments"]
        Deployments["Deployments"]
        GitOps["GitOps"]
        Observability["Observability"]
        FinOps["FinOps"]
        Security["Security"]
        Notifications["Notifications"]
        Settings["Settings"]
        Administration["Administration"]
    end

    User --> Authentication
    Authentication --> Dashboard
    Dashboard --> Workspace
    Workspace --> Projects
    Projects --> Canvas
    Projects --> AI
    Projects --> Environments
    Projects --> Deployments
    Projects --> GitOps
    Projects --> Observability
    Projects --> FinOps
    Projects --> Security
    Projects --> Notifications
    Projects --> Settings
    Settings --> Administration
```

---

## 2. Authentication Flow

```mermaid
flowchart LR
    Auth["/ Authentication"]

    Auth --> Login["Login"]
    Auth --> Register["Register"]
    Auth --> ForgotPassword["ForgotPassword"]
    Auth --> Dashboard["Dashboard"]

    Dashboard --> Workspace["Workspace"]
    Workspace --> Projects["Projects"]
    Projects --> Project["Project"]

    Project --> Canvas["Canvas"]
    Project --> Architecture["Architecture"]
    Project --> Deployments["Deployments"]
    Project --> Environments["Environments"]
    Project --> GitOps["GitOps"]
    Project --> Variables["Variables"]
    Project --> Secrets["Secrets"]
    Project --> Monitoring["Monitoring"]
    Project --> Costs["Costs"]
    Project --> Audit["Audit"]
    Project --> Settings["Settings"]
```

---

## 3. Frontend Module Organization

```mermaid
flowchart TB
    Frontend["Frontend"]

    Frontend --> Identity["Identity"]
    Frontend --> WorkspaceM["Workspace"]
    Frontend --> ProjectM["Project"]
    Frontend --> Provisioning["Provisioning"]
    Frontend --> Deployment["Deployment"]
    Frontend --> Operations["Operations"]
    Frontend --> Administration["Administration"]

    Identity --> Login["Login"]
    Identity --> Register["Register"]
    Identity --> MFA["MFA"]

    WorkspaceM --> Organizations["Organizations"]
    WorkspaceM --> Teams["Teams"]
    WorkspaceM --> Members["Members"]

    ProjectM --> Canvas["Canvas"]
    ProjectM --> AI["AI"]
    ProjectM --> Environments["Environments"]
    ProjectM --> Variables["Variables"]
    ProjectM --> Secrets["Secrets"]

    Provisioning --> Terraform["Terraform"]
    Provisioning --> Cloud["Cloud"]

    Deployment --> GitOps["GitOps"]
    Deployment --> Pipelines["Pipelines"]
    Deployment --> Releases["Releases"]

    Operations --> Metrics["Metrics"]
    Operations --> Logs["Logs"]
    Operations --> Traces["Traces"]
    Operations --> Alerts["Alerts"]

    Administration --> Billing["Billing"]
    Administration --> Security["Security"]
    Administration --> Integrations["Integrations"]
```

---

## 4. Dashboard

```mermaid
flowchart TB
    Dashboard["Dashboard"]

    Dashboard --> RecentProjects["RecentProjects"]
    Dashboard --> ActiveDeployments["ActiveDeployments"]
    Dashboard --> RunningProvisionings["RunningProvisionings"]
    Dashboard --> InfrastructureHealth["InfrastructureHealth"]
    Dashboard --> Costs["Costs"]
    Dashboard --> AIRecommendations["AIRecommendations"]
    Dashboard --> Notifications["Notifications"]
    Dashboard --> Audit["Audit"]
```

---

## 5. Workspace

```mermaid
flowchart LR
    Workspace["Workspace"]

    Workspace --> Teams["Teams"]
    Workspace --> Members["Members"]
    Workspace --> Projects["Projects"]
    Workspace --> Templates["Templates"]
    Workspace --> Activity["Activity"]
    Workspace --> Settings["Settings"]
```

---

## 6. Project

```mermaid
flowchart TB
    Project["Project"]

    Project --> Overview["Overview"]
    Project --> Architecture["Architecture"]
    Project --> Canvas["Canvas"]
    Project --> AIArchitect["AI Architect"]
    Project --> Terraform["Terraform"]
    Project --> CloudResources["Cloud Resources"]
    Project --> Deployments["Deployments"]
    Project --> GitOps["GitOps"]
    Project --> Monitoring["Monitoring"]
    Project --> Costs["Costs"]
    Project --> Security["Security"]
    Project --> Audit["Audit"]
    Project --> Settings["Settings"]
```

---

## 7. Canvas

```mermaid
flowchart LR
    Canvas["Canvas"]

    Canvas --> ComponentPalette["ComponentPalette"]
    Canvas --> DiagramEditor["DiagramEditor"]
    Canvas --> AIArchitect["AIArchitect"]
    Canvas --> Validation["Validation"]
    Canvas --> TerraformGenerator["TerraformGenerator"]
    Canvas --> Deploy["Deploy"]
```

---

## 8. Deployments

```mermaid
flowchart TB
    Deployments["Deployments"]

    Deployments --> Pipelines["Pipelines"]
    Deployments --> Releases["Releases"]
    Deployments --> History["History"]
    Deployments --> Rollback["Rollback"]
    Deployments --> Events["Events"]
```

---

## 9. Observability

```mermaid
flowchart TB
    Observability["Observability"]

    Observability --> Metrics["Metrics"]
    Observability --> Logs["Logs"]
    Observability --> Traces["Traces"]
    Observability --> Dashboards["Dashboards"]
    Observability --> Alerts["Alerts"]
    Observability --> SLO["SLO"]
    Observability --> Health["Health"]
```

---

## 10. FinOps

```mermaid
flowchart LR
    FinOps["FinOps"]

    FinOps --> CurrentCost["CurrentCost"]
    FinOps --> Forecast["Forecast"]
    FinOps --> Recommendations["Recommendations"]
    FinOps --> Budgets["Budgets"]
    FinOps --> Reports["Reports"]
```

---

## 11. Security

```mermaid
flowchart TB
    Security["Security"]

    Security --> IAM["IAM"]
    Security --> Policies["Policies"]
    Security --> Secrets["Secrets"]
    Security --> Vulnerabilities["Vulnerabilities"]
    Security --> Compliance["Compliance"]
```

---

## 12. Settings

```mermaid
flowchart TB
    Settings["Settings"]

    Settings --> Profile["Profile"]
    Settings --> Organization["Organization"]
    Settings --> Teams["Teams"]
    Settings --> CloudAccounts["Cloud Accounts"]
    Settings --> APITokens["API Tokens"]
    Settings --> SSHKeys["SSH Keys"]
    Settings --> Integrations["Integrations"]
    Settings --> Billing["Billing"]
    Settings --> Audit["Audit"]
    Settings --> FeatureFlags["Feature Flags"]
```

---

## 13. Administration

```mermaid
flowchart LR
    Administration["Administration"]

    Administration --> Users["Users"]
    Administration --> Organizations["Organizations"]
    Administration --> Plans["Plans"]
    Administration --> Billing["Billing"]
    Administration --> FeatureFlags["Feature Flags"]
    Administration --> Monitoring["Monitoring"]
    Administration --> Audit["Audit"]
    Administration --> Support["Support"]
```

---

## 14. User Journey

```mermaid
journey
    title CloudBuilder User Journey
    section Authentication
        Login: 5: User
        MFA: 5: User
    section Workspace
        Choose Workspace: 5: User
        Create Project: 5: User
    section Architecture
        Open Canvas: 5: User
        Generate Architecture: 5: AI
        Validate: 5: AI
        Generate Terraform: 5: AI
    section Provisioning
        Provision: 5: Engine
    section Deployment
        Deploy: 5: Engine
    section Operations
        Observe: 5: User
        Optimize Cost: 5: AI
```

---

## 15. Frontend Directory Structure

```
src/
├── app/
├── shared/
├── core/
├── features/
│   ├── authentication/
│   ├── onboarding/
│   ├── dashboard/
│   ├── workspace/
│   ├── organizations/
│   ├── teams/
│   ├── projects/
│   ├── architecture/
│   ├── canvas/
│   ├── ai/
│   ├── terraform/
│   ├── environments/
│   ├── provisioning/
│   ├── deployments/
│   ├── gitops/
│   ├── observability/
│   ├── finops/
│   ├── security/
│   ├── notifications/
│   ├── billing/
│   ├── audit/
│   ├── settings/
│   └── administration/
├── widgets/
├── design-system/
├── hooks/
├── services/
├── store/
├── router/
└── layouts/
```

### Feature Module Structure

```
features/
└── projects/
    ├── pages/
    ├── components/
    ├── hooks/
    ├── services/
    ├── store/
    ├── schemas/
    ├── routes/
    ├── api/
    ├── tests/
    └── index.ts
```

---

## 16. Feature Module Reference

| Feature | Responsibility | Key Components |
|---------|---------------|----------------|
| **authentication** | Login, Register, ForgotPassword, MFA | LoginPage, RegisterPage, MFASetup, PasswordResetPage |
| **onboarding** | Welcome, Tour, Gateway Setup | WelcomeScreen, TourGuide, GatewaySetupWizard |
| **dashboard** | Overview widgets, quick actions | DashboardLayout, WidgetGrid, QuickActions |
| **workspace** | Organization/Team management | WorkspaceSelector, TeamList, MemberTable |
| **organizations** | Org CRUD, settings | OrgSettingsPage, OrgMembersPage |
| **teams** | Team CRUD, permissions | TeamSettingsPage, TeamRolesPage |
| **projects** | Project CRUD, overview | ProjectListPage, ProjectDetailPage |
| **architecture** | Architecture visualization | ArchitectureView, DependencyGraph |
| **canvas** | Visual design surface | CanvasView, ComponentPalette, PropertiesPanel |
| **ai** | AI Architect, recommendations | AIChatPanel, RecommendationCards |
| **terraform** | Code generation, preview | CodePreviewPanel, TerraformDiff |
| **environments** | Env management, variables | EnvironmentListPage, VariableEditor |
| **provisioning** | Provision flow, status | ProvisionFlowView, ProvisionStatus |
| **deployments** | Deploy pipelines, history | DeploymentListPage, PipelineView |
| **gitops** | Git integration, webhooks | GitOpsConfigPage, WebhookSettings |
| **observability** | Metrics, logs, traces, alerts | MetricsView, LogsView, TraceView, AlertListPage |
| **finops** | Cost management, budgets | CostDashboard, BudgetEditor, ForecastView |
| **security** | IAM, policies, secrets | SecurityDashboard, PolicyListPage, SecretManager |
| **notifications** | Notification center | NotificationCenter, NotificationPreferences |
| **billing** | Plans, invoices | BillingPage, InvoiceListPage |
| **audit** | Audit log, events | AuditLogPage, AuditEventDetailPage |
| **settings** | User/org settings | ProfilePage, OrganizationSettingsPage |
| **administration** | Platform admin | AdminDashboard, UserManagementPage |

---

## 17. Navigation Flow

```mermaid
flowchart TB
    subgraph TopNav["Top Navigation"]
        direction LR
        Logo["CloudBuilder Logo"]
        Search["Search (Cmd+K)"]
        NotificationsBell["Notifications Bell"]
        UserAvatar["User Avatar"]
    end

    subgraph SideNav["Side Navigation"]
        direction TB
        DashboardNav["Dashboard"]
        DesignNav["Design"]
        ProvisionNav["Provision"]
        ObserveNav["Observe"]
        CostNav["Cost"]
        PlatformNav["Platform"]
        AIOpsNav["AIOps"]
        GovernancaNav["Governança"]
    end

    subgraph GovernancaSubNav["Governança Sub-Nav"]
        direction TB
        AuditNav["Auditoria"]
        IAMNav["IAM"]
        DocsNav["Documentação"]
        FlagsNav["Feature Flags"]
        SettingsNav["Configurações"]
    end

    Logo --> SideNav
    Search --> DashboardNav
    SideNav --> GovernancaSubNav
```

---

## 18. State Management Architecture

```mermaid
flowchart TB
    subgraph ZustandStores["Zustand Stores"]
        CanvasStore["canvasStore"]
        UIStore["uiStore"]
        AuthStore["authStore"]
        CostStore["costStore"]
        DeployStore["deployStore"]
        DriftStore["driftStore"]
        IncidentStore["incidentStore"]
        TenantStore["tenantStore"]
        OnboardingStore["onboardingStore"]
        CredentialStore["credentialStore"]
        PolicyStore["policyStore"]
        ApprovalStore["approvalStore"]
        FeatureFlagStore["uiStore (flags)"]
    end

    subgraph API["API Layer"]
        HttpClient["HttpClient"]
        AuthAPI["auth.ts"]
        DesignAPI["design.ts"]
        ProvisionAPI["provision.ts"]
        DashboardAPI["dashboardApi.ts"]
        ImportAPI["import.ts"]
        CostAPI["costStore"]
        PlatformAPI["platformStore"]
    end

    CanvasStore --> HttpClient
    AuthStore --> AuthAPI
    CostStore --> CostAPI
    DeployStore --> ProvisionAPI
    UIStore --> FeatureFlagStore

    HttpClient -->|"JWT Bearer"| Backend["Backend API"]
```

---

## 19. Component Hierarchy

```mermaid
flowchart TB
    App["App.tsx"]

    App --> Router["Router"]
    App --> ToastProvider["ToastProvider"]
    App --> CommandPalette["CommandPalette"]
    App --> OnboardingCheck["OnboardingCheck"]

    Router --> ProtectedRoute["ProtectedRoute"]
    Router --> AuthRoute["AuthRoute"]

    ProtectedRoute --> MainLayout["MainLayout"]
    AuthRoute --> LoginPage["LoginPage"]
    AuthRoute --> RegisterPage["RegisterPage"]

    MainLayout --> TopNav["TopNav"]
    MainLayout --> SideNav["SideNav"]
    MainLayout --> ContentArea["ContentArea"]

    ContentArea --> DesignModule["DesignModule"]
    ContentArea --> ProvisionModule["ProvisionModule"]
    ContentArea --> ObserveModule["ObserveModule"]
    ContentArea --> CostModule["CostModule"]
    ContentArea --> PlatformModule["PlatformModule"]
    ContentArea --> AIOpsModule["AIOpsModule"]
    ContentArea --> AuditModule["AuditModule"]
    ContentArea --> SettingsModule["SettingsModule"]

    DesignModule --> CanvasView["CanvasView"]
    DesignModule --> ComponentPalette["ComponentPalette"]
    DesignModule --> PropertiesPanel["PropertiesPanel"]
```

---

## 20. Auth Flow Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend (React)
    participant S as Zustand Store
    participant API as Backend API

    U->>F: Enter credentials
    F->>API: POST /api/v1/auth/login
    API-->>F: JWT token + user info
    F->>S: authStore.setAuth(token, user)
    S->>S: persist to localStorage
    F->>F: Navigate to /dashboard

    Note over F,API: Authenticated requests
    F->>S: authStore.getToken()
    S-->>F: JWT token
    F->>API: GET /api/v1/canvases (Authorization: Bearer)
    API-->>F: Canvas data
    F->>S: canvasStore.setCanvases(data)
```

---

## 21. Design Module Deep Dive

```mermaid
flowchart TB
    DesignModule["DesignModule"]

    subgraph Toolbar["Toolbar"]
        direction LR
        Save["Save"]
        Validate["Validate"]
        Undo["Undo"]
        Redo["Redo"]
        Import["Import"]
        Export["Export"]
    end

    subgraph Panels["Panels"]
        direction LR
        ComponentPalette["Component Palette\n(240px)"]
        CanvasView["Canvas View\n(flex)"]
        PropertiesPanel["Properties Panel\n(280px)"]
    end

    subgraph CanvasFeatures["Canvas Features"]
        direction TB
        DragDrop["Drag & Drop"]
        KeyboardNav["Keyboard Navigation"]
        ContextMenu["Context Menu"]
        Alignment["Alignment & Distribution"]
        AutoLayout["Auto Layout"]
        ZoomControls["Zoom Controls"]
        MiniMap["Mini Map"]
        SnapGrid["Snap Grid"]
        MultiSelect["Multi-Select"]
    end

    subgraph NodeTypes["Node Types"]
        AWS["aws"]
        Azure["azure"]
        GCP["gcp"]
        K8s["k8s"]
    end

    DesignModule --> Toolbar
    DesignModule --> Panels
    Panels --> CanvasView
    CanvasView --> CanvasFeatures
    CanvasView --> NodeTypes
```

---

## 22. Module Gating (RBAC + Feature Flags)

```mermaid
flowchart TB
    subgraph Gating["Module Gating Logic"]
        direction TB
        AuthCheck["authStore.isAuthenticated?"]
        RoleCheck["authStore.role?"]
        FlagCheck["uiStore.isEnabled('module.X')?"]
    end

    AuthCheck -->|"No"| LoginPage["Redirect to /login"]
    AuthCheck -->|"Yes"| FlagCheck
    FlagCheck -->|"Disabled"| DisabledBanner["Module Disabled"]
    FlagCheck -->|"Enabled"| RoleCheck
    RoleCheck -->|"Insufficient"| AccessDenied["Access Denied"]
    RoleCheck -->|"Authorized"| Module["Module Component"]
```

| Module | Auth Required | Roles | Feature Flag |
|--------|--------------|-------|--------------|
| Design | ✅ | all | — |
| Provision | ✅ | all | — |
| Observe | ✅ | all | — |
| Cost | ✅ | all | module.cost |
| Platform | ✅ | all | module.platform |
| AIOps | ✅ | all | module.aiops |
| Audit | ✅ | admin only | module.audit |
| IAM | ✅ | admin only | module.iam |
| Settings | ✅ | all | — |
| Administration | ✅ | admin only | — |

---

## 23. Responsive Layout

```mermaid
flowchart LR
    subgraph Desktop["Desktop (>1280px)"]
        direction LR
        SideNavD["SideNav\n(expanded)"]
        ContentD["Content"]
        PropertiesD["Properties Panel"]
    end

    subgraph Tablet["Tablet (768-1280px)"]
        direction LR
        SideNavT["SideNav\n(icon only)"]
        ContentT["Content"]
    end

    subgraph Mobile["Mobile (<768px)"]
        direction TB
        TopBarM["TopBar"]
        ContentM["Content\n(full width)"]
        BottomNavM["Bottom Nav"]
    end
```
