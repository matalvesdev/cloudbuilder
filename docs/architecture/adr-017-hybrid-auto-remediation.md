# ADR-017: Hybrid Auto-Remediation with Confidence Tiers

**Status**: Implemented
**Date**: 2026-06-21
**Author**: Principal Architect Agent

## Context

CloudBuilder AIOps module (Sprint 15) already ships with:
- `LlmClient` interface (3 implementations: RuleBased, OpenAI, Anthropic)
- Incident classification (deterministic, keyword-based)
- RCA generation via LLM
- Context-aware chat with design state
- Metric analysis endpoint

As we enter Sprint 19 (Incident Intelligence), we need to extend beyond diagnosis into auto-remediation — automatically suggesting and executing fixes for common incidents.

## Problem

How to implement auto-remediation that is fast for known incidents, smart for novel ones, and safe enough to execute automatically without human supervision?

## Decision

### 1. Hybrid Architecture with 3 Tiers

**Chosen**: 3-tier confidence-based resolution pipeline — Tier 1 (rule-based, instant), Tier 2 (LLM-suggested, 3-10s), Tier 3 (manual, human).

**Alternatives considered**:
- Rule-based only (fast but misses novel patterns; infinite regression of rule maintenance)
- LLM-based only (flexible but 3-10s latency; cost per call; hallucination risk for execution commands)
- Single-engine with confidence threshold (no graceful degradation)

**Rationale**: 
- Tier 1 handles 80% of common incidents with zero latency
- Tier 2 handles 15% of novel incidents with LLM reasoning
- Tier 3 handles 5% of edge cases requiring human judgment
- Confidence score prevents dangerous auto-execution

**Resolution Flow**:
```
Incident Created
  → Tier 1: RuleBasedResolver (regex match, instant)
    ├── Match found (>90% confidence) → Auto-execute remediation
    └── No match → Tier 2

Tier 2: LLMResolver (3-10s)
  → LlmClient.suggestRemediation(incident context)
    ├── Confidence >80% → Auto-execute
    ├── Confidence 50-80% → Suggest to human (UI notification)
    └── Confidence <50% → Log only, Tier 3

Tier 3: Manual
  → Display LLM suggestion as free text in incident detail
  → Human operator executes manually
```

**Consequences**: 3 resolver implementations. Tier 2 may take 3-10s — cache results per incident type (Caffeine, 1h TTL).

### 2. RemediationAction Entity

**Chosen**: JPA entity tracking each remediation attempt.

```java
@Entity
@Table(name = "remediation_actions")
public class RemediationAction {
    @Id private String id;
    private String incidentId;
    private String actionType;      // RESTART, SCALE_UP, CLEAR_CACHE, RUNBOOK, CUSTOM
    @Column(columnDefinition = "TEXT")
    private String description;
    private String status;          // PENDING, RUNNING, COMPLETED, FAILED, ROLLED_BACK
    private String source;          // RULE_BASED, LLM_SUGGESTED, MANUAL
    private Double confidenceScore;
    private Instant executedAt;
    @Column(columnDefinition = "TEXT")
    private String result;
}
```

**Rationale**: Audit trail for every remediation action. Supports rollback tracking and post-mortem analysis.

**Consequences**: New table + entity. Every auto-remediation creates a record regardless of outcome.

### 3. Runbooks as Markdown (reuse DocsModule)

**Chosen**: Store runbooks as markdown files in `runbooks/` directory, scanned by existing `DocScannerService`.

**Alternatives considered**:
- Separate Runbook entity + table (duplicates doc infrastructure)
- LLM-generated runbooks (non-deterministic, can't be reviewed)
- Wiki-style editor (scope creep)

**Rationale**:
1. `DocScannerService` already scans `.md` files with frontmatter extraction — add `runbooks/` as a scan root
2. Runbooks are just operational documentation with structured frontmatter (title, tags, trigger, steps)
3. Frontmatter enables search by trigger condition
4. No new tables, no new scan logic — just a new directory

**Consequences**: Runbooks appear in DocsModule tree under a "Runbooks" section. New `RunbookService` facade queries `doc_metadata` for runbook-tagged documents.

### 4. Post-Mortem: Template-Based (not LLM)

**Chosen**: Post-mortem documents generated from template + incident data. Reuses `AutoDocService` pattern from ADR-009.

**Alternatives considered**:
- LLM-generated post-mortems (non-deterministic, expensive, overkill for structured report)
- Manual-only (low adoption rate)
- Third-party tool (PagerDuty, FireHydrant — external dependency)

**Rationale**: Post-mortems follow a standard structure (timeline, root cause, action items, severity). Templates ensure consistency. `AutoDocService` already generates ADR drafts from metadata — same approach.

**Template structure**:
```yaml
---
title: "Post-Mortem: {incident.title}"
date: "{incident.resolvedAt}"
severity: "{incident.severity}"
---
## Summary
{auto-generated from incident data}

## Timeline
{incident events in chronological order}

## Root Cause
{from incident analysis}

## Action Items
- [ ] {from auto-remediation suggestions}
```

**Consequences**: Post-mortems are deterministic markdown files in the docs module. Human-editável before finalization.

## Consequences

1. **3 new entities**: RemediationAction, Runbook (facade over doc_metadata), PostMortem
2. **3 new services**: RemediationService, RunbookService, PostMortemService
3. **Modified**: AIOpsController — add remediation/post-mortem endpoints
4. **Modified**: DocScannerService — add runbooks/ scan root
5. **Frontend**: AIOpsModule — add sub-tabs for "Auto-Remoção", "Runbooks", "Pós-Mortem"
6. **Zero new dependencies** — LlmClient already exists (ADR-013), Markdown parser already exists (DocsModule)

## References

- LlmClient.java: Interface for LLM calls (ADR-013)
- RemediationAction.java: New entity for remediation audit trail
- RemediationService.java: 3-tier resolution pipeline
- AutoDocService.java: Template-based document generation (ADR-009)
- DocScannerService.java: Markdown scanner with frontmatter extraction
- ADR-013: LLM Provider Abstraction & AI Chat Context
- ADR-009: Auto-Documentation Feature
