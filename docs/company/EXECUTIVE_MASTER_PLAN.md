# Executive Master Plan

> Status: Active | Owner: Founders | Last Updated: 2026-08-14

## Executive Summary

CloudBuilder is a closed-source Platform Engineering platform that helps teams design cloud infrastructure visually and provision it automatically. Built on React 19 + Java 21 + Go 1.23, it translates visual architecture diagrams into Terraform code and executes provisioning across GCP, AWS, Azure, and Kubernetes. The platform includes observability, AI-powered operations, cost management, and policy enforcement.

**Current state:** Functional MVP with working canvas, code generation, Go execution engine, and Docker-based deployment. 720+ backend tests, 312 frontend tests passing. Key gap: end-to-end provision loop needs real cloud execution validation with actual credentials.

**Distribution:** Closed-source SaaS. No open-source. Content marketing + founder-led sales + free trial.

## Founder Decisions (Locked In)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Geography** | Brazil first | Founder's network, same language/timezone |
| **Open-source** | Closed source | Protect IP, control distribution, enterprise readiness |
| **Pricing** | Tiered SaaS | Starter ($79) → Pro ($299) → Business ($799) → Enterprise (custom) |
| **Fundraising** | Bootstrap | Prove PMF before taking money |
| **First hire** | Full-stack engineer | Build > distribute at this stage |

## What CloudBuilder Is

A visual infrastructure operating system. Teams design on a canvas, generate Terraform, provision to cloud, observe results, and optimize costs — all in one closed-source environment.

## Current State

| Dimension | Status | Evidence |
|-----------|--------|---------|
| Canvas | ✅ Production-ready | ReactFlow v12, 312 tests, auto-save, undo/redo |
| Code Generation | ✅ Working | Generates main.tf, variables.tf, outputs.tf per provider |
| Provision Execution | ✅ Working | Go engine with terraform init/plan/apply/destroy |
| Credentials | ✅ Working | Encrypted storage, per-provider injection |
| Observability | 🟡 Functional | Metrics, logs, traces, SLOs, alerts |
| AIOps | 🟡 Functional | Anomaly detection, NL query |
| FinOps | 🟡 Functional | Cost estimation, budgets |
| Policy Engine | ✅ Working | OPA/Rego policies |
| Multi-tenancy | ✅ Working | tenantId + TenantFilter + RBAC |
| Auth | ✅ Working | JWT + Spring Security |
| CI/CD | ✅ Working | GitHub Actions |
| Tests | ✅ Strong | 720+ backend, 312 frontend |

## Product Thesis

> Visual infrastructure design that generates real infrastructure, combined with AI-powered operations, will replace the fragmented toolchain that platform teams currently stitch together.

## Wedge

Canvas → Terraform → GCP provisioning for platform engineers at 10–200 person startups.

## ICP

Platform engineers at B2B SaaS startups (Series A–C) who are building their first Internal Developer Platform.

## Architecture

Modular monolith (Spring Modulith) + React SPA + Go execution engine. Docker Compose for deployment. PostgreSQL 16 for persistence. OPA for policy enforcement. JWT auth with RBAC.

## AI

AI is a capability layer, not the core product. Near-term: statistical anomaly detection + NL query. Medium-term: LLM for architecture recommendations. AI never overrides policy.

## Security

JWT auth, RBAC, multi-tenant isolation, encrypted credentials, OPA policies. Security is architecture.

## Business Model

Closed-source SaaS with tiered pricing. Value metric: managed cloud resources per month. Free trial (14 days, no credit card) → Starter ($79) → Pro ($299) → Business ($799) → Enterprise (custom).

## GTM

Content-Led Growth + Founder-Led Sales. Beachhead: Brazilian B2B SaaS startups. Primary channels: technical blog, Discord, LinkedIn, X.

## Growth

Content → trial signup → activation → provision → retention → expansion → advocacy. No open-source distribution.

## Moat

**Closed-source advantage:** Proprietary algorithms, AI training data from customer usage, workflow data, enterprise integrations. No forks competing on price.

## Roadmap

### Stage 1: Foundation (Now)
- Complete provision loop with real GCP execution
- 10 design partners using CloudBuilder for real infrastructure
- Fix onboarding (< 30 min to first provision)

### Stage 2: Activation (Next)
- Observability auto-connects to provisioned resources
- Cost tracking per resource and per environment
- Approval gates for production deployments

### Stage 3: Retention (Later)
- AI copilot for natural language infrastructure operations
- Drift auto-remediation with approval
- Multi-environment promotion workflows

### Stage 4: Monetization (Future)
- Stripe billing integration
- Enterprise features (SSO, SCIM, audit export)
- Custom pricing for large deployments

### Stage 5: Expansion (Long-term)
- Autonomous infrastructure agent
- Cross-cloud optimization
- Private deployment option

## Metrics

**North Star:** Successful provisions per week

**Supporting:**
- Time to first provision (target: < 30 min)
- Trial-to-paid conversion (target: > 10%)
- Week 2 retention (target: > 40%)
- Team adoption rate (target: > 20%)
- MRR (target: $17,500 in 12 months)

## Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| No real users | High | High | Get 10 design partners immediately |
| Provision failures in production | High | Medium | Extensive testing, rollback capability |
| No organic distribution (closed-source) | High | Medium | Content marketing + SEO + founder-led |
| Competitor launches visual tool | Medium | Low | Speed of execution + enterprise features |
| Security breach | Critical | Low | Defense in depth, audit, encryption |

## Immediate Priorities (Next 30 Days)

1. **Validate provision loop end-to-end** — Connect real GCP credentials, provision actual infrastructure
2. **Get 10 design partners** — Identify and onboard 10 platform engineers
3. **Fix onboarding** — New user should reach first provision in < 30 minutes
4. **Improve documentation** — README, architecture docs for users
5. **Start content marketing** — Publish first 5 technical blog posts

## First Hire

**Full-stack engineer (mid-level, R$15-22K/month + 0.5-1.0% equity).**

Hire when: Revenue justifies it OR we have 10+ design partners and need to move faster.

---

*See also: [COMPANY_THESIS.md](COMPANY_THESIS.md) · [ROADMAP.md](../roadmap/ROADMAP.md) · [STRATEGIC_RECOMMENDATION.md](STRATEGIC_RECOMMENDATION.md)*
