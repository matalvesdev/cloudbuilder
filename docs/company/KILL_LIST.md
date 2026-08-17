# Kill List

> Status: Active | Owner: Founders | Last Updated: 2026-08-14

Things we deliberately choose NOT to build right now. This is as important as the roadmap.

## Do Not Build

| Item | Why not now | When to revisit |
|------|-----------|----------------|
| **Custom Kubernetes distribution** | Not our domain, massive scope | Never (unless K8s becomes core to product) |
| **Full CI/CD pipeline** | We generate infrastructure, not deploy apps | When users request it AND it aligns with wedge |
| **Generic AI chatbot** | AI is infrastructure-specific, not a general assistant | Never |
| **Mobile app** | Infrastructure work is desktop-first | When users request it |
| **Every cloud provider** | Prove one cloud well before expanding | After GCP + AWS are production-ready |
| **Log aggregation platform** | Integrate with existing tools, don't replace them | When we have observability traction |
| **Custom Terraform provider** | Too much scope, use existing providers | When we have unique integration needs |
| **Real-time collaboration editing** | Nice-to-have, not core value | After core workflow is proven |
| **Marketplace for community templates** | No community yet | After 100+ active users |
| **Enterprise SSO/SCIM** | No enterprise customers yet | After first enterprise request |
| **Multi-region deployment** | Too complex for early stage | After Stage 2 (Activation) |
| **Self-hosted Kubernetes deployment** | Docker Compose works for now | After enterprise demand |
| **Custom billing system** | Use Stripe, not build | After first paying customer |
| **Custom analytics platform** | Use PostHog/Mixpanel, not build | After product-market fit |
| **Native desktop app** | Web app is sufficient | When users request it |
| **Browser extension** | Not core value | Never (unless strong use case) |
| **Terraform Cloud replacement** | Too broad, we're visual-first | Never (we complement, not replace) |
| **Multi-cloud cost optimization** | Too broad for early stage | After cost module is proven |
| **Custom DNS management** | Out of scope | Never |
| **Certificate management** | Out of scope | Never |
| **Secret rotation automation** | Nice-to-have, not core | After security features are mature |

## Not Now (But Maybe Later)

| Item | Why not now | Revisit trigger |
|------|-----------|----------------|
| **Pulumi support** | Terraform is sufficient, Pulumi adds complexity | 5+ users request it |
| **Azure DevOps integration** | GitHub is primary, Azure DevOps is niche | Enterprise customer requests |
| **GitLab integration** | GitHub covers most users | Community demand |
| **Bitbucket integration** | Small market share | Community demand |
| **Custom policy language** | OPA/Rego is sufficient | OPA limitations hit real use cases |
| **Webhook-based triggers** | Manual provisioning is fine for now | Automation demand |
| **Scheduled provisioning** | Not a common need | User requests |
| **Cost anomaly alerts** | Basic cost tracking is enough for now | After cost module matures |
| **Automated remediation** | Too risky for early stage | After drift detection is proven |
| **Custom dashboard builder** | Pre-built dashboards are sufficient | Enterprise demand |

## Anti-Features

Features that would actively harm the product if built:

| Feature | Why it's harmful |
|---------|-----------------|
| **"AI writes all your Terraform"** | Removes user understanding and control |
| **"One-click deploy everything"** | Hides consequences of infrastructure changes |
| **"No code needed"** | Lying — Terraform is still generated and used |
| **"Fully autonomous operations"** | Too risky for infrastructure, destroys trust |
| **"Replace your DevOps team"** | Wrong positioning, alienates our users |
| **"Works with any cloud instantly"** | Overpromising, dilutes quality |
| **"Enterprise-ready on day one"** | Not true, would damage credibility |

## How to Use This List

When someone suggests a new feature:

1. Check this list first
2. If it's here, explain why we're not building it
3. If it's not here, evaluate against our wedge and priorities
4. If it doesn't serve the wedge, add it here

The goal is focus. Every feature we build is a feature we maintain, support, and explain. Build only what proves our thesis.
