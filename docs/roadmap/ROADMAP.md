# Product Roadmap

> Status: Active | Owner: Product | Last Updated: 2026-08-14

## Stage 0: Foundation (Current)

**Objective:** Prove the core loop works end-to-end with real infrastructure.

| Capability | Status | Exit Criteria |
|-----------|--------|--------------|
| Canvas with ReactFlow | ✅ Done | Visual design, drag-drop, connections |
| Terraform code generation | ✅ Done | Generates valid HCL for GCP/AWS/Azure |
| Go provision engine | ✅ Done | terraform init/plan/apply/destroy |
| Credential management | ✅ Done | Encrypted storage, per-provider injection |
| Auto-save to backend | ✅ Done | Debounced 3s backend save |
| Delete persistence | ✅ Done | Auto-save handles persistence |
| End-to-end provision | ✅ Tested | Works with mock credentials |
| Onboarding wizard | ✅ Done | 5-step guided flow |
| README / Docs | ✅ Done | Company OS + architecture docs |

**Exit criteria:** ✅ A new user can sign up, design infrastructure, and provision it to GCP in < 30 minutes.

## Stage 1: Wedge (In Progress)

**Objective:** Get 10 design partners using CloudBuilder for real infrastructure.

| Capability | Status | Priority | Notes |
|-----------|--------|----------|-------|
| Fix Terraform empty values | 🟡 In Progress | P0 | Bug in CodeGeneratorService |
| Fix boot_disk image path | 🟡 In Progress | P0 | Template rendering issue |
| Provision status dashboard | 🔴 Not Started | P0 | Show terraform execution progress |
| Template library | ✅ Done | P0 | 3 starter templates in wizard |
| Cost estimation on canvas | 🔴 Not Started | P1 | Per-resource pricing display |
| Import existing infrastructure | 🔴 Not Started | P1 | Connect cloud, discover resources |
| Error recovery and rollback | 🔴 Not Started | P1 | Handle provision failures gracefully |
| Documentation site | ✅ Done | P1 | Company OS + docs/ |

**Exit criteria:** 10 design partners actively using CloudBuilder weekly.

## Stage 2: Activation

**Objective:** Users reach first value quickly and return.

| Capability | Dependencies | Priority |
|-----------|-------------|----------|
| Observability auto-connect | Stage 1 | P0 |
| Drift detection dashboard | Stage 1 | P0 |
| Approval gates | Stage 1 | P1 |
| Multi-environment support | Stage 1 | P1 |
| Cost tracking per environment | Stage 1 | P1 |
| Activity feed and audit | Stage 1 | P2 |

**Exit criteria:** > 30% of signups reach first provision. > 40% return in week 2.

## Stage 3: Retention

**Objective:** Create compounding value that makes leaving painful.

| Capability | Dependencies | Priority |
|-----------|-------------|----------|
| AI copilot (natural language → design) | Stage 2 | P0 |
| Drift auto-remediation | Stage 2 | P1 |
| Multi-environment promotion | Stage 2 | P1 |
| Template marketplace | Stage 2 | P2 |
| Team collaboration improvements | Stage 2 | P2 |

**Exit criteria:** NRR > 110%. Weekly active users growing.

## Stage 4: Monetization

**Objective:** Convert free users to paid.

| Capability | Dependencies | Priority |
|-----------|-------------|----------|
| Stripe billing integration | Stage 3 | P0 |
| Usage metering and enforcement | Stage 3 | P0 |
| Plan entitlements | Stage 3 | P0 |
| Enterprise features (SSO, SCIM) | Stage 3 | P1 |
| Invoice and payment management | Stage 3 | P1 |

**Exit criteria:** $10K MRR. > 5% free-to-paid conversion.

## Stage 5: Expansion

**Objective:** Grow beyond the initial wedge.

| Capability | Dependencies | Priority |
|-----------|-------------|----------|
| Autonomous infrastructure agent | Stage 4 | P1 |
| Cross-cloud optimization | Stage 4 | P1 |
| Marketplace ecosystem | Stage 4 | P2 |
| Private deployment option | Stage 4 | P2 |
| API and CLI | Stage 4 | P1 |

**Exit criteria:** $100K MRR. Expansion revenue > 20%.

## Now / Next / Later

### NOW (Next 7 days)
- Fix Terraform empty values bug (CodeGeneratorService)
- Fix boot_disk image path bug
- Add provision status dashboard
- Add cost estimation on canvas

### NEXT (8–30 days)
- Get 10 design partners (recruit from LinkedIn/Discord)
- Add error recovery and rollback
- Add import existing infrastructure
- Improve documentation

### LATER (30+ days)
- Observability auto-connect
- Drift detection dashboard
- Approval gates
- Multi-environment support

## Progress Log

| Date | Milestone | Status |
|------|-----------|--------|
| 2026-08-14 | Company OS documentation created | ✅ |
| 2026-08-14 | Auto-save to backend implemented | ✅ |
| 2026-08-14 | Delete persistence fixed | ✅ |
| 2026-08-14 | Connection validation rules added | ✅ |
| 2026-08-14 | ProvisionPanel uses real Go engine | ✅ |
| 2026-08-14 | Onboarding wizard built | ✅ |
| 2026-08-14 | E2E provision loop validated | ✅ |
| 2026-08-14 | Canvas cleared after provision | ✅ |
| 2026-08-14 | Founder decisions locked in | ✅ |
| 2026-08-14 | Pricing model defined | ✅ |
| 2026-08-14 | First hire recommendation | ✅ |
