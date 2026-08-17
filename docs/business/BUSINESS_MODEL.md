# Business Model

> Status: Active | Owner: Founders | Last Updated: 2026-08-14

## Model

**Closed-source SaaS with tiered pricing.**

CloudBuilder is proprietary software delivered as a managed cloud service. No open-source distribution.

## Why Closed-Source

1. **IP protection** — Visual canvas + code generation + provisioning is defensible IP
2. **Enterprise readiness** — Enterprises prefer closed-source for security/compliance
3. **Revenue control** — No forks competing on price
4. **Distribution control** — Can gate features and manage release cycle
5. **Valuation** — Closed-source SaaS commands higher multiples than open-core

## Value Metric

**Managed cloud resources per month.** The more resources CloudBuilder provisions and manages, the more value the customer receives, and the more they should pay.

Why this metric:
- Aligns with value delivered (more resources = more complexity = more value from management)
- Natural expansion path (teams add more resources over time)
- Predictable for customers (they know how many resources they have)
- Measurable and auditable

## Pricing Tiers

### Free Trial
- **Price:** $0 (14 days)
- **Resources:** 10
- **Users:** 1
- **Features:** All Pro features
- **Purpose:** Enable evaluation without friction
- **Limits:** Time-limited, no credit card required

### Starter
- **Price:** $79/month
- **Resources:** Up to 50
- **Users:** 3
- **Features:** Canvas, code generation, provisioning, basic observability
- **Purpose:** Small teams managing their first infrastructure
- **Target:** Solo/duo platform engineers

### Pro
- **Price:** $299/month
- **Resources:** Up to 200
- **Users:** 10
- **Features:** Everything in Starter + AI copilot, policies, drift detection, approvals, cost optimization
- **Purpose:** Platform teams managing production infrastructure
- **Target:** 10–50 person engineering teams

### Business
- **Price:** $799/month
- **Resources:** Up to 500
- **Users:** 25
- **Features:** Everything in Pro + SSO, audit export, priority support, custom policies
- **Purpose:** Growing companies with compliance requirements
- **Target:** 50–200 person engineering teams

### Enterprise
- **Price:** Custom (starting $2,500/month)
- **Resources:** Unlimited
- **Users:** Unlimited
- **Features:** Everything in Business + SCIM, private deployment, SLA, dedicated support, custom integrations
- **Purpose:** Large organizations with strict security and compliance needs
- **Target:** 200+ person engineering teams

## Unit Economics (Hypotheses)

| Metric | Hypothesis | Notes |
|--------|-----------|-------|
| **COGS per customer** | $15/month | Compute (container), database storage, AI tokens |
| **Gross margin** | 95% | SaaS-typical for closed-source |
| **Blended ARPU** | $350/month | Weighted across tiers |
| **CAC** | $300 | Content marketing + founder-led sales |
| **LTV** | $4,200 | 12-month retention at blended ARPU |
| **LTV:CAC ratio** | 14x | Healthy for SaaS |
| **Payback period** | 1 month | Fast payback |
| **Logo churn** | 3–5% monthly | Pre-PMF estimate |
| **Net revenue retention** | 110–130% | Driven by resource expansion |

## Revenue Streams

1. **Subscription revenue** (primary) — Monthly/annual plans based on resource tiers
2. **Usage overages** (secondary) — Per-resource charges beyond tier limits
3. **Professional services** (tertiary) — Onboarding, custom integrations, training
4. **Enterprise contracts** (future) — Custom pricing for large deployments

## Expansion Path

```
Free Trial → Starter → Pro → Business → Enterprise
              ↓          ↓         ↓
         More resources  More users  More features
```

Expansion triggers:
- **Team growth** → more users needed → upgrade tier
- **Infrastructure growth** → more resources → hit limits → upgrade tier
- **Compliance needs** → SSO, audit, SCIM → Business/Enterprise
- **AI adoption** → copilot usage → Pro tier

## Pricing Philosophy

1. **Never punish growth** — Upgrading should feel like a natural next step, not a penalty
2. **Value-aligned** — Price tracks with value delivered (more resources = more value)
3. **Transparent** — No hidden fees, clear overage pricing
4. **Generous trial** — 14-day full access without credit card
5. **Enterprise-flexible** — Custom pricing for large deployments

## Financial Projections (Hypotheses)

### Year 1 (Bootstrap)
- **Customers:** 50 paid (200 trial conversions)
- **MRR:** $17,500 (50 × $350 blended ARPU)
- **ARR:** $210,000
- **Burn:** $15,000/month (founders only)
- **Runway:** 14+ months at $210K ARR

### Year 2
- **Customers:** 200 paid (1,000 trial conversions)
- **MRR:** $70,000
- **ARR:** $840,000
- **Burn:** $30,000/month (2-3 hires)

### Year 3
- **Customers:** 500 paid (2,500 trial conversions)
- **MRR:** $175,000
- **ARR:** $2,100,000
- **Burn:** $60,000/month (5-8 hires)

## Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Users won't pay for closed-source | High | Free trial proves value before asking for money |
| Free tier too generous | Medium | Monitor conversion rates, adjust limits |
| Enterprise sales cycle too long | Medium | PLG motion for SMB, founder-led for enterprise |
| Competitor undercuts pricing | Low | Focus on value, not price; differentiation is visual + AI |
| No organic distribution | High | Content marketing + SEO + community building |
