# CloudBuilder

> **One-liner:** CloudBuilder helps platform teams design, provision, and operate cloud infrastructure visually — turning architecture diagrams into running infrastructure without stitching together disparate tools.

## Problem

Platform engineers and DevOps teams manage cloud infrastructure through a fragmented toolchain: visual design tools (Miro, Lucidchart) that don't connect to execution, IaC tools (Terraform, Pulumi) that require deep expertise, CLI dashboards for observability, spreadsheets for cost management, and chat-based incident response. The cognitive overhead of orchestrating these disconnected tools results in slow provisioning cycles, configuration drift, cost overruns, and institutional knowledge trapped in individual engineers' heads.

## Why Now

Three structural shifts create the opportunity:

1. **Platform Engineering maturity** — organizations are investing in Internal Developer Platforms (IDPs), creating demand for unified infrastructure tooling.
2. **AI-native infrastructure** — LLMs can now understand infrastructure topology, generate Terraform, detect anomalies, and explain complex cloud configurations in natural language.
3. **Multi-cloud reality** — teams operate across AWS, GCP, Azure, and Kubernetes, requiring abstraction layers that no single cloud provider offers.

## Vision

Become the operating system for cloud infrastructure — the single pane where teams go from architecture intent to running, observed, cost-optimized infrastructure. Not another IaC tool, but the environment that makes IaC accessible, visual, and intelligent.

## Mission

Make cloud infrastructure management visual, automated, and accessible to every engineering team — regardless of their cloud expertise.

## Product

CloudBuilder is a web platform with four core modules:

- **Canvas** — Visual architecture designer using ReactFlow infinite canvas. Drag cloud resources (VPC, Subnet, VM, Database, etc.), connect them with typed edges, configure properties via schemas, and preview the infrastructure topology.
- **Provision** — Translates canvas designs into Terraform/OpenTofu code via a Java code generator, injects cloud credentials, and executes through a Go provision engine. Supports GCP, AWS, Azure, and Kubernetes.
- **Observe** — Built-in observability dashboard with metrics, logs, traces, SLO definitions, alerts, and incident tracking. Designed to aggregate data from provisioned infrastructure.
- **AIOps** — AI-powered operations: anomaly detection on metrics, log pattern analysis, natural language querying of infrastructure state, and automated recommendations.

Additional modules: FinOps (cost estimation and budgeting), Policy Engine (OPA/Rego), Approval Gates, Ephemeral Environments, Multi-Region Deployment, GitHub Integration, and Audit Logging.

## Target Users

| Segment | Role | Pain |
|---------|------|------|
| **Primary** | Platform Engineers at 10–200 person engineering orgs | Need to provide self-service infrastructure to developers without becoming a bottleneck |
| **Secondary** | DevOps/SRE at startups | Solo or small team managing multiple cloud environments with limited time |
| **Tertiary** | CTOs/Engineering Leads at SMBs | Need visibility into infrastructure cost, security posture, and deployment status |

## Ideal Customer Profile (ICP)

Engineering teams of 5–50 developers at B2B SaaS companies (Series A–C) running cloud-native workloads on one or more cloud providers, with at least one platform engineer or senior DevOps responsible for infrastructure. They've outgrown manual Console/CLI workflows but aren't large enough to build a full Internal Developer Platform.

## Jobs To Be Done

1. **When** I'm designing a new service architecture, **I want to** visualize the infrastructure components and their relationships, **so that** I can communicate the design to my team and catch gaps before coding.
2. **When** my design is approved, **I want to** generate production-ready Terraform code automatically, **so that** I don't spend hours translating diagrams into HCL.
3. **When** I provision infrastructure, **I want to** see the execution progress and verify the result, **so that** I can be confident the deployed state matches my intent.
4. **When** something goes wrong in production, **I want to** understand what changed and why, **so that** I can diagnose and resolve incidents quickly.
5. **When** I review cloud spend, **I want to** see cost attribution per resource and per environment, **so that** I can optimize without guessing.

## Current Capabilities

### Production Ready
- Visual canvas with ReactFlow (infinite background, snap grid, zoom, minimap)
- Node/edge creation with provider-specific rendering (AWS, GCP, Azure, K8s)
- Property editing via schema-driven forms per resource type
- Terraform code generation from canvas designs (main.tf, variables.tf, outputs.tf, providers.tf, versions.tf)
- Multi-provider support: GCP (VPC, Subnet, VM, SQL), AWS (VPC, Subnet, EC2, RDS, ALB, etc.), Azure (VNet, Subnet, VM, MSSQL), Kubernetes
- Connection validation with provider-aware rules
- Auto-save (localStorage + backend debounced)
- Backend persistence via Spring Boot REST API
- JWT authentication with role-based access control
- Multi-tenant architecture with tenant isolation
- Credential management (GCP service accounts, AWS access keys, Azure service principals)
- Go provision engine with terraform init/plan/apply/destroy
- Canvas undo/redo with history stack
- Copy/paste, duplicate, auto-layout (Dagre)
- Canvas export/import (JSON, Terraform HCL, state files)
- Cost estimation per resource type
- Version history for canvas designs
- Keyboard shortcuts and command palette

