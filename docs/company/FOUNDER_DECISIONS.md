# Founder Decisions

> Status: Active | Owner: Founders | Last Updated: 2026-08-14

## Decisions Made

| Decision | Choice | Date | Rationale |
|----------|--------|------|-----------|
| **Initial geography** | Brazil first | 2026-08-14 | Founder's network, same language/timezone, LGPD compliance |
| **Open-source** | Closed source (SaaS only) | 2026-08-14 | Protect IP, control distribution, enterprise readiness |
| **Fundraising** | Bootstrap | 2026-08-14 | Prove PMF before taking money, maintain control |

## Pending Decisions (Recommendations Below)

| Decision | Recommendation | Confidence |
|----------|---------------|------------|
| **Pricing philosophy** | Tiered SaaS (Starter/Pro/Business/Enterprise) | High |
| **First hire** | Full-stack engineer | High |

---

## Pricing Recommendation

### Why Tiered SaaS (Not Usage-Based)

Since CloudBuilder is closed-source, the pricing model needs to:

1. **Be predictable** — Customers want to know their bill before committing
2. **Scale with value** — More resources = more value = higher tier
3. **Reduce friction** — No surprise overages during evaluation
4. **Enable enterprise** — Custom pricing for large deployments

### Recommended Tiers

| Tier | Price | Resources | Users | Features |
|------|-------|-----------|-------|----------|
| **Starter** | $79/mo | Up to 50 | 3 | Canvas, code gen, provisioning, basic observability |
| **Pro** | $299/mo | Up to 200 | 10 | Everything + AI, policies, drift, approvals, cost optimization |
| **Business** | $799/mo | Up to 500 | 25 | Everything + SSO, audit export, priority support |
| **Enterprise** | Custom | Unlimited | Unlimited | Everything + SCIM, private deployment, SLA, dedicated support |

### Why Not Usage-Based

| Usage-Based Pros | Usage-Based Cons |
|-----------------|-----------------|
| Aligns with value | Hard to predict bill |
| Natural expansion | Customers may optimize to reduce usage |
| Pay for what you use | Revenue volatility |
| | Complex metering infrastructure |
| | Enterprise procurement hates variable costs |

### Why Not Seat-Based

| Seat-Based Pros | Seat-Based Cons |
|----------------|----------------|
| Predictable | Doesn't scale with infrastructure value |
| Simple to understand | Undercounts value for small teams with lots of resources |
| Common in SaaS | Doesn't align with value metric (resources) |

### Why Tiered + Overage

| Tiered + Overage Pros | Tiered + Overage Cons |
|----------------------|----------------------|
| Predictable base | Need metering |
| Natural expansion path | Overages can surprise |
| Enterprise-friendly | |
| Simple to communicate | |

### Unit Economics (Hypotheses)

| Metric | Hypothesis | Notes |
|--------|-----------|-------|
| **Starter ARPU** | $79/month | Entry point for small teams |
| **Pro ARPU** | $299/month | Core revenue driver |
| **Business ARPU** | $799/month | Expansion revenue |
| **Enterprise ARPU** | $2,500/month | Custom contracts |
| **Blended ARPU** | $350/month | Weighted average |
| **COGS per customer** | $15/month | Compute + DB + AI tokens |
| **Gross margin** | 95% | SaaS-typical |
| **CAC** | $300 | Content + community + founder-led |
| **LTV** | $4,200 | 12-month retention at blended ARPU |
| **LTV:CAC** | 14x | Healthy |
| **Payback** | 1 month | Fast payback |

---

## First Hire Recommendation

### Recommendation: Full-Stack Engineer

**Why:**
1. **Bottleneck is building** — The product needs more features, not more distribution
2. **One engineer multiplies founders** — Can own entire modules end-to-end
3. **Full-stack is essential** — React + Java + Go is the stack; specialist hires are premature
4. **Cheaper than DevRel/Sales** — $80-120K vs. $100-150K
5. **More versatile** — Can write code, fix bugs, improve DX, help with infrastructure

### When to Hire DevRel

**Trigger:** After 100+ GitHub stars or 50+ active users. DevRel is premature before product-market fit.

### When to Hire Sales

**Trigger:** After $10K MRR. Sales is premature before there's something to sell.

### Hiring Profile

**Full-Stack Engineer (First Hire)**

| Attribute | Requirement |
|-----------|------------|
| **Stack** | React + Java + Go (or willing to learn) |
| **Experience** | 3+ years full-stack |
| **Mindset** | Builder, ships fast, learns fast |
| **Communication** | Writes well, explains clearly |
| **Ownership** | Takes responsibility, doesn't pass |
| **Culture fit** | Aligns with THE_CLOUDBUILDER_WAY |

**What to look for:**
- Side projects or open-source contributions
- Experience with infrastructure/DevOps tools
- Comfort with ambiguity (startup environment)
- Ability to work across the full stack

**What to avoid:**
- Specialists who can't work outside their domain
- People who wait for instructions
- Resume prestige over capability
- "10 years of experience" without shipping

### Salary Range (Brazil)

| Level | Salary Range | Equity |
|-------|-------------|--------|
| Mid-level (3-5 years) | R$15-22K/month | 0.5-1.0% |
| Senior (5+ years) | R$22-30K/month | 1.0-2.0% |

**Recommendation:** Hire mid-level with strong growth potential. Better culture fit and cheaper than senior.

---

## Next Decisions to Make

| Decision | When to Decide | Recommendation |
|----------|---------------|---------------|
| **Incorporation** | Before first paying customer | Delaware (for future fundraising flexibility) |
| **Domain name** | Now | cloudbuilder.dev (developer signal) |
| **Content language** | Now | Both (PT-BR primary, EN secondary) |
| **Community platform** | Before launch | Discord (developer preference) |
| **Stripe vs. other billing** | Before first paying customer | Stripe (industry standard) |
