# ADR-014: Catalog Version History & Publish Workflow

**Status**: Implemented
**Date**: 2026-06-20
**Author**: Principal Architect Agent

## Context

CloudBuilder Platform module allows users to browse and use infrastructure templates (CatalogItems). However, there was no mechanism to track changes to catalog items over time. When an item was updated, the previous state was lost. Additionally, all items were implicitly "active" with no distinction between draft and published versions.

As the platform enters Q4 2026 (Intelligence phase) with Platform v1, the catalog needs:

1. **Version history** — Track every modification to a catalog item with auto-incrementing versions
2. **Publish workflow** — Separate draft (in-progress) from published (stable) items
3. **Granular frontend controls** — Admin-only publish/unpublish, version history visible to all roles (viewer+)

## Problem

How to add version tracking and publish workflow to the Platform catalog without breaking existing catalog CRUD operations, introducing heavy dependencies, or requiring schema migrations with downtime?

## Decision

### 1. CatalogItemVersion Entity (New)

**Chosen**: New `CatalogItemVersion` JPA entity with a `@ManyToOne` relationship to `CatalogItem`.

```java
@Entity
@Table(name = "catalog_item_versions")
public class CatalogItemVersion {
    @Id private String id;
    @ManyToOne(fetch = LAZY) private CatalogItem item;
    private int version;
    private String status;        // "DRAFT" or "PUBLISHED"
    private String nameSnapshot;
    private String descriptionSnapshot;
    private String schemaSnapshot;
    private Instant createdAt;
}
```

**Alternatives considered**:
- JSON column in CatalogItem for version array (violates 1NF, hard to query)
- Separate version table with item_id + version composite key (more complex joins for history)
- Event sourcing with separate event store (overkill for simple version tracking)

**Rationale**: A separate entity with snapshot columns preserves the exact state at each version. The `LAZY` fetch prevents N+1 on catalog listing. Auto-generated UUID strings (matching existing pattern) prevent composite key complexity.

**Consequences**: One new table, one new entity. Every catalog update writes one version row. Snapshot columns duplicate data but provide point-in-time accuracy.

### 2. Auto-Bump on Update

**Chosen**: `CatalogService.updateItem()` automatically bumps the patch version (e.g., `1.0.0` → `1.0.1`) and creates a new `CatalogItemVersion` record.

```java
public CatalogItem updateItem(String id, String name, String description, String schema) {
    var item = getItem(id);
    if (name != null && !name.isBlank()) item.setName(name);
    if (description != null) item.setDescription(description);
    if (schema != null) item.setSchema(schema);

    var nextVersion = bumpPatch(item.getVersion());
    item.setVersion(nextVersion);

    var saved = repository.save(item);
    versionRepository.save(new CatalogItemVersion(saved));
    return saved;
}
```

**Alternatives considered**:
- Manual version specification (error-prone, requires API contract change)
- SemVer validation with major.minor.patch parsing (over-parsed for internal catalog)
- Full version diffing (expensive, not needed for history display)

**Rationale**: Auto-bump patch simplifies the API. Users don't need to track versions. The `bumpPatch()` method splits on `.`, increments the last segment, and rejoins.

**Consequences**: Existing `PUT /platform/catalog/{id}` now creates a version row. API response unchanged (backward compatible). Version numbers increment monotonically.

### 3. Publish / Unpublish Workflow

**Chosen**: Two dedicated endpoints that toggle `CatalogItem.status` between `"ACTIVE"` and `"ARCHIVED"`.

```
POST /api/v1/platform/catalog/{id}/publish   → status = "ACTIVE"
POST /api/v1/platform/catalog/{id}/unpublish → status = "ARCHIVED"
```

Additionally, the latest `CatalogItemVersion` for the item gets its own `status` updated to `"PUBLISHED"` or `"DRAFT"` to track per-version publish state.

**Alternatives considered**:
- Status enum in a dedicated state machine (extra complexity for 2 states)
- Soft-delete for unpublished items (mixes concerns)
- Role-based visibility filtering on status (frontend handles display, backend stores data)

**Rationale**: Two-state workflow (unpublished/published) maps directly to the ACID model. Frontend filters display based on role — viewers see published only, editors/admins see all.

