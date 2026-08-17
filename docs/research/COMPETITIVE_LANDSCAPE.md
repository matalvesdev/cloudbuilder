# Competitive Landscape

> Status: Draft | Owner: Product | Last Updated: 2026-08-14

## Competitive Categories

CloudBuilder sits at the intersection of several categories. No single competitor addresses the full workflow.

### 1. Infrastructure as Code (IaC)

| Tool | Type | Strength | Weakness | CB Differentiation |
|------|------|----------|----------|-------------------|
| **Terraform/OpenTofu** | CLI/Library | Industry standard, large ecosystem | Steep learning curve, no visual | Visual design + automatic generation |
| **Pulumi** | CLI/Library | Real programming languages | Complex, no visual | Visual interface + multi-language |
| **AWS CDK** | Library | AWS-native, good DX | Provider-specific, no visual | Multi-provider + visual |
| **Crossplane** | Kubernetes | K8s-native, declarative | K8s required, complex setup | No K8s requirement + visual |

### 2. Visual Infrastructure Tools

| Tool | Type | Strength | Weakness | CB Differentiation |
|------|------|----------|----------|-------------------|
| **Brainboard** | Visual design | Beautiful UI, multi-cloud | No execution, design-only | Execution + Terraform generation |
| **Eraser** | Documentation | Great diagrams, markdown | Documentation only, no execution | Execution + live infrastructure |
| **Miro/Lucidchart** | Whiteboard | Collaboration, flexibility | Not infrastructure-specific | Infrastructure-specific + executable |

### 3. Platform Engineering

| Tool | Type | Strength | Weakness | CB Differentiation |
|------|------|----------|----------|-------------------|
| **Backstage** | Developer portal | Extensible, CNCF | Catalog only, no creation | Creation + execution |
| **Port** | Developer portal | Self-service, UI | Abstraction layer, not visual design | Visual design + code transparency |
| **Humanitec** | Platform orchestrator | Dynamic configs, maturity | Complex, not visual | Visual interface + simplicity |
| **Qovery** | PaaS | Easy deployment | Limited infrastructure control | Full infrastructure control |

### 4. Cloud Management

| Tool | Type | Strength | Weakness | CB Differentiation |
|------|------|----------|----------|-------------------|
| **Datadog** | Observability | Comprehensive monitoring | Expensive, no design/execution | Design + execution + monitoring |
| **CloudZero** | FinOps | Cost allocation, insights | Cost only, no design/execution | Full lifecycle |
| **Vantage** | FinOps | Multi-cloud cost | Cost only | Design + execution + cost |

### 5. AI Infrastructure Tools

| Tool | Type | Strength | Weakness | CB Differentiation |
|------|------|----------|----------|-------------------|
| **Kubiya** | AI agent | Natural language ops | Chat-only, no visual design | Visual design + execution |
| **Firefly** | AI discovery | Cloud asset discovery | Discovery only, no creation | Creation + execution |
| **env0** | IaC management | GitOps, policy | No visual design, no AI | Visual design + AI |

## Competitive Positioning Map

```
                    Visual Design
                         ↑
                         |
    Brainboard ●         |         ● CloudBuilder
    Miro ●               |
                         |
  Design Only ←─────────┼─────────→ Execute + Observe
                         |
    Eraser ●             |         ● Terraform
                         |         ● Pulumi
                         |
                         ↓
                    Code Only
```

## Alternative Landscapes

The biggest competitor is often the status quo:

### Alternative 1: "Manual Terraform + CLI"
```
Engineer writes Terraform → terraform plan → terraform apply → 
manual verification → manual monitoring → manual cost tracking
```
**Pain:** Slow, error-prone, no visual overview, tribal knowledge

### Alternative 2: "Console + Scripts + Slack"
```
AWS Console for resources → custom scripts for automation → 
Slack for communication → spreadsheets for costs
```
**Pain:** Fragmented, unscalable, no single source of truth

### Alternative 3: "Consultant + Ticket System"
```
Dev team submits ticket → consultant designs → consultant provisions → 
Dev team requests changes → consultant updates
```
**Pain:** Slow, expensive, knowledge gap, dependency

## Competitive Advantages

### Sustainable
1. **Visual → Executable pipeline** — No competitor combines visual design with real execution
2. **Multi-cloud abstraction** — Design works across providers without vendor lock-in
3. **Code transparency** — Users see and control generated code
4. **Feedback loop** — Design → Execute → Observe → Optimize creates compounding value

### At Risk
1. **Brainboard** could add execution capabilities
2. **Terraform** could add visual design (unlikely given HashiCorp's focus)
3. **Cloud providers** could launch native visual design tools
4. **AI commoditization** could reduce the value of our AI features

## Competitive Response Strategy

| Scenario | Response |
|----------|---------|
| Brainboard adds execution | Accelerate our observability + AI features |
| Terraform adds visual | Emphasize multi-cloud + AI + simplicity |
| AWS launches visual tool | Emphasize multi-cloud + open source + community |
| New AI tool emerges | Integrate as capability, not compete as product |
| Enterprise competitor appears | Focus on SMB, PLG motion, open source trust |

## Research Questions

1. Do platform engineers actually want visual design, or do they prefer code?
2. What's the switching cost from Terraform to a visual tool?
3. How do teams currently handle multi-cloud infrastructure?
4. What's the adoption barrier for connecting cloud credentials?
5. Do teams want AI in their infrastructure workflow, or is it a gimmick?
