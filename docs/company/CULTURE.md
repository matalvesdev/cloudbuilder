# Culture

> Status: Active | Owner: Founders | Last Updated: 2026-08-14

## How We Work

Culture isn't what we say. It's what we do when no one's watching.

### Principle: Ship > Perfect

**We do:** Ship small, working increments daily. Fix forward.

**We don't:** Wait for perfection. Hold PRs for days. Polish features nobody uses.

**Example:**
```
Good: Ship the provision endpoint with basic error handling. 
      Add detailed errors tomorrow after seeing real failures.

Bad:  Spend 2 weeks building the "perfect" error handling system
      before anyone has used the endpoint.
```

---

### Principle: Users > Features

**We do:** Talk to users before building. Watch them use the product. Measure outcomes.

**We don't:** Build features based on assumptions. Compete on feature count. Build what competitors have.

**Example:**
```
Good: "3 users asked for K8s support. Let's validate demand with 10 more."
Bad:  "Competitor X has K8s. We need it too."
```

---

### Principle: Simplicity > Cleverness

**We do:** Choose boring technology. Write clear code. Prefer fewer dependencies.

**We don't:** Use new frameworks for fun. Write clever one-liners. Add abstractions before needed.

**Example:**
```
Good: Use PostgreSQL foreign keys for the resource graph.
Bad:  Add a graph database because it's "more elegant."
```

---

### Principle: Evidence > Opinion

**We do:** Measure before deciding. A/B test. Check analytics. Run experiments.

**We don't:** Trust gut feeling. Debate without data. Assume we know what users want.

**Example:**
```
Good: "Let's test if templates reduce time-to-first-provision."
Bad:  "Templates are obviously the right approach."
```

---

### Principle: Own It > Pass It

**We do:** Investigate issues end-to-end. Fix what we find. Take responsibility for outcomes.

**We don't:** Say "not my module." Wait for someone else. Blame without investigating.

**Example:**
```
Good: "The provision endpoint is failing. Let me check the Go engine logs."
Bad:  "That's the Go team's problem."
```

---

### Principle: Write > Talk

**We do:** Document decisions. Write ADRs. Create runbooks. Update README.

**We don't:** Make decisions in Slack and forget them. Assume knowledge is shared. Leave tribal knowledge.

**Example:**
```
Good: Write an ADR explaining why we chose OPA over Cedar.
Bad:  Discuss in a meeting, forget the decision, debate again next month.
```

---

## Communication

### Asynchronous First
- Write it down before scheduling a meeting
- Use GitHub issues/PRs for technical discussions
- Use Discord for quick questions
- Meetings are for decisions, not updates

### Response Expectations
- **Urgent (production down):** Respond within 15 minutes
- **Important (blocking):** Respond within 4 hours
- **Normal:** Respond within 24 hours
- **Low priority:** Respond within 48 hours

### Meeting Principles
- Every meeting needs an agenda
- Every meeting ends with decisions + owners
- No recurring meetings without quarterly review
- Default to 30 minutes, not 60

## Decision Making

### Type 1 (Hard to Reverse)
- Architecture decisions
- Security changes
- Pricing changes
- Hiring decisions

**Process:** Write ADR → Discuss → Decide → Document

### Type 2 (Reversible)
- Feature prioritization
- UI changes
- Tool selection
- Process changes

**Process:** Discuss briefly → Decide → Ship → Measure → Adjust

### Default
When in doubt, treat it as Type 2. Ship faster, learn faster.

## Hiring (Future)

### First Hires (When Revenue Justifies)
1. **Full-stack engineer** — Can work across React + Java + Go
2. **Developer advocate** — Build community, create content
3. **Customer success** — Onboard users, collect feedback

### What We Look For
- Builder mentality (ships fast, learns fast)
- Full-stack capability (not just frontend or backend)
- User empathy (cares about outcomes, not output)
- Communication (writes well, explains clearly)
- Ownership (takes responsibility, doesn't pass)

### What We Don't Look For
- Resume prestige over capability
- "10 years of experience" over "built cool things"
- Specialists who can't work outside their domain
- People who wait for instructions

## Remote / Async

- **Documentation first** — Everything important is written down
- **Overlap hours** — 4-hour daily overlap for real-time collaboration
- **Focus time** — Protect deep work blocks
- **Transparency** — Default to sharing context widely
