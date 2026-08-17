# Jobs To Be Done

> Status: Draft | Owner: Product | Last Updated: 2026-08-14

## Format

> When [situation], I want to [motivation], so I can [outcome].

## Primary JTBDs

### 1. Design Infrastructure Visually

> When I'm designing a new service architecture, I want to visually lay out the infrastructure components and their relationships, so I can communicate the design to my team and catch gaps before coding.

**Functional job:** Create a visual representation of infrastructure
**Emotional job:** Feel confident about the design before implementation
**Social job:** Be seen as a competent architect by my team

**Current solution:** Miro/Lucidchart + manual documentation
**Pain:** Design doesn't connect to execution, becomes outdated immediately
**CloudBuilder value:** Design is executable, stays in sync with reality

### 2. Generate Production-Ready Code

> When my design is approved, I want to generate production-ready Terraform code automatically, so I don't spend hours translating diagrams into HCL.

**Functional job:** Convert visual design to executable code
**Emotional job:** Feel confident the code is correct and follows best practices
**Social job:** Be seen as efficient and productive

**Current solution:** Manually writing Terraform
**Pain:** Time-consuming, error-prone, inconsistent across team
**CloudBuilder value:** Automatic generation with provider-aware best practices

### 3. Provision Safely

> When I'm ready to deploy, I want to preview what will be created/changed/destroyed, then execute with the right credentials and policies, so I can deploy safely without manual CLI steps.

**Functional job:** Execute infrastructure changes safely
**Emotional job:** Feel in control of the deployment process
**Social job:** Be seen as reliable and careful with production

**Current solution:** terraform plan → terraform apply via CLI
**Pain:** Manual steps, easy to make mistakes, no audit trail
**CloudBuilder value:** Preview → approve → execute with full audit

### 4. Monitor What's Running

> When infrastructure is running, I want to see its health, cost, and configuration status, so I can detect and resolve issues proactively.

**Functional job:** Understand infrastructure state
**Emotional job:** Feel in control of operations
**Social job:** Be seen as proactive, not reactive

**Current solution:** Multiple dashboards, spreadsheets, manual checks
**Pain:** Fragmented, time-consuming, easy to miss issues
**CloudBuilder value:** Unified view with drift detection and cost tracking

### 5. Optimize Cost

> When reviewing cloud spend, I want to see cost attribution per resource and per environment, so I can optimize without guessing.

**Functional job:** Understand and reduce cloud costs
**Emotional job:** Feel responsible with company resources
**Social job:** Be seen as cost-conscious

**Current solution:** AWS Cost Explorer + monthly reports
**Pain:** No design-time visibility, hard to attribute costs
**CloudBuilder value:** Cost estimation on canvas, tracking after provisioning

## Secondary JTBDs

### 6. Onboard New Team Members

> When a new engineer joins, I want them to understand our infrastructure quickly, so they can contribute without extensive hand-holding.

**Current solution:** Documentation + shadowing + trial and error
**CloudBuilder value:** Visual designs are self-documenting

### 7. Import Existing Infrastructure

> When I first use CloudBuilder, I want to import my existing infrastructure into the canvas, so I can start managing it without rebuilding.

**Current solution:** Manual recreation or separate tools
**CloudBuilder value:** Import from Terraform state, cloud discovery

### 8. Collaborate on Designs

> When working with my team, I want to review and comment on infrastructure designs, so we can make better decisions together.

**Current solution:** Meetings + Slack + email
**CloudBuilder value:** Real-time collaboration on canvas

### 9. Enforce Policies

> When someone proposes infrastructure changes, I want to validate them against our policies automatically, so we catch compliance issues before deployment.

**Current solution:** Manual review + tribal knowledge
**CloudBuilder value:** OPA policies validate automatically

### 10. Track Changes

> When something changes in production, I want to understand what changed, who changed it, and why, so I can diagnose issues quickly.

**Current solution:** Git history + manual logs
**CloudBuilder value:** Full audit trail with canvas versioning

## Emotional Jobs

| Job | Why it matters |
|-----|---------------|
| **Feel in control** | Infrastructure is complex; users need to feel they understand it |
| **Feel competent** | Using CloudBuilder should make users feel better at their job |
| **Feel safe** | Infrastructure changes are risky; users need confidence |
| **Feel efficient** | Time saved is value delivered |
| **Feel informed** | Visibility into cost, health, and status builds trust |

## Social Jobs

| Job | Why it matters |
|-----|---------------|
| **Be seen as competent** | Using good tools reflects well on the user |
| **Be seen as responsible** | Cost consciousness and safety are valued |
| **Be seen as productive** | Shipping faster is valued |
| **Be seen as collaborative** | Sharing designs and involving team is valued |
| **Be seen as modern** | Using visual tools signals modern practices |

## Anti-JTBDs

| Job | Why it's not our job |
|-----|---------------------|
| Replace my DevOps engineer | We augment, not replace |
| Manage my Kubernetes clusters | We manage resources, not clusters |
| Deploy my applications | We manage infrastructure, not apps |
| Replace my CI/CD pipeline | We complement, not replace |
| Be my cloud provider | We orchestrate, not host |
