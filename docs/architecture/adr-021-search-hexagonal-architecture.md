# ADR-021: Search Module — Hexagonal Architecture Refactoring

**Status**: Proposed
**Date**: 2026-06-21
**Author**: Backend Agent

## Context

The Search module (`com.cloudbuilder.search`) was built as a minimal proof-of-concept with:

- `GlobalSearchService` (in `domain/service/`) containing both an inner `SearchProvider` interface and an inner `SearchResult` static class
- `SearchController` (in `infrastructure/web/`) calling the service directly
- No domain model separation — `SearchResult` is tightly coupled to the service implementation
- No dedicated domain port interfaces — `SearchProvider` is defined inside the service class

This violates the hexagonal architecture pattern established by all other CloudBuilder modules (design, provision, iam, etc.), where each module has clear separation between:

| Layer     | Package           | Responsibility        |
|-----------|-------------------|-----------------------|
| Domain    | `domain/model/`   | Entities + Value Objects |
| Domain    | `domain/port/`    | Repository + Provider interfaces |
| Domain    | `domain/service/` | Business logic        |
| Application | `application/dto/` | Request/Response DTOs |
| Infrastructure | `infrastructure/` | Controllers + adapters |

## Problem

How to refactor the Search module to follow the established hexagonal architecture without breaking existing consumers or introducing unnecessary complexity for a module that currently has a single implementation?

## Decision

### 1. Extract `SearchResult` to `domain/model/`

Move the inner class `GlobalSearchService.SearchResult` to its own top-level class in `domain/model/`:

```
domain/model/
├── SearchResult.java    # Extracted from inner class
```

The `SearchResult` class remains structurally identical — it is a value object with `id`, `title`, `description`, `module`, `resourceType`, `resourceId`, and `score` fields, plus a constructor and getters.

### 2. Extract `SearchProvider` to `domain/port/`

Move the inner interface `GlobalSearchService.SearchProvider` to its own file in `domain/port/`:

```
domain/port/
├── SearchProvider.java  # Extracted from inner interface
```

The interface retains its two methods:
- `List<SearchResult> search(String query, String tenantId, int maxResults)`
- `String getModuleName()`

### 3. Refactor `GlobalSearchService` to use extracted types

Update `GlobalSearchService` to:
- Reference `SearchResult` from `domain/model/` instead of its own inner class
- Reference `SearchProvider` from `domain/port/` instead of its own inner interface
- Remove the now-redundant inner definitions

### 4. Module-level event integration (future)

For cross-module search, modules should publish domain events (e.g., `CanvasCreatedEvent`, `DeploymentCompletedEvent`) that a search indexer consumes. This avoids direct module-to-module coupling and aligns with Spring Modulith's event-driven architecture.

## Alternatives Considered

| Alternative | Pros | Cons |
|-------------|------|------|
| **Keep inline classes** | Zero refactoring cost | Inconsistent with hexagonal pattern; violates module conventions |
| **Full CQRS with separate index** | Best search performance | Over-engineered for current needs; requires Elasticsearch/OpenSearch |
| **Database `LIKE` queries only** | Simplest implementation | Poor search quality; no ranking/scoring |

## Trade-offs

- **Refactoring cost vs. consistency**: Moving two classes is ~30 minutes of work. The benefit is a consistent module structure across all 14+ backend modules, which reduces cognitive load for new developers and enables tooling (Modulith verification, package structure checks).
- **Inner classes vs. top-level classes**: Inner classes in Java are appropriate for tightly coupled implementation details, but `SearchResult` and `SearchProvider` are part of the module's public API surface. Top-level classes make them visible to `@ComponentScan` and allow independent testing.
- **Direct module access vs. event-based**: The current implementation uses direct module access (each provider is a Spring bean injected into `GlobalSearchService`). Moving to events in the future would decouple search indexing from business logic. For now, direct access via providers is acceptable.

## Consequences

1. **`SearchResult` becomes a proper domain value object** in `domain/model/` with its own file
2. **`SearchProvider` becomes a domain port interface** in `domain/port/` that external modules implement
3. **`GlobalSearchService` loses its inner classes** and depends on imports from the new packages
4. **SearchController imports change** from `GlobalSearchService.SearchResult` to `SearchResult`
5. **Backward compatibility**: The refactoring is purely structural — field names, method signatures, and JSON serialization remain identical
6. **No runtime impact**: The refactoring is compile-time only; all Spring bean wiring remains unchanged

## References

- GlobalSearchService.java: Current implementation with inline SearchResult and SearchProvider
- SearchController.java: Current controller referencing GlobalSearchService.SearchResult
- design/ domain model: Reference hexagonal structure (Canvas.java in domain/model/, CanvasRepository in domain/port/)
- ADR-008: Native Observability (established hexagonal conventions)