**Consequences**: Viewers don't see unpublished items in the catalog listing. Admins can publish/unpublish from the detail panel.

### 4. Frontend: platformStore

**Chosen**: New `usePlatformStore` Zustand store with catalog + version + publish state.

```
platformStore:
  ├── catalog: CatalogItem[]
  ├── selectedItem: CatalogItem | null
  ├── versionHistory: CatalogItemVersion[]
  ├── versionHistoryLoading: boolean
  ├── loadCatalog()
  ├── selectItem(item)
  ├── loadVersionHistory(itemId)
  ├── publishItem(itemId)
  └── unpublishItem(itemId)
```

**Alternatives considered**:
- Inline state in PlatformModule (mixed concerns, state lost on unmount)
- Extension of existing store (no existing platform store existed)

**Rationale**: Dedicated store with clear separation of concerns. Reusable across catalog, marketplace, and future platform features.

**Consequences**: 1 new store file (~80 lines). PlatformModule imports and connects to store.

### 5. Frontend: Version History UI

**Chosen**: Inline version history section in the catalog detail right panel, between the connections list and the "Usar Template" button.

UI elements:
- **Header**: "Histórico de Versões" with HistoryIcon
- **Loading state**: Spinning RefreshCw icon
- **Version rows**: v{number} + status badge (PUBLISHED=green/DRAFT=amber) + date
- **Empty state**: "Nenhum histórico disponível"
- **Truncation**: Shows last 5 versions, "+N versões anteriores" if more
- **Status bar**: Current item status badge + Publish/Unpublish button (admin only)

**Alternatives considered**:
- Modal/popover for version history (extra click, more context switches)
- Full table view (too much vertical space)
- Separate page (navigation overhead)

**Rationale**: Inline display keeps context. The detail panel already shows the item's metadata — version history is a natural extension. Admin-only publish button prevents accidental publishes by viewers/editors.

**Consequences**: The detail panel grows by ~15 lines when populated. Scrollable panel handles overflow.

### 6. TypeScript: TemplateDefinition.status

**Chosen**: Added optional `status?: 'PUBLISHED' | 'DRAFT'` to the existing `TemplateDefinition` interface. The `History` import from lucide-react was renamed to `HistoryIcon` to avoid collision with the browser's native `History` type.

**Rationale**: Backward compatible (optional field). Type narrowing ensures status-aware rendering only when the field is present. The rename prevents a JSX component type error — `History` from lucide-react conflicts with the DOM `History` interface in JSX context.

**Consequences**: 2 type changes in PlatformModule.tsx. No cascading changes to other modules.

## Consequences

1. **1 new JPA entity**: `CatalogItemVersion` with snapshot columns
2. **1 new Spring Data repository**: `CatalogItemVersionRepository`
3. **2 new REST endpoints**: `POST /publish`, `POST /unpublish` in PlatformController
4. **Modified**: `CatalogService.updateItem()` — now auto-bumps version and creates version row
5. **1 new Zustand store**: `platformStore.ts` (~80 lines)
6. **Modified**: `api/platform.ts` — added `getVersionHistory()`, `publishItem()`, `unpublishItem()`
7. **Modified**: `platform.types.ts` — added `CatalogItemVersion` interface
8. **Modified**: `PlatformModule.tsx` — added version history UI, publish workflow, status display, renamed `History` → `HistoryIcon`
9. **Modified**: `CatalogItem.java` — added `setName()`, `setDescription()`, `setSchema()` setters (were missing)
10. **TypeScript**: 0 errors
11. **Vitest**: 73/73 pass (7 test files)
12. **Vite build**: 6.40s clean
13. **Maven compile**: Clean (after adding missing setters)

## References

- CatalogItemVersion.java: New entity with snapshot columns
- CatalogItemVersionRepository.java: JPA repository with `findByItemIdOrderByCreatedAtDesc()`
- CatalogService.java: `updateItem()` auto-bump + version creation, `publishItem()`, `unpublishItem()`
- PlatformController.java: `POST /publish`, `POST /unpublish` endpoints
- platformStore.ts: Zustand store with catalog + version + publish state
- PlatformModule.tsx: Version history UI, publish workflow, status badge
- ADR-013: Previous architecture ADR (LLM Provider Abstraction)
