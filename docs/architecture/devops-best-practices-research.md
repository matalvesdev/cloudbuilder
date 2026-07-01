# DevOps Best Practices Research — Industry Analysis for CloudBuilder

> **Status**: Research Complete | **Date**: 2026-06-24  
> **Author**: DevOps Agent (FAANg) | **Review**: Principal Architect  
> **Purpose**: Inform CloudBuilder ProvisionModule, deployment pipeline, and drift detection enhancement

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Datadog — CI/CD + Deployment Tracking](#2-datadog)
3. [Grafana/k6 — Performance Testing as CI Gate](#3-grafana--k6)
4. [Dynatrace — SDLC Events + Pipeline Observability](#4-dynatrace)
5. [New Relic — Change Tracking + Deployment Markers](#5-new-relic)
6. [Terraform Cloud — Policy-as-Code + Run Workflows](#6-terraform-cloud)
7. [GitHub Actions / GitLab CI — CI/CD Market Leaders](#7-github-actions--gitlab-ci)
8. [ArgoCD + Argo Rollouts — GitOps + Progressive Delivery](#8-argocd--argo-rollouts)
9. [Jenkins X — Kubernetes-Native CI/CD](#9-jenkins-x)
10. [Harness — Approval Gates + Feature Flags](#10-harness)
11. [Cross-Platform Pattern Synthesis](#11-cross-platform-pattern-synthesis)
12. [Implementation Recommendations for CloudBuilder](#12-implementation-recommendations-for-cloudbuilder)
13. [Architecture Decision Records Required](#13-architecture-decision-records-required)

---

## 1. Executive Summary

This document analyzes DevOps and CI/CD best practices from **10 industry platforms** — Datadog, Grafana/k6, Dynatrace, New Relic, Terraform Cloud, GitHub Actions, GitLab CI, ArgoCD, Jenkins X, and Harness — to derive concrete implementation recommendations for CloudBuilder.

### Key Industry Patterns (2026)

| Pattern | Adoption | Maturity |
|---------|----------|----------|
| CI/CD Pipeline Visibility (DORA metrics) | ⭐⭐⭐⭐⭐ | Mature |
| Deployment Tracking via version tags | ⭐⭐⭐⭐⭐ | Mature |
| Policy-as-Code (Sentinel, OPA/Rego) | ⭐⭐⭐⭐ | Mature |
| GitOps (pull-based deployment) | ⭐⭐⭐⭐ | Mature |
| Progressive Delivery (canary/blue-green) | ⭐⭐⭐⭐ | Maturing |
| Feature Flags (decouple deploy from release) | ⭐⭐⭐⭐⭐ | Mature |
| Load Testing as CI Gate (k6 thresholds) | ⭐⭐⭐⭐ | Maturing |
| IaC Drift Detection | ⭐⭐⭐ | Growing |
| SDLC Event Observability (OpenTelemetry) | ⭐⭐⭐ | Emerging |
| Approval Gates with automated verification | ⭐⭐⭐⭐ | Mature |

---

## 2. Datadog

### CI Pipeline Visibility

Datadog provides a **pipeline-first view** of CI health with standardized abstraction:

```
CI Provider → Datadog Model
  GitHub Actions: Workflow → Job → Step
  GitLab CI:      Pipeline → Job → Script
  Jenkins:        Pipeline → Stage → Step
  Azure Pipelines: Pipeline → Job → Step
```

**Key capabilities:**
- **Pipeline Performance Monitoring**: Execution time, failure rate, queue time per pipeline/stage/job
- **Test Optimization**: Test Impact Analysis (runs only affected tests), flaky test detection, historical trends
- **Infrastructure Correlation**: Links CI runner metrics (CPU/memory) to pipeline execution data
- **Custom Tags & Measures**: Allows enriching CI data with business context

### Deployment Tracking

Datadog tracks deployments via **version tags** on services:

| Strategy | How It Works | Datadog Visibility |
|----------|-------------|-------------------|
| **Rolling** | Instances updated one-by-one | Detect error increases per version |
| **Blue-Green** | Two clusters, traffic switched | Compare error rates between versions |
| **Canary** | Fraction of traffic to new version | Compare traces, errors, latency per version |

### Continuous Delivery Visibility (Preview)

- **ArgoCD Integration**: Tracks ArgoCD application sync status, health, and deployment events
- **CI/CD provider integrations**: GitHub Actions, GitLab, Jenkins, Buildkite, CircleCI
- **Deployment Explorer**: Timeline view of deployment events across environments

### Test Optimization

| Feature | Description |
|---------|-------------|
| Flaky Test Management | Auto-detection, quarantining, historical trends |
| Test Impact Analysis | Only runs tests affected by code change (CI time -40%) |
| Test Suite Breakdown | Per-test duration, pass/fail, retry counts |
| Distributed Tracing | Integration tests show full distributed traces |

### What CloudBuilder Should Learn

1. **Standardized CI data model**: Pipeline → Stage → Job → Step abstraction across providers
2. **Version-tagged deployment tracking**: Tag every deployment with `version`, `environment`, `commit_sha`
3. **Test Impact Analysis**: Run only affected tests based on code change analysis
4. **Flaky test auto-quarantine**: Auto-detection + notification without blocking CI
5. **CI/CD cost correlation**: Link runner infrastructure cost to pipeline execution

---

## 3. Grafana / k6

### k6 Performance Testing

k6 is an **open-source, developer-friendly load testing tool** (Go engine, JS scripting):

| Feature | Description |
|---------|-------------|
| **Thresholds** | Pass/fail criteria as CI gates: `p(95)<500`, `http_req_failed<0.01` |
| **Scenarios** | Multiple executors (ramping-vus, constant-arrival-rate, per-vu-iterations) |
| **Browser Testing** | Playwright-inspired browser API for frontend performance |
| **Extensions** | xk6 extensions for gRPC, WebSocket, Kafka, custom protocols |
| **CI Integration** | GitHub Actions (`grafana/setup-k6-action`, `grafana/run-k6-action`) |

### Grafana Cloud k6

- **Distributed execution**: Up to 1M VUs from 20+ global load zones
- **Private Load Zones**: Test internal services securely
- **Synthetic Monitoring**: Scheduled k6 scripts for 24/7 production validation
- **Test Data Management**: Correlate load test results with server-side metrics

### CI/CD Integration Pattern

```
Code Push → Build → Unit Tests → Deploy to Staging → k6 Performance Tests → Thresholds Pass? → Deploy to Production
                                                                                              ↓
                                                                                         Alert Team + Block
```

### What CloudBuilder Should Learn

1. **Thresholds as SLOs**: Use k6-style pass/fail thresholds as CI quality gates
2. **Multi-scenario testing**: Smoke → Load → Stress → Soak test hierarchy
3. **Browser + API hybrid testing**: Frontend and backend in same test script
4. **Performance regression detection**: Compare against baseline (previous commit/version)
5. **Synthetic monitoring**: Continuous validation of production endpoints

---

## 4. Dynatrace

### SDLC Event Model

Dynatrace uses **Software Development Lifecycle (SDLC) events** as the foundational signal for pipeline observability:

| Event Type | Example | Use Case |
|------------|---------|----------|
| **Build** | CI pipeline execution | Track build duration, failure rate |
| **Release** | New version created | Artifact promotion tracking |
| **Deployment** | Version deployed to env | Change impact analysis |
| **Test** | Test suite execution | Quality gate validation |
| **Performance Test** | k6/Load test run | SLO verification |

### Pipeline Observability

- **Ingestion**: Webhooks from GitHub, GitLab, Azure DevOps + REST API
- **Processing**: OpenPipeline rules filter, parse, enrich, transform events
- **Analysis**: DQL (Dynatrace Query Language) for dashboards and alerts
- **DORA Metrics**: Lead time, deployment frequency, change failure rate, MTTR

### CI/CD Observability App

- **Unified view**: Cross-provider pipeline monitoring (Azure DevOps, GitHub, GitLab, ArgoCD)
- **Flame graphs**: Hierarchical view of job execution
- **Setup wizard**: Import + configure OpenPipeline rules

### Release Validation with SRG (Site Reliability Guardian)

- **Automated release validation**: After deployment, SRG runs automated checks against SLOs
- **Metric-based promotion**: Only promote if error rate, latency, and saturation are within thresholds
- **Integration with workflows**: Dynatrace Workflows can trigger rollback actions

### What CloudBuilder Should Learn

1. **SDLC event model**: Standardized events for build/release/deploy/test lifecycle
2. **OpenPipeline architecture**: Event ingestion → processing → analysis pipeline
3. **DORA metrics as first-class**: Track deployment frequency, lead time, change failure rate, MTTR
4. **Automated release validation**: Post-deployment SLO verification before promotion
5. **Cross-provider abstraction**: Normalize CI/CD data from different providers

---

## 5. New Relic

### Deployment Markers

New Relic records deployments as **timestamped markers** overlaid on APM charts:

| Integration | Method |
|-------------|--------|
| **GitHub Actions** | `newrelic/deployment-marker-action@v2` |
| **CLI** | `newrelic entity deployment create` |
| **GraphQL API** | NerdGraph mutation `changeTrackingCreateEvent` |
| **REST API v2** | `POST /v2/applications/{id}/deployments.json` |
| **Jenkins/CircleCI** | Plugins for automated marker creation |

### Change Tracking

New Relic Change Tracking captures **any change event**, not just deployments:

- **Deployments**: `BASIC`, `BLUE_GREEN`, `CANARY`, `ROLLING`, `SHADOW`
- **Feature Flags**: Toggle events with flag ID and state
- **Configuration Changes**: Infrastructure and application config updates
- **Custom Events**: Business events, release tagging, incident responses

### Change Analysis Interface

- **Clickable markers**: Vertical lines on performance charts
- **Before/after comparison**: Error rates, latency, throughput per endpoint
- **Deep links**: Direct links to CI/CD tool, commit SHA, changelog
- **Entity search**: Associate deployment with specific service via `entitySearch`

### CI/CD Performance Gates

- **Health checks**: Automated performance verification after deployment
- **SLO-based validation**: Alert if deployment degrades SLO adherence
- **Dashboard annotations**: Visual correlation of changes with metrics

### What CloudBuilder Should Learn

1. **Deployment types**: Track BASIC, BLUE_GREEN, CANARY, ROLLING, SHADOW separately
2. **Change tracking API**: GraphQL-first design for deployment event creation
3. **Entity-version correlation**: Link deployment markers to specific service entities
4. **Before/after comparison**: Automatic endpoint-level performance diff post-deployment
5. **Deep linking**: Integration between pipeline view and observability context

---

## 6. Terraform Cloud

### Run Workflow

Terraform Cloud orchestrates IaC runs through a structured pipeline:

```
Plan → Policy Check → Apply → Post-Apply
  │         │            │         └─ Drift Detection
  │         │            └─ Cost Estimation
  │         └─ Sentinel / OPA policy evaluation
  └─ terraform plan output
```

### Run States

| State | Description |
|-------|-------------|
| **pending** | Initial state before queuing |
| **planning** | `terraform plan` execution |
| **policy_checked** | Policy evaluation complete (Sentinel/OPA) |
| **confirmed** | User approved the plan |
| **applying** | `terraform apply` execution |
| **applied** | Successfully applied |
| **errored** | Run failed at any stage |

### Policy-as-Code: Sentinel vs OPA

| Feature | Sentinel | OPA/Rego |
|---------|----------|----------|
| **Language** | Sentinel (HashiCorp) | Rego (CNCF) |
| **Integration** | Native to TFC/TFE | Native since 2023 (GA) |
| **Enforcement Modes** | Advisory, Soft-Mandatory, Hard-Mandatory | Pass/Fail |
| **Pre-written Policies** | CIS AWS, ISO 27001, FSBP | Community libraries |
| **Testing** | Built-in test framework | OPA test command |
| **Scope** | Terraform plan, state, config | Any JSON input |

### Policy Enforcement Modes

| Mode | Behavior |
|------|----------|
| **Advisory** | Logs warning, does not block run |
| **Soft Mandatory** | Blocks unless overridden by authorized user |
| **Hard Mandatory** | Always blocks on failure |

### Common Policies

1. **Tag enforcement**: Require specific tags (environment, cost-center, owner)
2. **Instance type restrictions**: Deny expensive or unauthorized instance types
3. **Encryption requirements**: Enforce encryption at rest and in transit
4. **Backup configuration**: Require backups for database resources
5. **Region restrictions**: Limit deployment to approved regions
6. **Cost controls**: Budget-based policies to prevent overspend

### Drift Detection

- **Scheduled drift detection**: Runs `terraform plan` on a schedule
- **Comparison**: Desired state (HCL) vs actual state (real infrastructure)
- **Notifications**: Alerts when drift is detected
- **Auto-remediation**: Optionally re-apply configuration to fix drift

### Cost Estimation

- **Plan-level cost estimation**: Shows cost impact before applying
- **Monthly cost tracking**: Historical cost trends per workspace
- **Budget alerts**: Threshold-based cost notifications

### What CloudBuilder Should Learn

1. **Structured run workflow**: Plan → Policy → Approve → Apply → Verify lifecycle
2. **Dual policy engine**: Support both Sentinel (native) and OPA/Rego (open standard)
3. **Enforcement modes**: Advisory → Soft Mandatory → Hard Mandatory graduated enforcement
4. **Pre-written policy libraries**: CIS, ISO 27001, FSBP compliance packs
5. **Drift detection schedule**: Automated periodic `terraform plan` for drift detection
6. **Cost estimation**: Plan-level cost impact analysis before apply
7. **Run states as state machine**: Formalize the Terraform run state machine in CloudBuilder

---

## 7. GitHub Actions / GitLab CI

### GitHub Actions Architecture (2026)

```
5-Layer CI/CD Stack:
1. Trigger & Workflow: GitHub Actions YAML
2. Execution: GitHub-hosted runners / ARC / self-hosted
3. Build System: Bazel, Nx, Turborepo, Earthly
4. Cache: Remote cache (Bazel, Turborepo), actions/cache
5. Delivery: Argo CD, Harness, Vercel, Cloud Run
```

### Key Features

| Feature | Description |
|---------|-------------|
| **Reusable Workflows** | `workflow_call` trigger → org-level standard pipelines |
| **Composite Actions** | Bundle multiple steps into reusable action |
| **OIDC Federation** | No cloud secrets — AWS IAM/GCP WIF/Azure federated |
| **Matrix Builds** | Cross-platform (Linux/macOS/Windows) parallel testing |
| **Environments** | Deployment environments with approval gates and secrets |
| **Large Runners** | Up to 64 vCPU + GPU on Windows/macOS |
| **Artifact Sharing** | `upload-artifact`/`download-artifact` between jobs |

### CI/CD Pipeline Best Practices (2026)

**CI Pipeline:**
```
Lint → Type Check → Test (sharded) → Coverage Merge → Security Scan → Build
```

**CD Pipeline:**
```
Deploy to Staging → Smoke Tests → Approve → Deploy to Production → Health Check
```

### GitLab CI/CD

- **Deployment Tiers**: Auto-detected from environment name (dev/test/staging/production)
- **Environment-scoped variables**: Variables limited to specific environments
- **Review Apps**: Ephemeral per-PR environments via GitLab Review Apps
- **Protected Environments**: Deployments restricted to authorized users/roles

### What CloudBuilder Should Learn

1. **Separation of concerns**: CI (GitHub Actions) ≠ CD (Argo CD) ≠ Build System (Bazel)
2. **OIDC federation**: Zero long-lived secrets for cloud deployment
3. **Reusable workflows**: Organization-wide standard pipelines via `workflow_call`
4. **Matrix sharding**: Partition test execution across parallel runners
5. **Environment-scoped variables**: Different secrets per deployment environment
6. **Concurrency control**: `concurrency` key to cancel redundant in-progress runs
7. **Preview environments**: Ephemeral per-PR environments (like GitLab Review Apps)

---

## 8. ArgoCD + Argo Rollouts

### ArgoCD — GitOps Operator

**Core Principle**: Git repository = single source of truth. ArgoCD continuously syncs cluster state to Git.

| Feature | Description |
|---------|-------------|
| **Auto-sync** | Automatic drift correction |
| **Sync Waves** | Ordered resource deployment (CRDs first, then apps) |
| **Sync Phases** | Pre-sync, Sync, Post-sync, Post-sync-delete hooks |
| **Health Assessment** | Built-in + custom resource health checks |
| **Multi-cluster** | Single ArgoCD manages multiple clusters |
| **RBAC** | Project-scoped access control |
| **SSO** | OIDC/SAML/LDAP integration |

### Argo Rollouts — Progressive Delivery

Argo Rollouts replaces `Deployment` with `Rollout` resource:

```yaml
kind: Rollout
spec:
  strategy:
    canary:
      steps:
      - setWeight: 10   # 10% traffic
      - pause: {duration: 60s}
      - setWeight: 50   # 50% traffic
      - pause: {duration: 120s}
      - setWeight: 100  # 100% traffic
```

### Deployment Strategies

| Strategy | Description | Rollback Speed | Resource Cost |
|----------|-------------|---------------|---------------|
| **Canary** | Gradual traffic shift (0→100%) | Slow (per-step) | Low |
| **Blue-Green** | Two versions side-by-side, instant switch | Instant | High (2x infra) |
| **Analysis-driven** | Auto promote/rollback based on metrics | Automated | Variable |

### AnalysisTemplate

```yaml
kind: AnalysisTemplate
spec:
  metrics:
  - name: error-rate
    interval: 30s
    successCondition: result < 0.01
    provider:
      prometheus:
        query: |
          sum(rate(http_requests_total{status=~"5.*"}[2m])) /
          sum(rate(http_requests_total[2m]))
```

### What CloudBuilder Should Learn

1. **Git as single source of truth**: All deployment config in Git, no manual changes
2. **Rollout resource model**: CRD-based progressive delivery replacing Deployment
3. **Analysis-driven promotion**: Auto rollback based on Prometheus/Datadog/New Relic metrics
4. **Sync waves**: Ordered deployment for dependent resources
5. **Health checks as rollback triggers**: Automated rollback on health check failure
6. **Traffic management integration**: Istio, NGINX, ALB, SMI for canary traffic splitting

---

## 9. Jenkins X

### Kubernetes-Native CI/CD

Jenkins X is built entirely for Kubernetes using Tekton pipelines and GitOps practices:

| Feature | Description |
|---------|-------------|
| **Tekton Pipelines** | Kubernetes-native pipeline execution (CRD-based) |
| **GitOps-driven** | All config in Git — pipelines, environments, promotions |
| **Preview Environments** | Auto-generated ephemeral K8s per PR |
| **Automated Promotion** | Dev → Staging → Production with manual or auto gates |
| **Helm + Kustomize** | Native support for both deployment packaging tools |
| **Secrets Management** | Vault, AWS SM, GCP SM, Azure KV integration |

### Pipeline Promotion

```
Pull Request → Preview Env (ephemeral) → Merge → Dev → Staging (approval gate) → Production
```

### Key Strengths

- **Environment automation**: Jenkins X auto-manages environments and namespace provisioning
- **Quickstart projects**: Predefined language-specific pipeline templates
- **ChatOps**: Slack/GitHub PR integration for triggers and approvals
- **Progressive delivery**: Flagger + Istio for canary/blue-green deployments

### What CloudBuilder Should Learn

1. **Preview environments**: Ephemeral per-PR environments for testing before merge
2. **Automated promotion pipeline**: Dev → Staging → Production with gates
3. **Tekton resource model**: Kubernetes CRD-based Tasks and Pipelines
4. **Quickstart templates**: Pre-built pipeline templates per language/stack
5. **Secrets management integration**: Vault/cloud provider KMS for pipeline secrets

---

## 10. Harness

### Continuous Delivery Platform

Harness provides enterprise-grade deployment orchestration with built-in:

| Feature | Description |
|---------|-------------|
| **Approval Gates** | Manual + automated approval at any pipeline stage |
| **Progressive Delivery** | Canary, blue-green, rolling with automated verification |
| **Feature Flags** | Decouple deployment from release (kill switches, targeting) |
| **Verification** | Auto-rollback based on observed metrics vs baselines |
| **GitOps** | ArgoCD integration for Kubernetes deployments |
| **IaC Management** | Terraform plan/apply orchestration |

### Approval Gates

| Gate Type | Description |
|-----------|-------------|
| **Manual Approval** | Human decision via UI/API/Slack/email |
| **Policy-based** | OPA/Sentinel policy evaluation |
| **SLO-based** | Automated verification against Service Level Objectives |
| **Time-based** | Scheduled release windows |
| **Multi-stakeholder** | Multiple approvers required |

### Deployment Strategies (Harness)

| Strategy | Verification Method | Rollback |
|----------|-------------------|----------|
| **Canary** | Compare error rates/latency between canary and stable | Auto-rollback if thresholds exceeded |
| **Blue-Green** | Verify new version before switching traffic | Switch back to blue |
| **Rolling** | Gradual replacement with health checks | Revert deployment |
| **Feature Flag** | Flag-controlled rollout | Toggle flag off |

### Feature Flags (Harness FF)

- **Targeting**: User segments, percentage rollouts, custom attributes
- **Kill switches**: Instant disable without redeployment
- **A/B testing**: Built-in experimentation framework
- **SDKs**: Java, Go, Python, Node.js, React, iOS, Android
- **Audit trail**: All flag changes logged with user and timestamp

### What CloudBuilder Should Learn

1. **Multiple gate types**: Manual, policy, SLO, time-based, multi-stakeholder approvals
2. **Verification-based rollback**: Auto rollback when observed metrics degrade
3. **Feature flags as deployment tool**: Decouple deployment from release for safer rollouts
4. **Pipeline templates**: Reusable deployment templates with strategy selection
5. **Multi-strategy support**: Canary, blue-green, rolling, and feature flags in single platform

---

## 11. Cross-Platform Pattern Synthesis

### 11.1 CI/CD Pipeline Abstraction

All major platforms converge on a similar pipeline model:

```
Industry Standard CI/CD Pipeline:
┌─────────┐  ┌──────────┐  ┌────────┐  ┌───────────┐  ┌────────┐  ┌──────────┐
│ Commit  │→ │  Build   │→ │  Test  │→ │  Package  │→ │ Deploy │→ │  Verify  │
│ Trigger │  │ (compile)│  │ (unit  │  │ (image,   │  │        │  │ (health, │
│         │  │          │  │  +int) │  │  artifact)│  │        │  │  metics) │
└─────────┘  └──────────┘  └────────┘  └───────────┘  └────────┘  └──────────┘
                                                              │
                                                              └── Rollback on failure
```

### 11.2 Deployment Tracking Data Model

Common data model across observability platforms:

```
DeploymentEvent {
  version: string          // Required — release version/tag
  service: string          // Service or application name
  environment: string      // dev/staging/production
  timestamp: number        // Unix epoch ms
  type: BASIC|CANARY|BLUE_GREEN|ROLLING|SHADOW
  commit_sha: string       // Git commit
  description: string      // Human-readable description
  user: string             // Who triggered deployment
  metadata: map            // Custom key-value pairs
  deepLink: string         // Link to CI/CD pipeline run
  changeLog: string        // Link to changelog
}
```

### 11.3 Policy-as-Code Spectrum

```
Compliance Level:
├── Advisory  ── Warning only, no blocking
├── Soft      ── Blocks unless overridden (with audit trail)
├── Hard      ── Always blocks, no override
└── Automatic ── Policy enforcement + auto-remediation
```

### 11.4 Progressive Delivery Maturity Model

```
Level 0: No automation — manual kubectl apply, all-at-once deployment
Level 1: Rolling updates — Kubernetes native, basic health checks
Level 2: Blue-Green — Two environments, instant switch, easy rollback
Level 3: Canary — Gradual traffic shift, metric-based promotion
Level 4: Analysis-driven — Auto rollback on SLO violation, metric baselines
Level 5: Feature flag driven — Decoupled deploy/release, A/B testing, kill switches
```

### 11.5 GitOps Maturity Model

```
Level 0: Push-based — CI/CD tools push manifests to cluster
Level 1: Git as source of truth — Auto-sync from Git to cluster
Level 2: Declarative drift correction — Auto-remediation of configuration drift
Level 3: Multi-cluster GitOps — Single Git repo managing multiple clusters
Level 4: Progressive delivery GitOps — Argo Rollouts + GitOps for canary/blue-green
Level 5: Policy-as-Code + GitOps — OPA/Sentinel policies enforced via GitOps
```

---

## 12. Implementation Recommendations for CloudBuilder

### 12.1 Provision Module — Run Workflow Engine

**Priority: P0 (Critical)**

Implement a **Terraform Cloud-inspired run workflow state machine** in the Provision Module:

```
Canvas Design → Generate Code → Plan → Policy Check → Approve → Apply → Verify → Sync State
    │               │            │         │           │        │        │          │
    │               │            │         │           │        │        │          └─ Drift Detection
    │               │            │         │           │        │        └─ Post-deploy health check
    │               │            │         │           │        └─ terraform apply
    │               │            │         │           └─ Manual/auto approval gate
    │               │            │         └─ Sentinel/OPA policy evaluation
    │               │            └─ terraform plan + cost estimation
    │               └─ Terraform/OpenTofu HCL generation
    └─ Visual design (ReactFlow)
```

**Implementation in CloudBuilder:**
- Add `RunWorkflow` entity to provision module with states: `PENDING`, `PLANNING`, `PLANNED`, `POLICY_CHECK`, `APPROVED`, `APPLYING`, `APPLIED`, `FAILED`, `ROLLED_BACK`
- Store workflow state in database with full audit trail
- Create `RunWorkflowService` to transition between states
- Add `RunWorkflowController` with REST endpoints

### 12.2 Policy-as-Code Engine

**Priority: P0 (Critical)**

Integrate dual policy engine support:

1. **OPA/Rego integration** (primary — open standard):
   - Evaluate Terraform plan JSON (`terraform show -json`) against Rego policies
   - Pre-built policy library: cost controls, security rules, tagging requirements
   - Policy enforcement modes: Advisory → Soft → Hard

2. **Sentinel integration** (optional — HashiCorp native):
   - Support for existing Sentinel policies
   - Compatible with Terraform Cloud policy sets

**Implementation in CloudBuilder:**
- Add `Policy` entity: `name`, `engine` (OPA/Sentinel), `code` (Rego/Sentinel), `enforcementMode`, `resourceType`
- Add `PolicyEvaluationResult` entity: `policyId`, `runId`, `result` (pass/fail/error), `details`
- Create `PolicyEvaluatorService` that calls OPA CLI or embedded evaluator
- Create `PolicySet` entity to group policies by workspace/environment
- Add policy management API: `POST /api/v1/policies`, `POST /api/v1/policies/evaluate`

### 12.3 Deployment Tracking API

**Priority: P1 (High)**

Implement a New Relic-inspired deployment tracking API:

```typescript
interface DeploymentEvent {
  id: string;
  version: string;
  environmentId: string;
  serviceName: string;
  type: 'BASIC' | 'CANARY' | 'BLUE_GREEN' | 'ROLLING' | 'SHADOW';
  commitSha: string;
  user: string;
  description: string;
  deepLink: string;
  metadata: Record<string, string>;
  timestamp: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED' | 'ROLLED_BACK';
}
```

**Implementation in CloudBuilder:**
- Add `DeploymentEvent` entity to provision module
- Create `DeploymentTrackerController`: `POST /api/v1/deployments`, `GET /api/v1/deployments`
- Integrate with frontend deployment pipeline to emit events at each stage
- Add deployment markers to ObserveModule (Grafana annotation style)
- Store deployment history per environment for impact analysis

### 12.4 Drift Detection Enhancement

**Priority: P1 (High)**

Enhance existing drift detection with:

1. **Scheduled drift scans**: Configurable cron schedule per environment
2. **Plan visualization**: Side-by-side comparison of desired vs actual state
3. **Drift severity levels**: Critical (security), Warning (configuration), Info (metadata)
4. **Auto-remediation**: Optionally re-apply configuration (with approval gate)
5. **Drift history**: Trend analysis of drift frequency and types

**Implementation in CloudBuilder:**
- Extend `DriftReport` entity with: `severity`, `autoRemediation`, `driftType` (RESOURCE_MISSING, CONFIG_CHANGED, TAG_CHANGED)
- Add scheduled drift detection via Spring `@Scheduled` or Quartz
- Create drift visualization API: `GET /api/v1/environments/{id}/drift/history`
- Add drift severity scoring and trending

### 12.5 Progressive Delivery Support

**Priority: P1 (High)**

Add deployment strategy selection to the provision pipeline:

```typescript
type DeploymentStrategy = 'BIG_BANG' | 'ROLLING' | 'BLUE_GREEN' | 'CANARY';

interface ProgressiveDeliveryConfig {
  strategy: DeploymentStrategy;
  canarySteps?: Array<{ weight: number; duration: string }>;
  analysisTemplate?: { metric: string; condition: string };
  autoRollback: boolean;
  verificationPeriod: number; // seconds
}
```

**Implementation in CloudBuilder:**
- Add `strategy` field to deployment configuration
- For canary: support traffic weight progression (10% → 50% → 100%)
- For blue-green: track both `active` and `standby` environments
- Add `ProgressiveDeliveryService` to orchestrate step transitions
- Integrate with ObserveModule for metric-based promotion decisions

### 12.6 CI/CD Integration Layer

**Priority: P2 (Medium)**

Build a CI/CD provider abstraction layer:

```typescript
interface CiCdProvider {
  type: 'GITHUB_ACTIONS' | 'GITLAB_CI' | 'JENKINS' | 'ARGOCD';
  triggerPipeline(params: PipelineTrigger): Promise<PipelineResult>;
  getPipelineStatus(executionId: string): Promise<PipelineStatus>;
  listRecentRuns(limit: number): Promise<PipelineRun[]>;
}
```

**Implementation in CloudBuilder:**
- Abstract CI/CD provider interactions behind interface
- Start with GitHub Actions integration (CloudBuilder's target CI)
- Support pipeline triggering from CloudBuilder UI ("Deploy from design")
- Webhook receiver for pipeline status updates
- Pipeline run visualization in ProvisionModule

### 12.7 Preview/Ephemeral Environments

**Priority: P2 (Medium)**

Implement Jenkins X-style preview environments:

- **Trigger**: On PR creation (via webhook)
- **Provision**: Auto-generate Terraform/OpenTofu from canvas design
- **Deploy**: Deploy to isolated environment with unique URL
- **Cleanup**: Auto-destroy on PR merge/close
- **Cost**: Resource tracking to prevent orphaned environments

**Implementation in CloudBuilder:**
- Extend existing `EphemeralEnvironmentService`
- Add TTL-based environment lifecycle management
- Add cost tracking for ephemeral environments
- Create environment inventory dashboard

### 12.8 DORA Metrics Dashboard

**Priority: P2 (Medium)**

Implement DORA metrics tracking across all deployment events:

| Metric | Calculation | Source |
|--------|------------|--------|
| Deployment Frequency | Number of deployments per day/week | DeploymentEvent |
| Lead Time for Changes | Time from commit to production | Git log + DeploymentEvent |
| Change Failure Rate | Failed deployments / total deployments | DeploymentEvent status |
| MTTR | Time from incident to recovery | Incident + Deployment tracking |

**Implementation in CloudBuilder:**
- Query deployment event store for aggregation
- Add DORA metrics API: `GET /api/v1/dora-metrics?period=30d`
- Frontend DORA dashboard widget in ObserveModule

### 12.9 ADR-031: Deployment Run Workflow

**Required Decision**: The deployment state machine design and transition rules

**Key questions:**
- Should we use a BPMN engine (Camunda) or custom state machine?
- State transition permission model (who can approve? who can override policy?)
- Idempotency guarantees — what if a run is interrupted?
- Integration with existing GitOps workflows (ArgoCD in future)

### 12.10 ADR-032: Policy-as-Code Framework

**Required Decision**: Choice of policy engine and integration architecture

**Key questions:**
- OPA vs Sentinel vs both?
- Embedded OPA (OPA Go library) or sidecar/API?
- Policy store: Git-based or database-backed?
- Policy testing framework for CloudBuilder?

---

## 13. Architecture Decision Records Required

| ADR | Title | Priority | Area |
|-----|-------|----------|------|
| ADR-031 | Deployment Run Workflow State Machine | P0 | Provision |
| ADR-032 | Policy-as-Code Engine Selection (OPA/Sentinel) | P0 | Provision |
| ADR-033 | Deployment Tracking Data Model | P1 | Observe |
| ADR-034 | Drift Detection Enhancement Architecture | P1 | Provision |
| ADR-035 | CI/CD Provider Abstraction Layer | P2 | DevOps |
| ADR-036 | Ephemeral Environment Lifecycle Management | P2 | Provision |
| ADR-037 | DORA Metrics Data Model and Aggregation | P2 | Observe |

---

## Appendix: Vendor Comparison Matrix

| Capability | Datadog | Grafana/k6 | Dynatrace | New Relic | TFC | ArgoCD | Harness |
|-----------|---------|------------|-----------|-----------|-----|--------|---------|
| CI Pipeline Visibility | ✅ | ❌ | ✅ (community) | ⚠️ (integrations) | ❌ | ❌ | ✅ |
| Deployment Tracking | ✅ | ⚠️ (annotations) | ✅ (SDLC events) | ✅ | ⚠️ (runs) | ✅ (sync) | ✅ |
| Test Optimization | ✅ | ✅ (k6) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Policy-as-Code | ⚠️ (monitors) | ❌ | ⚠️ (SRG) | ❌ | ✅ (Sentinel/OPA) | ⚠️ | ✅ (OPA) |
| Progressive Delivery | ✅ (tracking) | ❌ | ✅ (SRG) | ⚠️ (markers) | ❌ | ✅ (Rollouts) | ✅ |
| IaC Drift Detection | ⚠️ (resources) | ❌ | ❌ | ❌ | ✅ | ✅ (sync) | ❌ |
| Cost Estimation | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ⚠️ |
| Feature Flags | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Approval Gates | ❌ | ❌ | ✅ (workflows) | ❌ | ✅ (runs) | ⚠️ (waves) | ✅ |
| DORA Metrics | ⚠️ (custom) | ❌ | ✅ | ⚠️ (custom) | ❌ | ❌ | ✅ |

**Legend**: ✅ = Native/First-class | ⚠️ = Partial/Integration | ❌ = Not Available

---

## References

1. Datadog CI Pipeline Visibility — https://docs.datadoghq.com/continuous_integration/pipelines/
2. Datadog Deployment Tracking — https://docs.datadoghq.com/tracing/services/deployment_tracking/
3. Datadog Test Optimization — https://docs.datadoghq.com/tests/
4. Grafana k6 Documentation — https://grafana.com/docs/k6/latest/
5. Dynatrace SDLC Events — https://docs.dynatrace.com/docs/deliver/pipeline-observability-sdlc-events
6. New Relic Change Tracking — https://docs.newrelic.com/docs/change-tracking/
7. Terraform Cloud Policy Enforcement — https://developer.hashicorp.com/terraform/cloud-docs/workspaces/policy-enforcement
8. HashiCorp OPA Support — https://www.hashicorp.com/blog/native-opa-support-in-terraform-cloud-is-now-generally-available
9. Harness CD Platform — https://www.harness.io/products/continuous-delivery
10. Argo Rollouts Documentation — https://argo-rollouts.readthedocs.io/
11. Jenkins X Architecture — https://jenkins-x.io/docs/
12. GitHub Actions Documentation — https://docs.github.com/en/actions
13. GitLab CI/CD Environments — https://docs.gitlab.com/ee/ci/environments/
14. OpenGitOps Principles — https://opengitops.dev/