### Functional
- Provision preview (generates code without executing)
- Provision apply (generates code + injects credentials)
- Drift detection between desired and actual state
- OPA policy engine for compliance checks
- Approval gates for deployment workflows
- Ephemeral environment management
- Multi-region deployment tracking
- GitHub repository integration
- Observability dashboard (metrics, logs, traces, SLOs, alerts, incidents)
- AIOps anomaly detection
- AIOps natural language query
- Activity feed and audit logging
- Collaboration (real-time cursors, comments)
- Documentation generation from canvas designs
- Code review dialog

### In Progress / Partial
- Real-time Go engine execution (backend generates payload, Go engine receives and executes)
- Backend Flyway migrations (40 migrations, zero-padded)
- Frontend auto-save to backend (debounced 3s)
- Connection validation (provider-aware rules implemented)
- Provision → Canvas clear after successful deployment

## Product Direction

**Phase 1 (Now):** Complete the Canvas → Terraform → Provision loop with real GCP execution. Prove that a visual design can become running infrastructure end-to-end.

**Phase 2 (Next):** Observability integration — provisioned infrastructure automatically feeds metrics, logs, and cost data back into the platform. Create the feedback loop: design → provision → observe → optimize → redesign.

**Phase 3 (Later):** AI-native operations — the AI agent can recommend architectural changes based on observed behavior, costs, and policies. Natural language becomes a first-class interface for infrastructure operations.

## Architecture

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + TypeScript + ReactFlow v12 + Tailwind CSS + Vite + Zustand | Visual canvas, dashboards, UI |
| Backend | Java 21 + Spring Boot 3.4.4 + Spring Modulith + Maven + H2/PostgreSQL | API, business logic, persistence |
| Provision Engine | Go 1.23 + Cobra + gRPC + Kafka | Terraform execution, drift detection |
| Database | PostgreSQL 16 (prod) + H2 (test) | Persistent storage |
| Policy Engine | OPA (Open Policy Agent) + Rego | Compliance and policy checks |
| Streaming | Apache Kafka 3.7 (KRaft mode) | Event processing (optional) |
| Cache | Caffeine (in-memory) | Performance optimization |
| Auth | JWT (jjwt 0.12.6) + Spring Security + RBAC | Authentication and authorization |
| Infrastructure | Docker Compose (7 services) | Full-stack development and deployment |

## Business Model

**Hypothesis:** Usage-based SaaS with freemium tier. Value metric: number of managed cloud resources per month.

| Tier | Price | Resources | Features |
|------|-------|-----------|----------|
| Free | $0 | 10 resources | Canvas, code generation, single user |
| Starter | $49/mo | 50 resources | Multi-user, credentials, provisioning |
| Pro | $199/mo | 200 resources | AI, policies, drift detection, approvals |
| Enterprise | Custom | Unlimited | SSO, SCIM, audit, SLA, dedicated support |

## Go-To-Market

**Primary motion:** Developer-Led Growth (open-source core + cloud-hosted managed service).

**Beachhead:** Platform engineers at Brazilian B2B SaaS startups (Series A–C) who are building their first Internal Developer Platform.

**Acquisition channels:**
1. Open-source GitHub repository (canvas + provision engine)
2. Technical content (blog, tutorials, architecture guides)
3. Developer community (Discord, LinkedIn, X)
4. Founder-led content (building in public)

## North Star Metric

**Successful provisions per week** — measures the number of times a user successfully goes from visual design to running infrastructure. This captures activation, value delivery, and retention in a single metric.

## Current Priorities

1. **Complete the provision loop** — Canvas → Terraform → GCP execution with real credentials
2. **Fix auto-save and delete persistence** — Canvas state survives page refreshes (in progress)
3. **Prove the wedge** — 10 design partners using CloudBuilder to provision real GCP infrastructure
4. **Observability integration** — Auto-connect provisioned resources to metrics/logs

## Non-Goals (Deliberately)

- **Full CI/CD replacement** — We generate infrastructure, not application deployments
- **Kubernetes distribution** — We manage K8s resources, not clusters
- **Cloud provider** — We orchestrate, we don't host
- **General-purpose chatbot** — AI is infrastructure-specific, not a generic assistant
- **Mobile app** — Desktop-first for infrastructure work
- **Multi-cloud orchestration from day one** — We prove one cloud well before expanding

## Vocabulary

| Term | Definition |
|------|-----------|
| **Canvas** | The visual architecture designer (ReactFlow-based infinite canvas) |
| **Node** | A cloud resource placed on the canvas (e.g., VPC, VM, Database) |
| **Edge** | A connection between two nodes representing a relationship |
| **Component Definition** | Schema describing a cloud resource type (provider, resourceType, properties) |
| **Provision** | The act of translating a canvas design into running cloud infrastructure |
| **Drift** | Difference between desired state (canvas) and actual state (cloud) |
| **Policy** | OPA/Rego rules that validate infrastructure designs before provisioning |
| **Approval Gate** | Human-in-the-loop checkpoint before destructive or expensive actions |
| **Ephemeral Environment** | Temporary infrastructure for testing, auto-destroyed after TTL |
| **Design** | A saved canvas state with versioning (nodes, edges, metadata) |

---

*Last updated: 2026-08-14*
*Source of truth: Codebase + Company OS documentation*
