# ADR-015: Marketplace Browser Architecture

**Status**: Implemented
**Date**: 2026-06-21
**Author**: Principal Architect Agent

## Context

CloudBuilder Platform module already ships with a catalog system (CatalogItem entity, version history via CatalogItemVersion, publish/unpublish workflow). The Marketplace feature needs to allow users to browse community/partner templates and install them.

Existing codebase state:
- `MarketplaceListing.java` — JPA entity with name, description, cloudProvider, listingType, version, status, publisherName, tags, pricing
- `PartnerIntegration.java` — JPA entity with partnerName, description, integrationType, apiEndpoint, status, configuration
- `MarketplaceService.java` — CRUD for listings and partners
- `PlatformController.java` — REST endpoints for marketplace (GET/POST /marketplace, POST publish/unpublish) and partners (GET/POST /partners, POST activate, PUT config)
- `PlatformModule.tsx` — Catalog browser with detail panel, version history, compliance, publish workflow (1090 lines)

## Problem

Where should the Marketplace browser UI live — as a new standalone module, a tab within PlatformModule, or a sub-route?

## Decision

### 1. Tab within PlatformModule (not separate module)

**Chosen**: Marketplace browser as a 3rd tab within PlatformModule alongside "Catálogo" and in a new "Políticas" tab.

**Alternatives considered**:
- Separate MarketplaceModule (isolated but new module entry, duplicate navigation, separate store)
- Sub-route with React Router (not in existing stack — stack uses uiStore tabs)
- Modal overlay on top of catalog (limited space, poor UX for browsing)

**Rationale**:
1. PlatformModule already handles multiple views internally (template grid, detail panel, compliance)
2. MarketplaceListing and CatalogItem are the same bounded context (platform)
3. ObserveModule precedent — tabs for Service Map, Scorecards, Health, Metrics, Traces
4. Avoid module proliferation — 13 frontend modules is already significant
5. Shared store possible (platformStore already has catalog state — extend for marketplace)

**Consequences**: PlatformModule grows beyond 1090 lines. Manageable with internal component extraction.

### 2. Install Wizard: 2-step Dialog

**Chosen**: Dialog-based install wizard with 2 steps — version selection → deployment confirmation. Reuses existing `ConfirmDialog` pattern from the module.

**Rationale**: 2 steps is sufficient for template installation. No multi-page wizard needed. ConfirmDialog is already used in ProvisionModule for deployment confirmation.

**Consequences**: No new navigation state. Dialog is modal — user must complete or cancel before continuing.

### 3. Ratings: Lightweight (no Review entity)

**Chosen**: Add `rating` (Double) and `reviewCount` (Integer) columns to MarketplaceListing entity. No separate Review entity.

**Alternatives considered**:
- Separate Review entity with full CRUD (normalized but premature for MVP)
- External rating system (YAGNI)
- No ratings at all (misses marketplace UX expectation)

**Rationale**: Ratings are display-only for MVP. A separate Review entity would need CRUD endpoints, moderation, pagination, user association — unnecessary complexity before adoption justifies it. A simple avg rating + count stored directly on the listing is sufficient.

**Consequences**: Rating/review history not tracked. Adding full review system later requires migration, but the data model is simple enough that adding a Review table later is straightforward.

### 4. Marketplace data: Extend platformStore (not new store)

**Chosen**: Extend the existing `usePlatformStore` Zustand store with marketplace listings, partners, loading states, and handlers.

**Alternatives considered**:
- New `marketplaceStore.ts` (cleaner separation but duplicate store wiring)
- Component-local state (lost on tab switch, no caching)

**Rationale**: platformStore already manages catalog state — marketplace listing is a logical extension. Having two stores for related data would require coordinated loading patterns.

**Consequences**: platformStore grows. If it exceeds 200 lines, extract marketplace state into a slice or sub-store in a future refactor.

## Consequences

1. **Frontend**: PlatformModule.tsx gains a 3-tab layout (Catálogo, Marketplace, Políticas)
2. **Frontend**: New MarketplaceView component (listing grid + filtering + install wizard)
3. **Frontend**: PartnersView component (table + CRUD dialogs)
4. **Frontend**: platformStore extended with marketplace list/partners/loading states
5. **Backend**: MarketplaceListing gains `rating` and `reviewCount` columns
6. **No new modules or routes**

## References

- MarketplaceListing.java: Existing entity (95 lines)
- PartnerIntegration.java: Existing entity (78 lines)
- MarketplaceService.java: Existing service (93 lines)
- PlatformController.java: Existing marketplace/partner endpoints (157 lines)
- PlatformModule.tsx: Existing catalog browser (1090 lines)
- ObserveModule.tsx: Precedent for multi-tab module architecture
- ADR-014: Catalog Version History (previous platform ADR)
