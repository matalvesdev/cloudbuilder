# Activation

> Status: Draft | Owner: Product | Last Updated: 2026-08-14

## Activation Definition

A user is activated when they complete the core value loop: **Design → Generate → Provision**. This proves they understand the product and have received real value.

## Activation Stages

### 1. Account Created
- **Event:** User signs up (email + password)
- **What happens:** User sees empty canvas with onboarding hints
- **Success:** User lands on canvas view
- **Failure:** User bounces immediately
- **Target:** > 80% of signups reach this stage

### 2. First Design
- **Event:** User places 2+ resources on canvas and connects them
- **What happens:** User experiences the visual design workflow
- **Success:** User understands drag-drop-connect paradigm
- **Failure:** User doesn't understand how to use canvas
- **Target:** > 50% of signups reach this stage

### 3. First Generation
- **Event:** User generates Terraform code from canvas
- **What happens:** User sees generated HCL code
- **Success:** User understands that visual design produces real code
- **Failure:** User doesn't find the generate button or doesn't understand the output
- **Target:** > 40% of signups reach this stage

### 4. First Provision (AHA MOMENT)
- **Event:** User provisions real cloud infrastructure
- **What happens:** User sees their design become running infrastructure
- **Success:** User sees resources in their cloud console
- **Failure:** Provision fails, credentials don't work, user doesn't trust the process
- **Target:** > 20% of signups reach this stage

### 5. First Return
- **Event:** User comes back after first provision
- **What happens:** User modifies their design or provisions new infrastructure
- **Success:** User has a reason to return
- **Failure:** User doesn't see ongoing value
- **Target:** > 40% of provisioned users return within 7 days

## Aha Moment

**"I designed this visually, and now it's real infrastructure."**

This is the moment when the user understands the core value proposition: visual design → real infrastructure. Everything before this is setup. Everything after this is retention.

### How to measure

- Time from signup to first provision
- User behavior after first provision (do they modify? provision more? invite team?)
- Qualitative feedback after first provision

## Technical Activation vs. Product Activation

| Type | Definition | Measurement |
|------|-----------|------------|
| **Technical** | User has account and can use the tool | Account created + first canvas interaction |
| **Product** | User received value from the product | First provision completed |
| **Business** | User demonstrated intent to pay | Multiple provisions + team invitation |

## Anti-Patterns

| Anti-Pattern | Why it's wrong | What to do instead |
|-------------|---------------|-------------------|
| Counting "account created" as activation | Account ≠ value | Measure first provision |
| Measuring "time in app" | Time ≠ value | Measure successful actions |
| Measuring "features used" | Features ≠ value | Measure core loop completion |
| Requiring setup before value | Setup blocks activation | Show value before asking for setup |

## Onboarding Flow

### Current (Broken)
1. Sign up → Empty canvas → ???

### Target
1. Sign up → Welcome screen with template options
2. Choose template (or start blank)
3. Guided tour: "Drag a resource → Connect → Configure"
4. Generate code → See output
5. Connect credentials → Preview plan
6. Provision → See running infrastructure
7. "What's next?" → Observe, optimize, invite team

## Metrics

| Metric | Definition | Target |
|--------|-----------|--------|
| Time to first provision | Minutes from signup to provision | < 30 min |
| Activation rate | % reaching first provision | > 20% |
| Day 1 retention | % returning same day | > 50% |
| Day 7 retention | % returning within 7 days | > 40% |
| Day 30 retention | % returning within 30 days | > 25% |
| Invite rate | % who invite team members | > 20% |

## Experiments

| Experiment | Hypothesis | Metric | Duration |
|-----------|-----------|--------|----------|
| Template-first onboarding | Starting with a template reduces time to first provision | Time to provision | 2 weeks |
| Demo mode (no credentials) | Showing the workflow without requiring credentials increases activation | Activation rate | 2 weeks |
| Guided tour | Step-by-step guidance reduces confusion | First generation rate | 2 weeks |
| Pre-configured GCP project | Reducing credential setup friction increases first provision | First provision rate | 2 weeks |
