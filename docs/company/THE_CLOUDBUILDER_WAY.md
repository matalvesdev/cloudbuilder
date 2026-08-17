# The CloudBuilder Way

> Status: Active | Owner: Founders | Last Updated: 2026-08-14

## How We Build

These aren't aspirational values. They're operational principles that guide daily decisions.

---

### 1. Customer Reality > Internal Opinion

**Meaning:** Our assumptions about what users need are hypotheses until validated by real usage. The codebase, user behavior, and direct conversations override our opinions.

**Expected behavior:**
- Check if users actually use a feature before building more of it
- Talk to users before designing solutions
- Measure activation and retention, not just output

**Prohibited behavior:**
- "Users will love this" without evidence
- Building features because competitors have them
- Assuming our usage patterns match users'

**Example:**
```
Bad:  "We need a Kubernetes module because every competitor has one."
Good: "3 of our 10 design partners asked for K8s. Let's validate demand."
```

---

### 2. Ship Small, Learn Fast

**Meaning:** Small, reversible changes beat large, speculative ones. Ship frequently, measure outcomes, iterate.

**Expected behavior:**
- Break large features into shipable increments
- Deploy to staging daily, production weekly
- Kill features that don't work

**Prohibited behavior:**
- 3-month projects without intermediate releases
- Perfection before shipping
- Feature branches that live for weeks

**Example:**
```
Bad:  "We'll release the AI copilot when it's perfect."
Good: "Ship basic NL query → measure usage → improve based on what users actually ask."
```

---

### 3. APIs Are Products

**Meaning:** Every API endpoint is a product contract. Design it for the consumer, version it carefully, document it thoroughly.

**Expected behavior:**
- Design API before implementation
- Consider the consumer's perspective
- Version breaking changes

**Prohibited behavior:**
- Changing API contracts without migration path
- Exposing internal implementation details
- Breaking changes without deprecation notice

**Example:**
```
Bad:  Renaming /canvases/{id}/generate to /canvases/{id}/terraform without notice.
Good: Adding /canvases/{id}/terraform, deprecating old endpoint with 30-day notice.
```

---

### 4. Automate Repetition

**Meaning:** If a human does it more than twice, automate it. But automate the right thing — the bottleneck, not the easy part.

**Expected behavior:**
- Automate testing, deployment, monitoring
- Automate repetitive infrastructure tasks
- Automate safety checks

**Prohibited behavior:**
- Automating before understanding the process
- Automating decisions that require human judgment
- Automation that hides important information

**Example:**
```
Bad:  "Let's automate the entire provisioning pipeline with no human approval."
Good: "Automate terraform init/plan, require human approval for apply."
```

---

### 5. Security Is Architecture

**Meaning:** Security isn't a feature added later — it's a fundamental architectural property. Multi-tenant isolation, credential encryption, and RBAC are core, not bolted on.

**Expected behavior:**
- Every new feature considers tenant isolation
- Credentials are encrypted at rest by default
- RBAC is enforced at the API layer

**Prohibited behavior:**
- "We'll add security later"
- Exposing credentials in logs or responses
- Bypassing tenant filters for convenience

**Example:**
```
Bad:  Adding a new query without tenantId scoping.
Good:  Adding tenantId filter as the first step of any new query.
```

---

### 6. Reliability Is Product

**Meaning:** Downtime and errors directly impact user trust. Reliability isn't an ops concern — it's a product feature.

**Expected behavior:**
- Design for failure (retry, fallback, graceful degradation)
- Monitor what users care about
- Fix reliability issues before adding features

**Prohibited behavior:**
- "It works on my machine" as production readiness
- Ignoring error rates
- Deploying without rollback capability

**Example:**
```
Bad:  "The provision endpoint sometimes times out, but it's not a priority."
Good:  "Provision timeout is P0 — users can't get value if it fails."
```

---

### 7. Developer Experience Matters

**Meaning:** The people who build CloudBuilder are our first users. Fast builds, clear errors, good tests, and simple setup are investments that compound.

**Expected behavior:**
- Fast CI/CD (under 10 minutes)
- Clear error messages
- Comprehensive test coverage
- Simple local development setup

**Prohibited behavior:**
- 30-minute build times
- Cryptic error messages
- "It works in CI but not locally"
- Complex setup requiring tribal knowledge

**Example:**
```
Bad:  "New engineers take 2 days to set up their environment."
Good: "New engineers run 'docker compose up' and have the full stack running."
```

---

### 8. Simplicity Compounds

**Meaning:** Simple systems are easier to understand, debug, and extend. Choose boring technology for known problems. Save innovation for where it differentiates.

**Expected behavior:**
- Use well-known libraries for common problems
- Prefer monolith over microservices until scale demands
- Choose clarity over cleverness

**Prohibited behavior:**
- Adding dependencies for trivial functionality
- Over-engineering for hypothetical scale
- Clever code that's hard to understand

**Example:**
```
Bad:  "Let's use a graph database for the resource relationship model."
Good:  "Let's use foreign keys and a recursive CTE for the resource graph."
```

---

### 9. Measure Before Scaling

**Meaning:** Don't optimize or scale what you haven't measured. Instrumentation first, optimization second.

**Expected behavior:**
- Add logging/metrics before optimization
- Profile before tuning
- Benchmark before assuming bottleneck

**Prohibited behavior:**
- Premature optimization
- Scaling architecture before validating product
- Adding caching without measuring cache hit rates

**Example:**
```
Bad:  "Let's add Redis caching to everything."
Good:  "Our database is slow on canvas load — let's profile and add targeted caching."
```

---

### 10. Own the Outcome

**Meaning:** Everyone owns the product, not just their component. If the provision pipeline fails, the frontend engineer who sees the error should help fix it.

**Expected behavior:**
- Investigate issues across the full stack
- Take responsibility for user-facing outcomes
- Collaborate across frontend/backend/infra

**Prohibited behavior:**
- "That's not my module"
- Blaming other services without investigation
- Waiting for someone else to fix user-facing issues

**Example:**
```
Bad:  "The provision endpoint is failing, but that's the Go team's problem."
Good:  "The provision endpoint is failing — let me check the logs and help fix it."
```

---

### 11. AI Is a Capability, Not a Feature Checkbox

**Meaning:** AI should materially improve the user experience, not just be a marketing bullet point. If a deterministic solution works, use it. AI is for tasks that genuinely benefit from language understanding or pattern recognition.

**Expected behavior:**
- Ask "Would AI materially improve UX?" before adding AI
- Use deterministic solutions where possible
- Measure AI cost per successful task

**Prohibited behavior:**
- Adding "AI-powered" to features that don't need AI
- Using LLM for tasks a simple regex handles
- Hiding AI failures from users

**Example:**
```
Bad:  "Let's use GPT to validate Terraform syntax — it's AI-powered!"
Good:  "Let's use 'terraform validate' for syntax, GPT for architecture review."
```

---

## Decision Framework

When facing a decision, ask:

1. **What would the user want?** (Customer reality)
2. **What's the smallest thing we can ship?** (Ship small)
3. **Is this secure by default?** (Security is architecture)
4. **Can we measure this?** (Measure before scaling)
5. **Who owns this outcome?** (Own the outcome)

If you can't answer all five, talk to the team before deciding.
