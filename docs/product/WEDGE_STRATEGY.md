# Wedge Strategy

> Status: Draft | Owner: Product | Last Updated: 2026-08-14

## Framework

```
High Pain × High Frequency × Clear Value × Low Adoption Friction × Natural Expansion
```

## Initial Wedge

**Visual infrastructure design → Terraform generation → GCP provisioning for platform engineers at 10–200 person startups.**

### Why This Wedge

| Criterion | Assessment |
|-----------|-----------|
| **High Pain** | Platform engineers spend 60% of time on infrastructure requests |
| **High Frequency** | Infrastructure design/provisioning happens weekly |
| **Clear Value** | Visual design → real infrastructure is immediately understandable |
| **Low Friction** | Open-source, Docker Compose, 5-minute setup |
| **Natural Expansion** | Design → Provision → Observe → Optimize → Automate |

### What We Explicitly Ignore

1. **CI/CD** — We generate infrastructure, not deploy apps
2. **Kubernetes cluster management** — We manage K8s resources, not clusters
3. **Log aggregation** — We integrate with observability tools, don't replace them
4. **Multi-cloud optimization** — Too broad for day one
5. **Enterprise features** — SSO, SCIM, audit export come later

## Expansion Path

```
Stage 1: Canvas → Terraform → GCP (PROVE)
Stage 2: + AWS + Azure + K8s (EXPAND PROVIDERS)
Stage 3: + Observability + Cost (ADD VALUE)
Stage 4: + AI + Policies + Approvals (ADD INTELLIGENCE)
Stage 5: + Marketplace + Templates + Community (ADD ECOSYSTEM)
```

## Wedge Validation

### Success Criteria

| Metric | Target | Timeline |
|--------|--------|----------|
| Design partners | 10 | 30 days |
| Successful provisions | 50 | 60 days |
| Week 2 retention | > 40% | 90 days |
| First paying customer | 1 | 120 days |

### Failure Criteria

| Signal | Action |
|--------|--------|
| < 3 design partners in 30 days | Revisit ICP or positioning |
| < 10 successful provisions in 60 days | Revisit core loop or onboarding |
| < 20% week 2 retention | Revisit value proposition |
| 0 paying customers in 120 days | Revisit business model |

## Anti-Wedge

Things that feel like the wedge but aren't:

| Anti-Wedge | Why not |
|-----------|---------|
| "Multi-cloud management platform" | Too broad, no focus |
| "AI-powered infrastructure" | AI is capability, not core |
| "Enterprise DevOps platform" | Enterprise is expansion, not wedge |
| "Terraform GUI" | Too narrow, not differentiated |
| "Cloud cost optimizer" | Too narrow, not core value |

## Beachhead Market

**Platform engineers at Brazilian B2B SaaS startups (Series A–C).**

### Why This Market

1. **High pain** — Small teams, limited time, growing infrastructure
2. **Accessible** — Founder's network, same language, same timezone
3. **Representative** — Problems are universal, solution scales globally
4. **Underserved** — No visual infrastructure tool targeting this segment

### Anti-ICP

| Segment | Why not |
|---------|---------|
| Solo hobbyists | No budget, no complexity |
| Enterprise (500+ engineers) | Has custom IDPs, long sales cycles |
| Non-technical teams | Needs different product |
| AWS-only using CloudFormation | Already has provider-native tooling |

## Distribution for the Wedge

| Channel | Purpose | Expected CAC |
|---------|---------|-------------|
| GitHub | Open-source distribution | $0 |
| Technical blog | SEO, education | $50 |
| Discord | Community, support | $0 |
| LinkedIn | B2B awareness | $100 |
| X (Twitter) | Developer community | $0 |
| Direct outreach | Design partner recruitment | $200 |

**Target CAC:** < $200 (open-source + content + community)

## Wedge Test

> "Is this wedge small enough to execute and big enough to matter?"

**Small enough:** One provider (GCP), one workflow (design → provision), one user (platform engineer).

**Big enough:** Platform engineering is a $50B+ market. Visual infrastructure is a new category. If we prove the wedge, expansion is natural.

**Decision:** Yes, this wedge passes the test.
