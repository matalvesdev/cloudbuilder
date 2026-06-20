# CloudBuilder Q3 2026 — Operations Architecture Design

**Author**: Principal Architect Agent (FAANg)
**Date**: 2026-06-19
**Status**: Draft for review
**Version**: 1.0

---

## 1. Executive Summary

Q3 2026 focuses on Operations — three pillars: observability, cost management, and audit/compliance.

**Design theme**: The schema.sql already defines 12 observability tables (partitioned). Sprint 9 is about creating the Java entities, services, and controllers that match the existing schema — the frontend UIs already exist and call `/observability/*` endpoints.

### Architecture Principles Applied
1. **Reuse over re-invent**: Strategy pattern (compliance), Modulith events (cost→observe), Specification pattern (audit queries)
2. **Same DB, partitioned**: PostgreSQL native range partitioning for time-series data — no new dependencies
3. **Scheduled over triggered**: Alert evaluation, SLO computation, budget checks, and compliance scans all use `@Scheduled` with fixed intervals — no callback/event chains for core operations
4. **Tenant isolation**: All new entities carry `tenantId`; `TenantFilter` reuses established pattern
5. **Audit everything**: Every mutation across all new services creates an AuditEvent

### Key Decisions Preview
| # | Decision | Rationale |
|---|----------|-----------|
| 1 | PostgreSQL native partitioning (not app-level) | Partition pruning, DETACH for archival, same DB |
| 2 | Custom composite anomaly detection (Z-score + trend-adjusted) | Balance of simplicity vs accuracy for cost data |
| 3 | Strategy pattern for compliance rules | Extensible, each rule type isolated |
| 4 | Modulith domain events for cross-module alerts | Loose coupling between cost and observe |
| 5 | Monthly partitions | Balance for 12-month retention, query fit |
| 6 | Spring Data Specifications for audit query | Type-safe dynamic filtering |
| 7 | Linear regression for cost projection | Simple, interpretable, sufficient for 90 data points |

### Sprint Overview

| Sprint | Theme | New Entities | New Services | New Endpoints |
|--------|-------|-------------|-------------|---------------|
| 9 | Observabilidade | 7 (AlertRule, Incident, Timeline, NotificationChannel, SLO, SLO Snapshot, Dashboard) | 5 (AlertEval, Incident, SLO, Notification, Dashboard) | 18 |
| 10 | Cost Management | 3 (Anomaly, Projection, BudgetAlert) | 3 (BudgetAlert, AnomalyDetection, CostProjection) | 7 |
| 11 | Audit & Compliance | 2 (ComplianceRule, ComplianceCheck) | 6 (AuditQuery, AuditExport, Compliance, 4 strategies) | 15 |
