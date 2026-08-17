# Open Questions

> Status: Active | Owner: Founders | Last Updated: 2026-08-14

## Decisions Made ✅

| Question | Decision | Date |
|----------|----------|------|
| Initial geography | Brazil first | 2026-08-14 |
| Open-source | Closed source (SaaS only) | 2026-08-14 |
| Pricing philosophy | Tiered SaaS (Starter/Pro/Business/Enterprise) | 2026-08-14 |
| Fundraising | Bootstrap | 2026-08-14 |
| First hire | Full-stack engineer | 2026-08-14 |

## Remaining Open Questions

### Customer Questions (Need Validation)

| Question | Why it matters | Validation method | Status |
|----------|---------------|-------------------|--------|
| Will platform engineers actually use a visual canvas for infrastructure design? | Core hypothesis | User interviews + usage data | UNVALIDATED |
| Do users trust auto-generated Terraform for production? | Provision adoption | User testing with real workloads | UNVALIDATED |
| What's the real onboarding friction? | Activation rate | Watch 10 users sign up and use | UNVALIDATED |
| Will users connect real cloud credentials? | Trust barrier | Test with read-only access first | UNVALIDATED |
| Do teams want a unified closed-source platform vs. open-source tools? | Willingness to pay | Pricing interviews | UNVALIDATED |

### Market Questions (Need Research)

| Question | Why it matters | Validation method | Status |
|----------|---------------|-------------------|--------|
| How many platform engineers exist in Brazil? | TAM sizing | LinkedIn + job board research | UNVALIDATED |
| What do they currently use? | Competitive landscape | User interviews | UNVALIDATED |
| Is "visual infrastructure" a real category? | Positioning | Market research | UNVALIDATED |
| What's the right trial length? | Conversion optimization | A/B test 7 vs 14 vs 30 days | UNVALIDATED |

### Product Questions (Need Decisions)

| Question | Why it matters | Validation method | Status |
|----------|---------------|-------------------|--------|
| Should the canvas be the primary interface? | Product direction | A/B test onboarding flows | UNVALIDATED |
| How much AI is enough? | Feature scope | Usage data on AI features | UNVALIDATED |
| Should we support Pulumi in addition to Terraform? | Technical scope | User demand signals | UNVALIDATED |
| Is template marketplace valuable? | Growth mechanism | User research | UNVALIDATED |

### Business Questions (Need Decisions)

| Question | Why it matters | Validation method | Status |
|----------|---------------|-------------------|--------|
| When to incorporate? | Legal structure | Legal counsel | DECIDE SOON |
| Domain name? | Brand | Available check | DECIDE NOW |
| Content language? | Distribution | Founder preference | DECIDE NOW |
| Community platform? | Engagement | Developer preference | DECIDE NOW |
| Stripe vs. other billing? | Revenue | Industry standard | DECIDE SOON |

### Technical Questions (Need Testing)

| Question | Why it matters | Validation method | Status |
|----------|---------------|-------------------|--------|
| Can we scale the canvas to 500+ nodes? | Performance | Load testing | UNVALIDATED |
| Is the Go engine production-ready? | Reliability | Real cloud execution testing | UNVALIDATED |
| Should we move from Docker Compose to Kubernetes? | Scalability | Traffic analysis | UNVALIDATED |
| How do we handle Terraform state in production? | Production readiness | Architecture review | UNVALIDATED |

## How to Use This Document

1. **Check before building** — If a question blocks a feature, validate it first
2. **Prioritize by impact** — High-impact questions get validated first
3. **Assign owners** — Each question should have a DRI
4. **Update status** — Mark as VALIDATED/INVALIDATED when answered
5. **Delete answered questions** — Keep the document clean
