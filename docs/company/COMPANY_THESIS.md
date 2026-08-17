# Company Thesis

> Status: Active | Owner: Founders | Last Updated: 2026-08-14

## Problem

Cloud infrastructure management is broken at the intersection of **intent and execution**. Engineers design architectures on whiteboards and Miro boards, then manually translate those designs into Terraform code, debug provisioning errors, stitch together observability tools, and manage costs through spreadsheets. The gap between "what we want" and "what's running" is filled with manual toil, tribal knowledge, and toolchain fragmentation.

## The Opportunity

$500B+ in annual cloud spend globally, with organizations spending 30-40% of engineering time on infrastructure management. Every cloud-native company faces the same problem: the distance between architecture diagrams and running infrastructure is too long, too manual, and too error-prone.

The market is shifting from "infrastructure as code" to "infrastructure as a platform" — teams want to go from intent to running infrastructure with minimal friction, while maintaining governance, cost control, and operational visibility.

## Vision

Build the operating system for cloud infrastructure — the single environment where teams go from architecture intent to running, observed, cost-optimized infrastructure.

## Mission

Make cloud infrastructure visual, automated, and accessible to every engineering team.

## Tese

> **Visual infrastructure design that generates real infrastructure, combined with AI-powered operations, will replace the fragmented toolchain that platform teams currently stitch together.**

The key insight: infrastructure is fundamentally a **graph** — resources connected by relationships. A visual graph editor is the natural interface for infrastructure design, and that graph can be directly translated into execution (Terraform), monitoring (observability), optimization (FinOps), and intelligence (AI).

## Structural Market Shifts

1. **Platform Engineering is mainstream** — Gartner predicts 80% of large orgs will have platform teams by 2026. These teams need tooling.
2. **AI can understand infrastructure** — LLMs can parse Terraform, understand cloud resource relationships, generate configurations, and explain complex architectures in natural language.
3. **Multi-cloud is reality** — 76% of enterprises use 2+ clouds. No single provider's tooling works across providers.
4. **FinOps is mandatory** — Cloud cost optimization is no longer optional. Engineering teams need cost visibility at design time.
5. **Compliance automation** — Policy-as-code (OPA, Cedar) is becoming standard. Infrastructure needs automated guardrails.

## Why Now

The convergence of visual programming maturity (ReactFlow v12), IaC standardization (Terraform/OpenTofu), AI capability (LLMs for code generation and analysis), and Platform Engineering adoption creates a unique window. Building this 3 years ago would have been too early (AI not capable enough). Building it 3 years from now will be too late (incumbents will have integrated).

## The Wedge

**Visual infrastructure design → Terraform generation → provisioning on GCP.**

Start with one provider (GCP), one workflow (design → provision), and one user (platform engineer at a 20-person startup). Prove that a visual design can become running infrastructure end-to-end. Then expand to observability, AI, multi-cloud, and enterprise features.

## Expansion

```
Canvas (Design) → Provision (Execute) → Observe (Monitor) → Optimize (FinOps) → Automate (AI) → Platform (OS)
```

Each stage creates a natural expansion path while deepening value for existing users.

## Distribution Strategy (Closed-Source)

Since CloudBuilder is **closed-source**, distribution relies on:

### Primary Channels
1. **Direct sales** — Founder-led, inbound from content
2. **Content marketing** — Technical blog, tutorials, architecture guides
3. **Community** — Discord, LinkedIn, X for developer engagement
4. **Demo-first** — Free trial with limited resources (10 resources free)

### Why Closed-Source

| Reason | Rationale |
|--------|-----------|
| **IP protection** | Visual canvas + code generation + provisioning is defensible IP |
| **Enterprise readiness** | Enterprises prefer closed-source for security/compliance |
| **Revenue control** | No forks competing on price |
| **Distribution control** | Can gate features and manage release cycle |
| **Valuation** | Closed-source SaaS commands higher multiples than open-core |

### What We Lose

| Loss | Mitigation |
|------|-----------|
| Community contributions | Hire engineers instead |
| Organic GitHub distribution | Content marketing + SEO |
| Developer trust | Transparent security docs + free trial |
| Ecosystem extensibility | API + integrations (not open source) |

### Free Trial Strategy

- **Free tier:** 10 resources, 1 user, basic features
- **Trial:** 14-day access to Pro features
- **No credit card required** for trial
- **Frictionless signup** (email + password only)

## Moat

### Current
- Visual canvas with provider-aware node/edge system
- Multi-cloud Terraform code generation
- Go provision engine with credential injection

### Emerging (Closed-Source Advantage)
- **Proprietary algorithms** — Connection validation, cost estimation, drift detection
- **AI training data** — Patterns from customer usage improve recommendations
- **Workflow data** — Design → Execute → Observe feedback loop
- **Enterprise integrations** — SSO, SCIM, audit export

### Potential
- **Data moat** — Aggregated usage patterns inform best practices
- **AI moat** — Proprietary evaluation datasets from customer deployments
- **Switching costs** — Accumulated designs, configurations, and integrations
- **Brand** — Trust in a category-defining product

## Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| No community distribution | High | Content marketing + SEO + direct sales |
| Enterprise security review blocks adoption | High | Read-only mode first, least-privilege, transparent docs |
| Small team can't execute on all modules | High | Focus on Canvas → Provision → one cloud; delay others |
| Competitor with open-source alternative | Medium | Closed-source IP protection + enterprise features |
| AI commoditization | Medium | AI is a capability layer, not the core product |

## Fundamental Hypotheses

1. **H1:** Platform engineers will use a visual canvas to design infrastructure instead of writing Terraform directly.
2. **H2:** Auto-generated Terraform from visual designs is good enough for production use.
3. **H3:** The feedback loop (design → provision → observe → redesign) creates compounding value.
4. **H4:** AI can meaningfully improve infrastructure operations (cost, reliability, security).
5. **H5:** Teams will pay for a unified closed-source platform instead of using separate tools.
6. **H6:** Content marketing + direct sales can drive enough adoption for a commercial business.

## Key Questions

> If CloudBuilder ceased to exist tomorrow, who would feel the loss?

Early-stage platform engineers at startups who've adopted the visual design workflow. The answer should be "our first 10 design partners" — if we can't identify them, we haven't found product-market fit.

> What is the non-obvious reason CloudBuilder could become an important company?

The visual canvas creates a structured representation of infrastructure intent. This structured data, combined with execution outcomes and observability data, creates a unique proprietary dataset that AI can use to learn what good infrastructure looks like — a flywheel that no open-source competitor can replicate because they don't control the distribution.

---

*See also: [PRODUCT_VISION.md](../product/PRODUCT_VISION.md) · [BUSINESS_MODEL.md](../business/BUSINESS_MODEL.md) · [SYSTEM_ARCHITECTURE.md](../architecture/SYSTEM_ARCHITECTURE.md)*
