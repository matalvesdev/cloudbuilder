# ADR-016: GitOps Webhook Event-Driven Architecture

**Status**: Implemented
**Date**: 2026-06-21
**Author**: Principal Architect Agent

## Context

CloudBuilder's git module (`git/`, `github/`) currently supports repository scanning (GitScannerService), IaC detection (IaCDetector), pipeline generation, and GitHub OAuth. However, all scanning is trigger-on-demand — there is no webhook handling for automatic detection of code pushes.

As the platform scales to support GitOps workflows (Sprint 18 of Q4 2026), we need:

1. **Automatic trigger** — detect code pushes without manual "rescan" clicks
2. **Incremental scanning** — only scan changed files, not entire repos
3. **Pipeline auto-trigger** — push → scan → detect changes → suggest deployment

## Problem

How to receive external Git events (push, PR, tag) and propagate them through the system without polling overhead or tight coupling to GitHub's specific webhook format?

## Decision

### 1. Event-driven via Spring Modulith Events

**Chosen**: Webhook receiver controller → Spring `ApplicationEventPublisher` → domain services via `@TransactionalEventListener`.

**Alternatives considered**:
- Polling @Scheduled every 5 minutes (simple but wasteful; 15-min latency non-negotiable)
- Kafka for cross-module events (overkill for single-JVM; ADR-012 already uses Modulith events)
- Direct service-to-service calls (tight coupling between git and provision modules)

**Rationale**:
1. Spring Modulith events are already the cross-module pattern (used in budget alerts → observe, ADR-012)
2. Zero new dependencies — `ApplicationEventPublisher` is core Spring
3. `@TransactionalEventListener(phase = AFTER_COMMIT)` ensures events only fire after successful DB write
4. Async processing via `@Async` on listener methods prevents webhook HTTP thread blocking

**Consequences**: Two event classes needed — `GitPushEvent` and `GitScanCompleteEvent`. Services annotate listeners with `@TransactionalEventListener`.

### 2. GitHub Webhook with HMAC Verification

**Chosen**: `POST /api/v1/git/webhooks/github` endpoint with HMAC-SHA256 signature verification.

**Alternatives considered**:
- No signature verification (security risk — anyone could trigger scans)
- IP whitelist (GitHub IPs change, maintenance burden)
- OAuth2-only (requires user interaction, not suitable for automated webhooks)

**Rationale**:
1. GitHub sends `X-Hub-Signature-256` header — verify with shared secret stored in `application.yml`
2. HMAC verification is stateless and fast (single `mac.doFinal()` call)
3. Same approach works for GitLab (different header name, same HMAC concept)

**Consequences**: Webhook secret must be configured. No secret = 403 response. Webhook registration is done via GitHub API (reuse `GitHubApiClient`).

### 3. Polling Fallback

**Chosen**: `@Scheduled(fixedDelay = 900000)` — 15-minute polling for repos without webhook configured.

**Alternatives considered**:
- No fallback (repos without webhook never trigger — unacceptable)
- 5-minute polling (too aggressive for repos without active development)
- 60-minute polling (too slow for development feedback loop)

**Rationale**: 15 min balances freshness with API rate limits. GitHub allows 5000 REST API requests/hour — 4 requests/hour/repo is trivial.

**Consequences**: Repos with webhook get instant updates. Repos without webhook get updates within 15 min. Both converge on the same `GitPushEvent` flow.

### 4. Commit Visualization via REST (not GraphQL)

**Chosen**: `GET /api/v1/git/repos/{id}/commits` — REST endpoint returning commit list.

**Alternatives considered**:
- GitHub GraphQL API (more efficient for nested data but adds complexity)
- Webhook payload storage (commits already in webhook payload — store and serve)

**Rationale**: REST is consistent with all existing API endpoints. Webhook payloads already contain commit data (sha, message, author, timestamp) — store them and serve from local DB. No additional GitHub API calls needed for commit history.

**Consequences**: New `Commit` entity stores webhook data. Initial sync for existing projects loads last 30 commits via GitHub REST API.

## Event Flow

```
GitHub Push → POST /api/v1/git/webhooks/github
  → GitWebhookController.validateSignature() — HMAC-SHA256
  → GitWebhookService.processEvent(payload)
    → Parse push payload → Create Commit records
    → Publish GitPushEvent(repoId, commits, branch)
    → Handler: GitScannerService.onPushEvent()
      → Incremental scan (only changed files)
      → Update RepositoryScan status
      → Publish GitScanCompleteEvent(repoId, scanResult)
        → Handler: ProvisionService (suggest deployment)
        → Handler: ObserveService (update service map)
```

## Consequences

1. **3 new backend files**: `GitWebhookController.java`, `GitWebhookService.java`, `Commit.java`
2. **1 new event class**: `GitPushEvent.java`, `GitScanCompleteEvent.java`
3. **Modified**: `GitScannerService.java` — add `onPushEvent()` listener
4. **Frontend**: Git section in ProvisionModule (repo list, commit timeline, pipeline status)
5. **Zero new dependencies**
6. **Webhook registration**: via existing `GitHubApiClient`

## References

- GitScannerService.java: Existing scanner (incremental scan support)
- GitHubOAuthService.java: Existing OAuth service for API client
- GitWebhookController.java: New webhook receiver
- GitPushEvent.java: New domain event class
- ADR-012: Q3 Operations Architecture (Modulith events pattern)
- ADR-015: Marketplace Architecture (precedent for Q4 2026 decisions)
