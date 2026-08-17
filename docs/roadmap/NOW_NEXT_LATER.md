# Now / Next / Later

> Status: Active | Owner: Product | Last Updated: 2026-08-14

## NOW (This Week)

**Goal:** Fix critical bugs that block real usage.

| Item | Why now | Owner | Status |
|------|---------|-------|--------|
| Fix Terraform empty values | Users can't provision with empty templates | Engineering | ✅ DONE |
| Fix boot_disk image path | Generated Terraform is invalid | Engineering | ✅ DONE |
| Fix Observability JSONB types | Metrics/traces endpoints fail | Engineering | ✅ DONE |
| Add provision status dashboard | Users need visibility into execution | Engineering | NOT STARTED |
| Add cost estimation on canvas | Users need to understand cost before provisioning | Engineering | NOT STARTED |

### Fix 1: Terraform Empty Values ✅

**Problem:** Generated Terraform shows `name = ""` instead of actual values from canvas properties.

**Root Cause:** `CanvasDesignFetcherImpl.parseProperties()` tried to parse the entire nested JSON as `Map<String, String>`, failing silently.

**Fix:** Extract inner `properties` object from the nested JSON structure before passing to code generator.

**File:** `CanvasDesignFetcherImpl.java` — Updated `parseProperties()` to extract nested `properties` field.

### Fix 2: Boot Disk Image Path ✅

**Problem:** VM boot_disk shows `projects/${var.gcp_project_id}/global/images/family//` (double slash, no image family).

**Root Cause:** Template used `{{imageProject}}/{{imageFamily}}` which was never populated.

**Fix:** Changed to `{{bootDiskImage}}` variable so users provide the full image path (e.g., `debian-cloud/debian-11`).

**File:** `CodeGeneratorService.java` — Updated `google_compute_instance` template.

### Fix 3: Observability JSONB → TEXT ✅

**Problem:** Metrics, traces, logs, alert endpoints returned 500 errors.

**Root Cause:** V009 migration created columns as `JSONB`, but JPA entities map to `String` (TEXT). PostgreSQL rejects varchar → JSONB inserts.

**Fix:** Created V041 migration to alter all JSONB columns to TEXT.

**File:** `V041__fix_observability_jsonb_to_text.sql` — Alters 7 columns across 6 tables.

### Fix 4: Provision Status Dashboard

**Problem:** Users can't see terraform execution progress.

**Fix:** Add a status panel that shows: Initializing → Planning → Applying → Done/Failed.

**Estimated time:** 4 hours

### Fix 5: Cost Estimation on Canvas

**Problem:** Users don't know the cost before provisioning.

**Fix:** Show estimated monthly cost per resource on canvas nodes.

**Estimated time:** 4 hours

## NEXT (Next 30 Days)

**Goal:** Get 10 design partners using CloudBuilder for real infrastructure.

| Item | Why next | Dependencies | Owner |
|------|----------|-------------|-------|
| Recruit 10 design partners | Validate core hypothesis | Marketing | Founders |
| Add error recovery and rollback | Users need to handle failures | Foundation | Engineering |
| Import existing infrastructure | Users want to manage existing resources | Foundation | Engineering |
| Improve documentation | Users need to self-serve | Foundation | Engineering |
| Add more templates | Reduce time to first provision | Foundation | Engineering |

### Recruit Design Partners

**Target:** 10 platform engineers at Brazilian B2B SaaS startups.

**Channels:**
1. LinkedIn outreach (founder-led)
2. Discord community
3. Technical blog posts
4. Direct network

**Timeline:** 30 days

### Error Recovery and Rollback

**Problem:** If provisioning fails, users don't know how to recover.

**Fix:** Add retry mechanism, error messages with suggestions, and rollback capability.

**Estimated time:** 8 hours

### Import Existing Infrastructure

**Problem:** Users can't manage existing cloud resources.

**Fix:** Connect to cloud account, discover resources, import into canvas.

**Estimated time:** 16 hours

## LATER (30+ Days)

**Goal:** Activation and retention features.

| Item | Why later | Dependencies |
|------|----------|-------------|
| Observability auto-connect | Users need to see provisioned resources | Stage 1 |
| Drift detection dashboard | Users need to know when reality differs from design | Stage 1 |
| Approval gates | Production deployments need human approval | Stage 1 |
| Multi-environment support | Teams need dev/staging/prod | Stage 1 |
| Cost tracking per environment | FinOps visibility | Stage 1 |

## Decision Framework

When deciding what to work on:

1. **Does it block real usage?** → NOW
2. **Does it help get 10 design partners?** → NEXT
3. **Does it improve activation/retention?** → LATER
4. **Does it add new capabilities?** → LATER
5. **Does it improve aesthetics only?** → NEVER (for now)
