# AI Strategy

> Status: Draft | Owner: Product + Engineering | Last Updated: 2026-08-14

## Principle

**AI is a capability layer, not the core product.** CloudBuilder's value is visual infrastructure design → execution → observability. AI enhances this workflow; it doesn't replace it.

**Test:** If we removed "AI" from the marketing, would CloudBuilder still have value? Yes — the canvas, code generation, and provisioning are valuable without AI. AI makes it better, not essential.

## Current AI Implementation

### AIOps Module (Functional)

| Capability | Status | How it works |
|-----------|--------|-------------|
| Natural language query | ✅ Working | User asks question → backend parses intent → returns structured answer |
| Anomaly detection | ✅ Working | Statistical analysis on metrics data → flags deviations |
| Log pattern analysis | ✅ Working | Pattern matching on log entries → groups similar entries |

### AI Architecture

```
User → AIOpsController (/api/v1/aiops/query)
     → MetricsAnomalyService (statistical anomaly detection)
     → LogAnalysisService (pattern analysis)
     → Response
```

Currently: Rule-based + statistical methods. No LLM integration yet.

## AI Opportunities (Ranked by Value)

### Tier 1: High Value, Near-term

| Opportunity | User Problem | AI Role | Risk |
|------------|-------------|---------|------|
| **Architecture recommendations** | "Is this design good?" | Analyze canvas topology → suggest improvements | Hallucination, bad advice |
| **Terraform code review** | "Is this Terraform safe?" | Parse HCL → identify issues, security, cost | False positives |
| **Cost estimation improvement** | "What will this cost?" | Better pricing models, spot recommendations | Inaccurate data |

### Tier 2: Medium Value, Medium-term

| Opportunity | User Problem | AI Role | Risk |
|------------|-------------|---------|------|
| **Natural language → canvas** | "Design a VPC with 3 subnets" | NL → structured canvas design | Wrong interpretation |
| **Drift explanation** | "Why did this change?" | Correlate changes with events | Wrong attribution |
| **Incident root cause** | "Why is this down?" | Analyze logs + metrics + changes | Wrong diagnosis |
| **Policy generation** | "Block public databases" | NL → OPA/Rego policy | Security implications |

### Tier 3: High Value, Long-term

| Opportunity | User Problem | AI Role | Risk |
|------------|-------------|---------|------|
| **Autonomous optimization** | "Reduce my cloud cost" | Detect waste → recommend → auto-apply with approval | Unintended consequences |
| **Predictive scaling** | "This will need more capacity" | Analyze trends → predict → recommend | False predictions |
| **Self-healing infrastructure** | "Fix this automatically" | Detect issue → plan fix → execute with approval | Destructive actions |

## AI Architecture (Target)

```
User Intent
  ↓
Intent Classification (simple model)
  ↓
┌─────────────────┬──────────────────┬─────────────────┐
│ Canvas AI       │ Provision AI     │ Ops AI          │
│ (design help)   │ (code review)    │ (diagnostics)   │
├─────────────────┼──────────────────┼─────────────────┤
│ Context Layer   │ Context Layer    │ Context Layer   │
│ (canvas state,  │ (terraform code, │ (metrics, logs, │
│  templates)     │  policies)       │  changes)       │
├─────────────────┼──────────────────┼─────────────────┤
│ Model Router    │ Model Router     │ Model Router    │
│ (cheap/simple → │ (reasoning →     │ (analysis →     │
│  complex)       │  code model)     │  synthesis)     │
└─────────────────┴──────────────────┴─────────────────┘
  ↓
Policy Engine (OPA — deterministic safety check)
  ↓
Human Approval (for actions)
  ↓
Execution (deterministic engine, not LLM)
```

## Key Design Decisions

### 1. LLM Never Executes Directly

```
LLM proposes → Policy engine validates → Deterministic engine executes
```

The LLM generates recommendations and plans. The actual execution is done by Terraform/OpenTofu, not by the LLM calling arbitrary APIs.

### 2. Structured Outputs Over Free Text

```json
{
  "action": "recommend_resize",
  "resource": "google_compute_instance.web",
  "current": "e2-medium",
  "recommended": "e2-small",
  "reason": "Average CPU utilization is 15% over 30 days",
  "confidence": 0.85,
  "estimated_savings": "$12/month",
  "risk": "low"
}
```

### 3. Context Engineering Over Prompt Engineering

The quality of AI output depends more on what context we provide than how we phrase the prompt. Focus on:
- Relevant infrastructure state
- Historical patterns
- Policy constraints
- Cost data
- User preferences

### 4. Evaluation-Driven Development

Every AI capability needs:
- Golden test scenarios
- Success/failure criteria
- Cost tracking (tokens, latency)
- Human review loop

## AI Cost Management

| Metric | Target |
|--------|--------|
| AI cost per successful task | < $0.05 |
| Token usage per query | < 2,000 |
| Latency (p95) | < 3 seconds |
| Human intervention rate | < 20% |

## AI Safety Rules

1. **Never execute destructive actions without approval**
2. **Never access customer credentials directly**
3. **Never make network calls to customer infrastructure**
4. **Always show reasoning before recommendations**
5. **Always allow human override**
6. **Always log AI decisions for audit**
7. **Never trust LLM output for security decisions**
8. **Policy engine is the authority, not the LLM**

## Model Strategy

### Near-term (No LLM)
- Statistical anomaly detection
- Pattern matching
- Rule-based recommendations
- These work today and are deterministic

### Medium-term (With LLM)
- Architecture analysis and recommendations
- Natural language → canvas design
- Terraform code review
- Incident root cause analysis

### Model Selection (When LLM is added)
| Task | Model Type | Why |
|------|-----------|-----|
| Classification | Cheap, fast | Simple intent recognition |
| Code generation | Coding model | Terraform/HCL generation |
| Analysis | Reasoning model | Complex infrastructure analysis |
| Explanation | General model | Natural language responses |

## What AI Should NOT Do

- Replace human judgment on destructive actions
- Access cloud credentials directly
- Make autonomous security decisions
- Generate infrastructure without policy validation
- Override user configuration
- Promise specific outcomes (cost savings, reliability)
- Replace documentation or communication

## Success Metrics

| Metric | Definition | Target |
|--------|-----------|--------|
| Task success rate | % of AI recommendations that are correct | > 80% |
| Human approval rate | % of recommendations approved by users | > 70% |
| Cost per task | Total AI cost / successful tasks | < $0.05 |
| Time saved | Minutes saved per AI-assisted task | > 5 min |
| User satisfaction | Survey rating of AI features | > 4/5 |
