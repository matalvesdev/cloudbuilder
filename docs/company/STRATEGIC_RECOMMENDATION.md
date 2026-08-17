# Strategic Recommendation

> Status: Active | Last Updated: 2026-08-14

**If we were starting CloudBuilder today with this codebase, this is what we would do.**

## Founder Decisions (Locked In)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Geography** | Brazil first | Founder's network, same language/timezone |
| **Open-source** | Closed source | Protect IP, control distribution, enterprise readiness |
| **Pricing** | Tiered SaaS (Starter/Pro/Business/Enterprise) | Predictable, scales with value, enterprise-friendly |
| **Fundraising** | Bootstrap | Prove PMF before taking money, maintain control |

## Keep

1. **Canvas as core differentiator** — The visual architecture designer is genuinely unique. No competitor offers visual design → Terraform generation in a single environment.

2. **Multi-provider Terraform generation** — Supporting AWS, GCP, Azure, and K8s from a single canvas is powerful.

3. **Go provision engine** — Separating execution from the Java backend via gRPC is smart.

4. **Spring Modulith architecture** — The 30-module structure is well-organized. Don't break it into microservices prematurely.

5. **Strong test coverage** — 720+ backend + 312 frontend tests provide safety for rapid iteration.

6. **OPA policy engine** — Policy-as-code is the right approach for infrastructure governance.

7. **Docker Compose deployment** — Simple, reproducible, works.

## Fix

1. **End-to-end provision loop** — The most critical gap. Canvas → Terraform → Real cloud execution needs to work flawlessly. This is P0.

2. **Onboarding flow** — New users need a guided path from signup to first provision. Target: < 30 minutes.

3. **Free trial experience** — 14-day trial without credit card. Show value before asking for money.

4. **Error handling** — Provision failures, API errors, and edge cases need user-friendly messages.

5. **Documentation** — README, architecture docs, API docs for users and future team.

## Remove (or Deprioritize)

1. **Billing module (placeholder)** — Remove until we have paying customers.

2. **Marketplace module (prototype)** — Too early for an integration marketplace.

3. **Multi-region module** — Important long-term, but not for the first 100 users.

4. **SSO module (prototype)** — Enterprise feature. Not needed until enterprise customers.

5. **Blog module** — Content should live on a separate platform.

## Validate

1. **Will platform engineers use a visual canvas for infrastructure design?** — Core hypothesis.

2. **Is auto-generated Terraform good enough for production?** — Users need to trust the output.

3. **Do teams want a unified closed-source platform vs. open-source tools?** — Test willingness to pay.

4. **Will users connect real cloud credentials?** — Test with read-only access first.

## Build Next

1. **Guided onboarding** — Step-by-step wizard: "Connect → Design → Generate → Provision → Observe"

2. **Template library** — Pre-built architectures (VPC + Subnet + VM + DB) that users can start from.

3. **Provision status dashboard** — Real-time view of terraform execution with logs and progress.

4. **Cost estimation on canvas** — Show estimated monthly cost per resource as users design.

5. **Import existing infrastructure** — Connect to cloud account, discover resources, import into canvas.

## Do Not Build Now

- CI/CD pipeline management
- Kubernetes cluster management
- Log aggregation platform
- Mobile app
- Open-source distribution
- Generic AI chatbot
- Multi-cloud cost optimization
- Enterprise SSO/SCIM (until enterprise customers demand it)

## Pricing Recommendation

| Tier | Price | Resources | Users | Features |
|------|-------|-----------|-------|----------|
| **Free Trial** | $0 (14 days) | 10 | 1 | All Pro features |
| **Starter** | $79/mo | 50 | 3 | Canvas, code gen, provisioning |
| **Pro** | $299/mo | 200 | 10 | Everything + AI, policies, drift |
| **Business** | $799/mo | 500 | 25 | Everything + SSO, audit, support |
| **Enterprise** | Custom | Unlimited | Unlimited | Everything + SCIM, private, SLA |

## First Hire Recommendation

**Full-stack engineer (mid-level, R$15-22K/month + 0.5-1.0% equity).**

Why:
- Bottleneck is building, not distributing
- One engineer multiplies founders
- Full-stack is essential (React + Java + Go)
- Cheaper and more versatile than DevRel/Sales

## 90-Day Objective

**Complete the provision loop and get 10 design partners.**

- Week 1-2: Fix end-to-end provision with real GCP credentials
- Week 3-4: Improve onboarding, fix auto-save/delete persistence
- Week 5-8: Onboard 10 design partners, collect feedback
- Week 9-12: Iterate based on feedback, prepare for beta launch

## Biggest Opportunity

The **Design → Execute → Observe feedback loop**. If we can prove that visual design leads to better infrastructure outcomes, we have a compelling story for platform teams. The closed-source model means we own the data that makes AI recommendations better over time.

## Biggest Risk

**No real users.** All testing has been internal. The biggest risk is building a technically impressive product that nobody wants. Mitigation: get 10 design partners using CloudBuilder for real infrastructure within 30 days.
