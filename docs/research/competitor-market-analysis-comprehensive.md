# CloudBuilder -- Comprehensive Competitor Market Analysis

**Research Date**: 2026-06-24
**Conducted by**: Research Governor Agent (FAANg)
**Status**: Complete
**Sources**: Official documentation, engineering blogs, pricing pages, GitHub repos, whitepapers

---

## Table of Contents

1. [Grafana](#1-grafana)
2. [Dynatrace](#2-dynatrace)
3. [New Relic](#3-new-relic)
4. [Datadog](#4-datadog)
5. [Miro](#5-miro)
6. [Excalidraw](#6-excalidraw)
7. [Synthesis: Top 30 Features for CloudBuilder](#7-synthesis-top-30-features-ranked-by-implementation-priority)

---

# 1. Grafana

## 1.1 Core Value Proposition

Grafana is the **open observability standard** -- an open-source data visualization and monitoring platform that unifies metrics, logs, traces, and profiles into customizable dashboards. Core strength: **universal data source connectivity** (170+ plugins) combined with powerful dashboarding. 35M+ users.

## 1.2 Key Features

| Feature | Description | Why It Matters |
|---------|-------------|----------------|
| **Dynamic Dashboards (GA v13)** | Tabs+rows layout, show/hide rules, responsive panels | One dashboard adapts instead of N copies |
| **170+ Data Source Plugins** | Prometheus, Loki, AWS, Azure, GCP, Splunk | Universal connectivity is the moat |
| **Grafana Assistant (AI)** | NL query assistant, dashboard suggestions, SQL help | Lowers barrier to entry |
| **Provisioning-as-Code** | Terraform provider, Git Sync, dashboard-as-JSON | GitOps for observability |
| **Alerting Engine** | Unified alerting with silences, mute timings | Single alert manager |
| **Explore Mode** | Ad-hoc split-pane query interface | Debug without building dashboards |
| **Transformations** | Server-side data manipulation (math, reduce, merge) | Decouple raw from presentation |
| **Grafana Advisor** | Auto health checks, security recommendations | Self-healing infrastructure |
| **Grafana Marketplace** | Plugin marketplace for ISVs (launched GrafanaCON 2026) | Ecosystem monetization |
| **K8s-Inspired Architecture** | Resource APIs, controllers/reconcilers, CUE schemas | Declarative, scalable backend |

## 1.3 Architecture Highlights
- Kubernetes-inspired resource model with spec/status controllers running in-process
- CUE-first schema definition (strong typing, validation, code generation)
- SQL database persistence (PostgreSQL/MySQL/SQLite) for all resources
- Plugin architecture via Go SDK -- each plugin is a self-contained binary
- Grafana Cloud SaaS with multi-region and integrated Loki/Tempo/Mimir

## 1.4 Pricing Model
- **Free**: $0 (10K metrics, 50GB logs, 14-day retention)
- **Cloud Pro**: $19/mo + $6.50/1K series + $0.40/GB logs + $8/user/mo
- **Cloud Advanced**: $25K+/yr commit with volume discounts
- **Enterprise**: ~$50-150/user/yr self-hosted with SAML, RBAC, enterprise plugins

**Key Insight**: Usage-based pricing -- real cost is data volume. Teams pay 2-5x initial estimate due to cardinality growth.

## 1.5 What CloudBuilder Can Learn

1. **Dynamic/Living Dashboards** -- ObserveModule should adapt based on context (env, service, time range)
2. **Plugin Ecosystem** -- Canvas needs a plugin system for provider components -- extensibility over built-in
3. **Provisioning-as-Code** -- Already generates Terraform, but needs Git Sync bidirectional
4. **Explore Mode** -- Add ad-hoc query mode to ObserveModule
5. **Transformations Pipeline** -- Transform layer between design and code generation
6. **AI Assistant** -- AI Chat suggests dashboards, alerts, cost optimizations from canvas context
7. **Unified Alerting** -- Alert across cost, health, deployment from single engine
8. **Usage Insights** -- Track design/template usage data-driven product decisions
9. **K8s-Inspired Controllers** -- Go engine uses reconciler pattern (desired vs actual state)
10. **Bidirectional Git Sync** -- Canvas <-> Git two-way sync
11. **Dynamic Schema** -- Seamless canvas schema versioning (v1 -> v2 migration)
12. **Health Checks (Advisor)** -- Auto-check CloudBuilder installation health + security posture

---

# 2. Dynatrace

## 2.1 Core Value Proposition
Dynatrace is the AI-powered observability platform with the industry's most mature AIOps. Its DAVIS AI engine (3rd gen) features causal AI, predictive operations, and agentic capabilities. Zero-config automatic observability that tells you WHAT is wrong and WHY.

## 2.2 Key Features

| Feature | Description | Why It Matters |
|---------|-------------|----------------|
| **DAVIS AI (3rd Gen)** | Causal AI across metrics, events, logs, topology | Finds true root cause, not symptoms |
| **PurePath Distributed Tracing** | Auto end-to-end traces with code-level context since 2005 | Trillions of spans/day |
| **Multi-Dimensional Baselining** | 10K+ baseline cube cells, auto-adapts daily | 90% fewer alerts, <1 min anomaly detection |
| **Smartscape Topology** | Real-time auto dependency mapping | No manual topology config |
| **OneAgent** | Single agent for metrics, traces, logs, security, RUM | One install covers everything |
| **Grail Data Lakehouse** | Massively parallel processing lakehouse | Petabyte/day ingestion, sub-second queries |
| **Davis CoPilot** | NL interface for analytics, dashboards, workflows | Conversational observability |
| **Preventive Operations** | Predictive AI forecasts anomalies before they occur | Proactive, not reactive |
| **SRE Guardian** | Auto SLO validation, error budget tracking, release gating | Prevents bad deployments to production |
| **OpenPipeline** | Custom metrics from any trace/log attribute | Extensible data model |

## 2.3 Architecture Highlights
- Grail data lakehouse unifying all observability/security/business data
- OneAgent + ActiveGate two-tier agent architecture
- AI at ingestion -- processing in real-time during ingestion, not after storage
- Multi-dimensional baselining: statistical models in 10K+ cells, recalculated daily
- Smartscape auto-constructed dependency graph feeding fault tree analysis
- Causal AI: topological context + temporal correlation + fault tree analysis

## 2.4 Pricing Model
- Foundation & Discovery: $7/host/mo ($0.01/hr)
- Infrastructure Monitoring: $29/host/mo ($0.04/hr)
- Full-Stack Monitoring: $58/8GiB-host/mo ($0.01/GiB-hr)
- Kubernetes Platform: $1.40/pod/mo
- Industry-first hourly pricing (no high-watermark), 15-min billing intervals

## 2.5 What CloudBuilder Can Learn

1. **DAVIS Causal AI** -- AIOps must determine causality, not just correlation
2. **Auto Baselining** -- Dynamic cost baselines learn what "normal" spend is per service
3. **Smartscape Topology** -- Auto-discover canvas -> deployed infrastructure mapping
4. **OneAgent Philosophy** -- Single CLI/agent for design, provision, observe, cost
5. **Grail Data Lakehouse** -- Unify all platform data in single queryable store
6. **SRE Guardian (Release Gating)** -- Gate deployments on health checks + SLO validation
7. **Davis CoPilot** -- Action-oriented AI that creates dashboards, writes queries, triggers workflows
8. **Preventive Operations** -- Predict cost overruns BEFORE they happen
9. **PurePath Tracing** -- Trace a resource: canvas -> code gen -> deployment -> runtime
10. **OpenPipeline** -- Custom metrics from any canvas property or deployment attribute
11. **Fault Tree Analysis** -- Dependency graph analysis to surface most probable root cause
12. **Auto-Adaptive Thresholds** -- Alerting that self-adjusts based on historical patterns

---

# 3. New Relic

## 3.1 Core Value Proposition
New Relic is the intelligent observability platform with a unique entity-centric data model and powerful SQL-like NRQL query language. They pioneered usage-based pricing with no per-host fees -- pay for data in + actions out.

## 3.2 Key Features

| Feature | Description | Why It Matters |
|---------|-------------|----------------|
| **NRQL Query Language** | SQL-like language for querying ALL telemetry data | One language across the entire platform |
| **Entity Explorer** | All resources as first-class entities with golden metrics, tags | Entity-centric navigation |
| **E&R via NRQL (2025)** | Entity and relationship data directly queryable in NRDB | Correlate entity state changes with performance |
| **Applied Intelligence** | ML incident correlation, auto-classification, issue mapping | Groups related incidents, surface root cause |
| **Scorecards** | Observability maturity scoring (tags, reliability, coverage) | Drives accountability |
| **Navigator + Lookout** | Honeycomb view + auto anomaly detection (5min vs 1hr) | At-a-glance health of entire estate |
| **New Relic Compute (2026)** | CCUs -- pay for actions (query, page load, API), not hosts/users | True usage-based pricing |
| **Service Architecture Intelligence** | Auto-discovered service topology, catalogs, teams | Understand service connectivity |
| **Workloads** | Logical entity groupings by team/app/environment | Organizational alignment |
| **700+ Integrations** | Broad ecosystem of integrations | Quick time-to-value |
| **Change Tracking** | Deployment events linked to performance changes | Answer "what changed?" instantly |

## 3.3 Architecture Highlights
- NRDB: Custom telemetry DB optimized for immutable time-series data, sub-50ms median query
- Entity-centric: all telemetry attached to entities with automatic relationship inference
- NRQL everywhere: dashboards, alerts, API queries, data transformation -- one language
- CCU metering: measured by successful user-initiated actions
- Distributed query engine: Thrift-encoded plans, parallel workers, cache-optimized
- Entity synthesis rules: auto-create entities from telemetry matching definition files

## 3.4 Pricing Model
- Data: $0.40/GB (Original), $0.60/GB (Data Plus with extended retention)
- Compute: Tiered CCUs per successful action
- Unlimited hosts, CPUs, users in compute model
- Most generous enterprise pricing in observability

## 3.5 What CloudBuilder Can Learn

1. **Entity-Centric Model** -- Every resource (canvas, deployment, cost, incident) as first-class entity
2. **CBQL (CloudBuilder Query Language)** -- SQL-like query across ALL platform data
3. **Scorecards** -- Design maturity scoring (HA, security, cost, observability) -- already partially built
4. **Navigator+Lookout** -- Hexbin view of all resources with anomaly detection
5. **Entity Relationships** -- Auto-discover canvas -> deployed -> cost -> incident relationships
6. **Service Architecture Intelligence** -- Service map correlating design -> provision -> health -> cost
7. **Incident Correlation** -- Correlate related incidents into single problem (VPC down != alert on every resource)
8. **Change Tracking** -- Every deployment links to a canvas version
9. **Workloads** -- Logical resource grouping by team, environment, application
10. **NRQL Everywhere** -- Single query language across all interactions
11. **Entity Synthesis Rules** -- Custom entity types via telemetry matching
12. **Compute-Based Pricing** -- CCU model for CloudBuilder Cloud

---

# 4. Datadog

## 4.1 Core Value Proposition
Datadog is the unified observability and security platform with a single agent, 1,000+ integrations, and seamless cross-product correlation. Pioneered the "pivot from any signal to any context" paradigm.

## 4.2 Key Features

| Feature | Description | Why It Matters |
|---------|-------------|----------------|
| **Unified Agent** | Single datadog-agent for metrics, traces, logs, security | One install covers everything |
| **Service Map** | Real-time visualization of service dependencies | Instant bottleneck identification |
| **APM+Logs+Metrics Correlation** | All signals cross-linked with trace IDs | Pivot from any signal to any context |
| **Host Map (2026)** | Hexbin visualization with K8s clusters, pods, containers | Modern topology in one view |
| **Dashboards-as-Code** | JSON dashboards via Terraform, CLI, or API | GitOps for monitoring |
| **Monitors** | Multi-condition, multi-variable, composite alerts | Sophisticated alert logic |
| **SLO Tracking** | Error budgets, burn rate alerts, multi-SLO widgets | Reliability engineering built in |
| **Service Remapping (2026)** | Merge/split/rename services via infrastructure tags | Consistent naming despite chaos |
| **Unified Service Tagging** | env, service, version tags across ALL telemetry | Foundation for correlation |
| **Single Step Instrumentation** | Install agent + instrument app in one step | Fastest time-to-value |
| **Continuous Profiler** | Always-on production profiling, <5% overhead | Find expensive code |
| **Cloud Cost Management** | Correlate cloud spend with resource utilization | FinOps integrated |

## 4.3 Architecture Highlights
- Datadog Agent: open-source Go agent with modular checks and auto-discovery via Autodiscovery
- High-watermark pricing: 99th percentile of hourly host count (top 1% spikes excluded)
- Unified Service Tagging: three reserved tags (env, service, version) spanning ALL products
- Service Remapping: rule-based engine for merge/split across telemetry
- Host Map: custom hexbin engine scalable to 100K+ nodes with real-time updates
- Cross-product correlation: every signal linked via trace_id, service, host

## 4.4 Pricing Model
- Infrastructure Pro: $15/host/mo ($18 on-demand)
- APM Standard: $31/host/mo ($48 on-demand) -- NOTE: requires Infrastructure (~$46/host real cost)
- Logs: $0.10/GB ingestion + $1.70/million indexed events
- Annual commitments save 20-50%

## 4.5 What CloudBuilder Can Learn

1. **Unified Agent** -- Single CLI for design metadata, deployment status, resource health, cost data
2. **Service Map** -- Real-time dependencies between designed and deployed resources
3. **Cross-Product Correlation** -- Pivot canvas -> deployment -> health -> cost -> incident
4. **Unified Service Tagging** -- Standardized env, service, version tags across ALL resources
5. **Host Map (Hexbin)** -- Redesign Observe dashboard as hexbin/heatmap
6. **SLO Tracking** -- SLOs for deployment success, design validation pass rate, cost accuracy
7. **Dashboards-as-Code** -- Native Terraform provider for CloudBuilder resources
8. **Single Step Instrumentation** -- One-click "instrument this design" action
9. **Continuous Profiler** -- Profile the design->deploy->observe loop itself
10. **Cloud Cost Management** -- Correlate spend with canvas resources and deployment versions
11. **Service Remapping** -- Merge/split/rename without re-instrumentation
12. **High-Watermark Pricing** -- 99th percentile billing for CloudBuilder Cloud

---

# 5. Miro

## 5.1 Core Value Proposition
Miro is the AI-powered innovation workspace -- infinite canvas for team collaboration, brainstorming, diagramming, and visual project management. 250+ integrations, 6,000+ templates. Recently pivoted to AI-native collaboration with Sidekicks, Flows, and MCP.

## 5.2 Key Features

| Feature | Description | Why It Matters |
|---------|-------------|----------------|
| **Intelligent Canvas** | Multiplayer canvas with visual context AI processing | AI understands canvas content semantically |
| **Sidekicks (AI Agents)** | Context-aware conversational AI on canvas | AI works alongside the team |
| **Flows (AI Workflows)** | Multi-step AI workflows automating entire processes | From brainstorm to execution in minutes |
| **MCP Integration** | Model Context Protocol to AI coding tools (Cursor, Copilot, Claude) | Bi-directional spec/code sync |
| **Templates Ecosystem** | 6,000+ community and official templates | Eliminates blank-page problem |
| **Formats** | Docs, Tables, Timelines, Kanban, Slides, Diagrams | Flexible expression for any phase |
| **Blueprints** | Custom repeatable workflows for org-wide standardization | Process governance at scale |
| **Enterprise Guard** | Auto-classify sensitive data (IP, PII) in real-time on canvas | Security at collaboration layer |
| **Widget Creator (AI)** | Describe what you need, AI creates interactive widget | No-code extensibility |
| **TalkTrack** | Record async walkthroughs, AI surfaces key moments | Async collaboration |
| **Smart Shape Packs** | AWS, Azure, GCP, K8s, UML shape libraries | One-click architecture diagrams |

## 5.3 Architecture Highlights
- Real-time multiplayer WebSocket engine: cursor tracking, live editing, 100+ simultaneous editors
- Visual context processing: AI sees and understands canvas content semantically, not just OCR
- Canvas SDK + Widget SDK: developer platform for custom integrations
- MCP bi-directional sync: specs <-> code through Model Context Protocol
- Enterprise Guard: real-time ML-based content classification and DLP on the canvas
- Spaces: hierarchical content management with role-based access

## 5.4 Pricing Model
- Free: $0 (3 editable boards, limited AI)
- Starter: $8/user/mo (annual) - unlimited boards, core tools
- Business: $20/user/mo (annual) - SSO, AI Workflows (Sidekicks + Flows)
- Enterprise: Custom (30+ users) - Enterprise Guard, custom AI

## 5.5 What CloudBuilder Can Learn

1. **Visual Context Processing** -- Canvas understands resource semantics, not just renders shapes
2. **Sidekicks (Context-Aware AI Agents)** -- AI sees canvas selection, generates Terraform, validates, suggests fixes
3. **Flows (Multi-Step Workflows)** -- Design->Validate->Generate->Preview->Deploy in one click
4. **MCP Integration** -- Connect canvas to Cursor, Copilot, Claude Code for bi-directional sync
5. **Templates Ecosystem** -- Community marketplace for infrastructure templates (Miroverse for CloudBuilder)
6. **Multiple Formats in Canvas** -- Docs, Tables, Kanban views within the design canvas
7. **Widget Creator (No-Code)** -- Describe a resource component, get a canvas widget
8. **Enterprise Guard** -- Detect hardcoded secrets, internal IPs, PII in canvas designs
9. **Smart Shape Packs** -- Provider-specific shape packs auto-updated from provider APIs
10. **Blueprints** -- Define standard operating procedures as reusable workflows
11. **TalkTrack for Async** -- Record async design walkthroughs with AI-generated summaries
12. **Canvas SDK** -- Expose API/SDK for third-party custom design components

---

# 6. Excalidraw

## 6.1 Core Value Proposition
Excalidraw is the open-source hand-drawn style whiteboard -- free, privacy-first, with real-time E2E encrypted collaboration. Trusted by Google Cloud, Meta, Notion, and Obsidian. The hand-drawn aesthetic encourages quick, informal visual thinking without pixel-perfection pressure.

## 6.2 Key Features

| Feature | Description | Why It Matters |
|---------|-------------|----------------|
| **Hand-Drawn Style (Rough.js)** | Sketch-like aesthetic encouraging imperfection | Lowers cognitive barrier to visual thinking |
| **Local-First Architecture** | Browser storage, no account required, offline PWA | Zero friction, privacy by design |
| **End-to-End Encryption** | AES-GCM, keys never leave client (URL fragment) | True privacy -- server never sees content |
| **Real-Time Collaboration** | WebSocket (Socket.IO) with version reconciliation | Smooth collaborative editing |
| **React Component Library** | Full editor as npm package (@excalidraw/excalidraw) | Adopted by Google, Meta, Notion, Obsidian |
| **Infinite Canvas** | Unlimited drawing space | No constraints on creativity |
| **Export** | PNG, SVG, JSON (free) + PDF, PPTX (Plus) | Interoperability |
| **Generative AI** | Text-to-diagram, wireframe-to-code, BYOK | AI without vendor lock-in |
| **Two-Canvas Rendering** | Static + Interactive canvas optimization | Performance at scale |
| **MIT License** | Fully open source | Maximum flexibility |
| **Arrow Binding** | Smart arrows bound to shapes with version tracking | Diagram integrity |
| **Excalidraw+** | $6/user/mo cloud workspace, teams, presentations | Sustainable monetization |

## 6.3 Architecture Highlights
- Centralized App orchestrating AppState, Scene elements, Store deltas
- Two-canvas strategy: static (drawing elements) + interactive (cursors, selection, overlays)
- Portal WebSocket: AES-GCM encrypted, Socket.IO with auto-reconnection and room isolation
- Version-based conflict resolution: element version + versionNonce random tiebreaker
- Firebase Firestore: transaction-based persistence with sceneVersion fingerprint
- Tombstoning: isDeleted flag instead of hard delete for cross-session undo
- PWA with full offline service worker support

## 6.4 Pricing Model
- Free: $0 (1 scene, local-only, unlimited collaborators, basic AI)
- Excalidraw+: $6/user/mo ($7 monthly) -- unlimited scenes, cloud, teams, PDF/PPTX, extended AI (100 req/day)

## 6.5 What CloudBuilder Can Learn

1. **Local-First Architecture** -- CloudBuilder works offline, syncs when online
2. **Embeddable Component** -- CloudBuilder Canvas as React npm package for other tools
3. **Sketch Mode** -- Toggle for early-stage brainstorming before precise architecture
4. **End-to-End Encryption** -- E2E encrypted design sharing for enterprise compliance
5. **Version-Based Conflict Resolution** -- Element-level versioning for real-time collaboration
6. **Two-Canvas Rendering** -- Separate static design from interaction overlay for performance
7. **Tombstoning** -- isDeleted flag for undo across sessions, not hard delete
8. **Minimal UI Philosophy** -- Progressive disclosure of features, not all buttons at once
9. **Keyboard-First Navigation** -- Keyboard shortcuts + command palette for power users
10. **Open Source Core + SaaS** -- Open source canvas engine, monetize cloud features
11. **Arrow Binding with Smart Routing** -- Auto-route connections between resources
12. **PWA + Offline** -- Design infrastructure without internet connectivity

---

# 7. Synthesis: Top 30 Features Ranked by Implementation Priority

Methodology: Features scored 1-10 across 5 dimensions (Value, Differentiation, Feasibility, Roadmap alignment, Revenue potential). Max score = 50.

Priority Labels:
- **P0 -- Immediate** (Sprint 9-12, Q3 2026)
- **P1 -- High** (Sprint 13-17, late Q3-Q4 2026)
- **P2 -- Medium** (Sprint 18-21, Q4 2026)
- **P3 -- Future** (Sprint 22+, Q1 2027)

| Rank | Feature | Source | Score | Priority | Rationale |
|------|---------|--------|-------|----------|-----------|
| 1 | Visual Context Processing | Miro | 48 | P0 | Foundation for ALL AI features |
| 2 | Entity-Centric Data Model | New Relic | 47 | P0 | Unifies all modules under single model |
| 3 | Dynamic/Living Dashboards | Grafana | 46 | P0 | ObserveModule becomes adaptive |
| 4 | CBQL Unified Query Language | New Relic | 45 | P0 | One query for designs, deployments, costs, incidents |
| 5 | Cross-Product Signal Correlation | Datadog | 44 | P1 | CloudBuilder superpower |
| 6 | Sidekicks (Context-Aware AI Agents) | Miro | 43 | P1 | AI sees canvas selection, takes actions |
| 7 | Auto Baselining (Cost+Health) | Dynatrace | 43 | P1 | Eliminate alert fatigue |
| 8 | SLO Tracking + Error Budgets | Datadog | 42 | P1 | Platform reliability metrics |
| 9 | Bidirectional Git Sync | Grafana | 42 | P1 | GitOps for infra design |
| 10 | Entity Relationship Auto-Discovery | New Relic | 41 | P1 | Auto-populated ServiceMapView |
| 11 | Flows (AI Workflows) | Miro | 41 | P1 | Core value proposition automated |
| 12 | Smartscape-Like Topology | Dynatrace | 40 | P1 | Drift between design and reality |
| 13 | Resources-as-Code (Terraform Provider) | Grafana+Datadog | 40 | P1 | Go engine integration |
| 14 | Design Maturity Scorecards (expand) | New Relic | 39 | P2 | Already partially built |
| 15 | Change Tracking | New Relic | 39 | P2 | Critical for incident response |
| 16 | Unified Alerting Engine | Grafana | 38 | P2 | Cross-module alert correlation |
| 17 | MCP Integration | Miro | 38 | P2 | Specs-code bi-directional |
| 18 | Health Checks (Advisor-Style) | Grafana | 37 | P2 | Self-diagnostics |
| 19 | Unified Service Tagging | Datadog | 37 | P2 | Foundation for correlation |
| 20 | Local-First + Offline PWA | Excalidraw | 36 | P2 | Air-gapped enterprise requirement |
| 21 | Template Ecosystem (Marketplace) | Miro+Grafana | 35 | P2 | Community templates |
| 22 | Embeddable Canvas (npm Package) | Excalidraw | 35 | P2 | Viral distribution channel |
| 23 | Action-Oriented AI CoPilot | Dynatrace | 34 | P2 | Beyond Q&A to action |
| 24 | Two-Canvas Rendering | Excalidraw | 33 | P3 | Performance for 500+ nodes |
| 25 | Preventive AI Operations | Dynatrace | 33 | P3 | Proactive FinOps |
| 26 | Continuous Profiler | Datadog | 32 | P3 | Platform bottleneck identification |
| 27 | Service Remapping | Datadog | 31 | P3 | Organizational naming reality |
| 28 | Hand-Drawn Sketch Mode | Excalidraw | 30 | P3 | Nice-to-have |
| 29 | Enterprise Guard (Canvas DLP) | Miro | 29 | P3 | Regulated industry need |
| 30 | Widget Creator (No-Code) | Miro | 28 | P3 | Ultimate extensibility |


## Implementation Roadmap Mapping

```
Q3 2026 (Operations -- Sprint 9-12)     Q4 2026 (Intelligence -- Sprint 13-21)      Q1 2027 (Scale -- Sprint 22+)
---------------------------------------+------------------------------------------+-------------------------------
P0 (Immediate)                          | P1 (High)                                | P3 (Future)
* Visual Context Processing             | * Sidekicks (AI Agents)                  | * Two-Canvas Rendering
* Entity-Centric Data Model             | * Auto Baselining                        | * Preventive AI Operations
* Dynamic/Living Dashboards             | * Entity Relationship Discovery          | * Continuous Profiler
* CBQL Unified Query Language           | * Flows (AI Workflows)                   | * Service Remapping
* SLO Tracking + Error Budgets          | * Smartscape Topology                    | * Hand-Drawn Sketch Mode
* Bidirectional Git Sync                | * Resources-as-Code (Terraform Provider) | * Enterprise Guard (DLP)
* Cross-Product Signal Correlation      | * Design Scorecards (Expanded)           | * No-Code Widget Creator
                                        | * Change Tracking                        |
                                        | * Unified Alerting Engine                |
                                        | * MCP Integration                        |
                                        | * Health Checks (Advisor)                |
                                        | * Template Marketplace                   |
                                        | * Embeddable Canvas (npm)                |
                                        | * Action-Oriented AI (CoPilot)           |
                                        | * Local-First + Offline PWA              |
                                        | * Unified Service Tagging                |
```

## Strategic Recommendations

### Immediate Actions (Sprint 9-10)
1. **Refactor Canvas to semantic-aware rendering** -- must know "Node A is VPC containing Node B (subnet)". This unlocks ALL downstream AI features
2. **Define entity schema for ALL resource types** -- canvas nodes, deployments, environments, cost records, incidents -- unified entity model with tags, golden metrics, relationships
3. **Design CBQL (CloudBuilder Query Language)** -- SQL-like query across entity types: "SELECT * FROM deployments WHERE cost > 1000 AND status = 'failed'"

### Medium-Term Actions (Sprint 13-17)
4. **Build Sidekicks integration into AIChatPanel** -- AI sees canvas selection, generates Terraform, suggests fixes, creates dashboards
5. **Implement cross-product correlation** -- every signal links to every other via common identifiers (entityGuid, deploymentId, costId)
6. **Develop Flows engine** -- reusable multi-step workflows (Design->Validate->Generate->Preview->Deploy) as first-class platform primitives

### Long-Term Differentiators (Sprint 22+)
7. **MCP bi-directional integration** -- CloudBuilder becomes the visual planning layer for AI coding tools
8. **Preventive AI operations** -- predict cost overruns and deployment failures before they happen
9. **Open source core canvas engine** -- drive adoption and community contributions (Excalidraw model)

---
## Sources

- Grafana: grafana.com/docs, grafana.com/blog/grafana-13-release/, grafana.com/pricing/, github.com/grafana/grafana
- Dynatrace: docs.dynatrace.com, dynatrace.com/platform/purepath/, dynatrace.com/pricing/
- New Relic: docs.newrelic.com, newrelic.com/pricing, newrelic.com/blog
- Datadog: docs.datadoghq.com, datadoghq.com/pricing/, datadoghq.com/blog/
- Miro: miro.com/pricing/, miro.com/blog/, miro.com/intelligent-canvas/
- Excalidraw: github.com/excalidraw/excalidraw, plus.excalidraw.com/pricing, docs.excalidraw.com/
- Grafana Terraform Provider: registry.terraform.io/providers/grafana/grafana/
- Pricing Analysis: CloudZero, Vendr, CostBench, OpsLyft

---

*Document generated by FAANg Research Governor Agent -- 2026-06-24*
*Next update: Upon major competitor releases or quarterly roadmap review*
